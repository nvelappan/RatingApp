require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const validLocations = [
    'zuhl',
    'branson',
    'corbett',
    'native-american',
    'la-vista',
    'hardman-jacobs',
    'garcia'
];

const allowedAmenities = [
    'Printing',
    'Wi-Fi / Internet',
    'Computer Access',
    'Coffee',
    'Power Outlets',
    'Quiet Environment',
    'Group Study',
    'Food Nearby'
];

function isCommunityLocation(id) {
    return /^community-\d+$/.test(id);
}

async function validStudyroom(id) {
    if (validLocations.includes(id)) return true;
    if (!isCommunityLocation(id)) return false;

    const recommendationId = Number(id.replace('community-', ''));
    const [rows] = await pool.execute(
        `SELECT recommendation_id
         FROM recommendations
         WHERE recommendation_id = ? AND status = 'approved'`,
        [recommendationId]
    );
    return rows.length > 0;
}

function parseAmenities(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}


// ==========================================
// TEST SERVER ROUTE
// ==========================================

app.get('/', (req, res) => {
    res.send('Study Finder Backend is running!');
});


// ==========================================
// STUDENT REGISTRATION
// ==========================================

app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (
            typeof full_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide your name, email, and password.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = full_name.trim();

        const passwordHash = await bcrypt.hash(password, 12);

        const sql = `
            INSERT INTO users (full_name, email, password_hash)
            VALUES (?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            normalizedName,
            normalizedEmail,
            passwordHash
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Account created successfully!',
            user: {
                user_id: result.insertId,
                full_name: normalizedName,
                email: normalizedEmail
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.'
            });
        }

        console.error('Registration error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong during registration.'
        });
    }
});


// ==========================================
// STUDENT LOGIN
// ==========================================

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide your email and password.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const sql = `
            SELECT user_id, full_name, email, password_hash, role
            FROM users
            WHERE email = ?
        `;

        const [users] = await pool.execute(sql, [normalizedEmail]);

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing from .env');
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            status: 'success',
            message: 'Login successful!',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role || 'student'
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong during login.'
        });
    }
});


// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in to continue.'
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            status: 'error',
            message: 'Authentication configuration is missing.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                status: 'error',
                message: 'Your session is invalid or expired. Please log in again.'
            });
        }

        req.user = user;
        next();
    });
}


// Optional authentication.
// Allows public review viewing while identifying logged-in voters.

function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !process.env.JWT_SECRET) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (!error) {
            req.user = user;
        }

        next();
    });
}


// ==========================================
// ADMIN AUTHORIZATION
// ==========================================

async function requireAdmin(req, res, next) {
    try {
        const [users] = await pool.execute(
            'SELECT role FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Administrator access required.'
            });
        }
        next();
    } catch (error) {
        console.error('Admin authorization error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Unable to verify administrator permissions.'
        });
    }
}

// ==========================================
// COMMUNITY RECOMMENDATIONS
// ==========================================

app.get('/api/recommendations/approved', async (req, res) => {
    try {
        const [recommendations] = await pool.execute(
            `SELECT recommendation_id, location_name, description,
                    room_number, amenities, created_at
             FROM recommendations
             WHERE status = 'approved'
             ORDER BY created_at DESC`
        );

        res.json({
            status: 'success',
            recommendations: recommendations.map(item => ({
                ...item,
                amenities: parseAmenities(item.amenities),
                studyroom_id: `community-${item.recommendation_id}`
            }))
        });
    } catch (error) {
        console.error('Approved recommendations error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Unable to retrieve community locations.'
        });
    }
});

app.get('/api/recommendations/community/:id', async (req, res) => {
    try {
        const recommendationId = Number(req.params.id);
        if (!Number.isInteger(recommendationId) || recommendationId <= 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid recommendation ID.' });
        }

        const [rows] = await pool.execute(
            `SELECT recommendation_id, location_name, description,
                    room_number, amenities, created_at
             FROM recommendations
             WHERE recommendation_id = ? AND status = 'approved'`,
            [recommendationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Community location not found.' });
        }

        res.json({
            status: 'success',
            recommendation: {
                ...rows[0],
                amenities: parseAmenities(rows[0].amenities),
                studyroom_id: `community-${rows[0].recommendation_id}`
            }
        });
    } catch (error) {
        console.error('Community location error:', error.message);
        res.status(500).json({ status: 'error', message: 'Unable to retrieve this location.' });
    }
});

app.get('/api/admin/recommendations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [recommendations] = await pool.execute(
            `SELECT r.recommendation_id, r.location_name, r.description,
                    r.room_number, r.amenities, r.moderation_reason,
                    r.created_at, u.full_name, u.email
             FROM recommendations r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.status = 'pending'
             ORDER BY r.created_at ASC`
        );

        res.json({
            status: 'success',
            recommendations: recommendations.map(item => ({
                ...item,
                amenities: parseAmenities(item.amenities)
            }))
        });


            } catch (error) {
        console.error('Admin queue error:', error.message);
        res.status(500).json({ status: 'error', message: 'Unable to retrieve pending recommendations.' });
    }
});

app.put('/api/admin/recommendations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const recommendationId = Number(req.params.id);
        const { decision } = req.body;

        if (!Number.isInteger(recommendationId) || recommendationId <= 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid recommendation ID.' });
        }
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ status: 'error', message: 'Decision must be approved or rejected.' });
        }

        const [result] = await pool.execute(
            `UPDATE recommendations
             SET status = ?, reviewed_at = CURRENT_TIMESTAMP,
                 reviewed_by = ?, moderation_reason = NULL
             WHERE recommendation_id = ? AND status = 'pending'`,
            [decision, req.user.user_id, recommendationId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Pending recommendation not found.' });
        }
        res.json({ status: 'success', message: `Recommendation ${decision} successfully.` });
    } catch (error) {
        console.error('Moderation error:', error.message);
        res.status(500).json({ status: 'error', message: 'Unable to update recommendation.' });
    }
});


// ==========================================
// FAVORITES
// ==========================================

// GET: Retrieve the logged-in user's favorites

app.get('/api/my/favorites', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT studyroom_id, created_at
            FROM favorites
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [favorites] = await pool.execute(sql, [
            req.user.user_id
        ]);

        res.json({
            status: 'success',
            favorites
        });

    } catch (error) {
        console.error('Favorites retrieval error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to retrieve your favorites.'
        });
    }
});


// POST: Add a studyroom to favorites

app.post('/api/favorites/:studyroom_id', authenticateToken, async (req, res) => {
    try {
        const { studyroom_id } = req.params;

        if (!await validStudyroom(studyroom_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid studyroom location.'
            });
        }

        const sql = `
            INSERT IGNORE INTO favorites (user_id, studyroom_id)
            VALUES (?, ?)
        `;

        await pool.execute(sql, [
            req.user.user_id,
            studyroom_id
        ]);

        res.json({
            status: 'success',
            message: 'Studyroom added to favorites.'
        });

    } catch (error) {
        console.error('Add favorite error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to add favorite.'
        });
    }
});


// DELETE: Remove a studyroom from favorites

app.delete('/api/favorites/:studyroom_id', authenticateToken, async (req, res) => {
    try {
        const { studyroom_id } = req.params;

        if (!await validStudyroom(studyroom_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid studyroom location.'
            });
        }

        const sql = `
            DELETE FROM favorites
            WHERE user_id = ? AND studyroom_id = ?
        `;

        await pool.execute(sql, [
            req.user.user_id,
            studyroom_id
        ]);

        res.json({
            status: 'success',
            message: 'Studyroom removed from favorites.'
        });

    } catch (error) {
        console.error('Remove favorite error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to remove favorite.'
        });
    }
});


// ==========================================
// RETRIEVE MY REVIEWS
// ==========================================

app.get('/api/my/reviews', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT
                review_id,
                studyroom_id,
                overall_rating,
                environment_rating,
                comfort_rating,
                comment,
                created_at
            FROM reviews
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [reviews] = await pool.execute(sql, [
            req.user.user_id
        ]);

        res.json({
            status: 'success',
            reviews
        });

    } catch (error) {
        console.error('My reviews error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to retrieve your reviews.'
        });
    }
});


// ==========================================
// RETRIEVE MY RECOMMENDATIONS
// ==========================================

app.get('/api/my/recommendations', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT
                recommendation_id,
                location_name,
                description,
                room_number,
                amenities,
                status,
                moderation_reason,
                created_at
            FROM recommendations
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [recommendations] = await pool.execute(sql, [
            req.user.user_id
        ]);

        res.json({
            status: 'success',
            recommendations: recommendations.map(item => ({
                ...item,
                amenities: parseAmenities(item.amenities)
            }))
        });

    } catch (error) {
        console.error('My recommendations error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to retrieve your recommendations.'
        });
    }
});


// ==========================================
// SUBMIT A STUDENT RECOMMENDATION
// ==========================================

app.post('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const { location_name, description, room_number, amenities = [] } = req.body;

        if (typeof location_name !== 'string' || !location_name.trim() || location_name.trim().length > 150) {
            return res.status(400).json({ status: 'error', message: 'Please provide a location name (maximum 150 characters).' });
        }
        if (typeof description !== 'string' || !description.trim() || description.trim().length > 3000) {
            return res.status(400).json({ status: 'error', message: 'Please provide a description of up to 3,000 characters.' });
        }
        if (room_number !== undefined && room_number !== null && typeof room_number !== 'string') {
            return res.status(400).json({ status: 'error', message: 'Invalid room number.' });
        }
        if (!Array.isArray(amenities) || amenities.some(item => typeof item !== 'string' || !allowedAmenities.includes(item))) {
            return res.status(400).json({ status: 'error', message: 'Please select valid study location amenities.' });
        }

        const name = location_name.trim();
        const details = description.trim();
        const selectedAmenities = [...new Set(amenities)];
        let moderationReason = null;

        const [duplicates] = await pool.execute(
            `SELECT recommendation_id
             FROM recommendations
             WHERE LOWER(TRIM(location_name)) = LOWER(TRIM(?))
               AND status IN ('approved', 'pending')
             LIMIT 1`,
            [name]
        );
        if (duplicates.length > 0) moderationReason = 'Possible duplicate location.';
        if (/https?:\/\/|www\./i.test(name + ' ' + details)) {
            moderationReason = 'Contains a link and requires review.';
        }

        const flaggedTerms = ['kill yourself', 'racial slur', 'pornography'];
        if (flaggedTerms.some(term => (name + ' ' + details).toLowerCase().includes(term))) {
            moderationReason = 'Content requires administrator review.';
        }

        const moderationStatus = moderationReason ? 'pending' : 'approved';
        const [result] = await pool.execute(
            `INSERT INTO recommendations (
                user_id, location_name, description, room_number,
                amenities, status, moderation_reason
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.user_id,
                name,
                details,
                room_number ? room_number.trim() : null,
                JSON.stringify(selectedAmenities),
                moderationStatus,
                moderationReason
            ]
        );

        res.status(201).json({
            status: 'success',
            message: moderationStatus === 'approved'
                ? 'Your recommendation has been published!'
                : 'Your recommendation was submitted for administrator review.',
            recommendation_id: result.insertId,
            moderation_status: moderationStatus
        });
    } catch (error) {
        console.error('Recommendation submission error:', error.message);
        res.status(500).json({ status: 'error', message: 'Unable to submit your recommendation.' });
    }
});


// ==========================================
// SUBMIT A STUDENT REVIEW
// ==========================================

app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const {
            studyroom_id,
            overall_rating,
            environment_rating,
            comfort_rating,
            comment
        } = req.body;

        if (
            typeof studyroom_id !== 'string' ||
            !await validStudyroom(studyroom_id)
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid studyroom location.'
            });
        }

        const ratings = [
            overall_rating,
            environment_rating,
            comfort_rating
        ];

        const validRatings = ratings.every(
            rating =>
                Number.isInteger(rating) &&
                rating >= 1 &&
                rating <= 5
        );

        if (!validRatings) {
            return res.status(400).json({
                status: 'error',
                message: 'All ratings must be between 1 and 5.'
            });
        }

        if (
            typeof comment !== 'string' ||
            !comment.trim() ||
            comment.trim().length > 2000
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a review of up to 2,000 characters.'
            });
        }

        const sql = `
            INSERT INTO reviews (
                user_id,
                studyroom_id,
                overall_rating,
                environment_rating,
                comfort_rating,
                comment
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            req.user.user_id,
            studyroom_id,
            overall_rating,
            environment_rating,
            comfort_rating,
            comment.trim()
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Review submitted successfully!',
            review_id: result.insertId
        });

    } catch (error) {
        console.error('Review submission error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to submit your review.'
        });
    }
});

// ==========================================
// EDIT A STUDENT REVIEW
// ==========================================

app.put('/api/reviews/:review_id', authenticateToken, async (req, res) => {
    try {
        const reviewId = Number(req.params.review_id);

        const {
            overall_rating,
            environment_rating,
            comfort_rating,
            comment
        } = req.body;

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID.'
            });
        }

        const ratings = [
            overall_rating,
            environment_rating,
            comfort_rating
        ];

        const validRatings = ratings.every(
            rating =>
                Number.isInteger(rating) &&
                rating >= 1 &&
                rating <= 5
        );

        if (!validRatings) {
            return res.status(400).json({
                status: 'error',
                message: 'All ratings must be between 1 and 5.'
            });
        }

        if (
            typeof comment !== 'string' ||
            !comment.trim() ||
            comment.trim().length > 2000
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a review of up to 2,000 characters.'
            });
        }

        const sql = `
            UPDATE reviews
            SET
                overall_rating = ?,
                environment_rating = ?,
                comfort_rating = ?,
                comment = ?
            WHERE review_id = ?
            AND user_id = ?
        `;

        const [result] = await pool.execute(sql, [
            overall_rating,
            environment_rating,
            comfort_rating,
            comment.trim(),
            reviewId,
            req.user.user_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found or you do not own this review.'
            });
        }

        res.json({
            status: 'success',
            message: 'Review updated successfully.'
        });

    } catch (error) {
        console.error('Review update error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to update review.'
        });
    }
});


// ==========================================
// DELETE A STUDENT REVIEW
// ==========================================

app.delete('/api/reviews/:review_id', authenticateToken, async (req, res) => {
    try {
        const reviewId = Number(req.params.review_id);

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID.'
            });
        }

        const sql = `
            DELETE FROM reviews
            WHERE review_id = ?
            AND user_id = ?
        `;

        const [result] = await pool.execute(sql, [
            reviewId,
            req.user.user_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found or you do not own this review.'
            });
        }

        res.json({
            status: 'success',
            message: 'Review deleted successfully.'
        });

    } catch (error) {
        console.error('Review deletion error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to delete review.'
        });
    }
});


// ==========================================
// MARK REVIEW AS HELPFUL
// ==========================================

app.post('/api/reviews/:review_id/helpful', authenticateToken, async (req, res) => {
    try {
        const reviewId = Number(req.params.review_id);

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID.'
            });
        }

        // Check that the review exists and is not the user's own review.

        const [reviews] = await pool.execute(
            `SELECT user_id FROM reviews WHERE review_id = ?`,
            [reviewId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found.'
            });
        }

        if (Number(reviews[0].user_id) === Number(req.user.user_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'You cannot mark your own review as helpful.'
            });
        }

        const sql = `
            INSERT IGNORE INTO review_helpful_votes
                (review_id, user_id)
            VALUES (?, ?)
        `;

        await pool.execute(sql, [
            reviewId,
            req.user.user_id
        ]);

        res.json({
            status: 'success',
            message: 'Review marked as helpful.'
        });

    } catch (error) {
        console.error('Helpful vote error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to vote for this review.'
        });
    }
});


// ==========================================
// REMOVE HELPFUL VOTE
// ==========================================

app.delete('/api/reviews/:review_id/helpful', authenticateToken, async (req, res) => {
    try {
        const reviewId = Number(req.params.review_id);

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID.'
            });
        }

        await pool.execute(
            `DELETE FROM review_helpful_votes
             WHERE review_id = ? AND user_id = ?`,
            [reviewId, req.user.user_id]
        );

        res.json({
            status: 'success',
            message: 'Helpful vote removed.'
        });

    } catch (error) {
        console.error('Remove helpful vote error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to remove helpful vote.'
        });
    }
});


// ==========================================
// RETRIEVE REVIEWS FOR A STUDYROOM
// ==========================================

app.get('/api/reviews/:studyroom_id', optionalAuthenticateToken, async (req, res) => {
    try {
        const { studyroom_id } = req.params;

        if (!await validStudyroom(studyroom_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid studyroom location.'
            });
        }

        const currentUserId = req.user ? req.user.user_id : null;

        const sql = `
            SELECT
                reviews.review_id,
                reviews.user_id,
                reviews.studyroom_id,
                reviews.overall_rating,
                reviews.environment_rating,
                reviews.comfort_rating,
                reviews.comment,
                reviews.created_at,
                users.full_name,

                (
                    SELECT COUNT(*)
                    FROM review_helpful_votes
                    WHERE review_helpful_votes.review_id = reviews.review_id
                ) AS helpful_count,

                CASE
                    WHEN ? IS NULL THEN 0
                    WHEN EXISTS (
                        SELECT 1
                        FROM review_helpful_votes
                        WHERE review_helpful_votes.review_id = reviews.review_id
                        AND review_helpful_votes.user_id = ?
                    ) THEN 1
                    ELSE 0
                END AS has_voted

            FROM reviews

            JOIN users
                ON reviews.user_id = users.user_id

            WHERE reviews.studyroom_id = ?

            ORDER BY reviews.created_at DESC
        `;

        const [reviews] = await pool.execute(sql, [
            currentUserId,
            currentUserId,
            studyroom_id
        ]);

        res.json({
            status: 'success',
            reviews
        });

    } catch (error) {
        console.error('Review retrieval error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to retrieve reviews.'
        });
    }
});


// ==========================================
// TEST DATABASE CONNECTION
// ==========================================

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'success',
            message: 'Connected to StudyFinder MySQL database!'
        });

    } catch (error) {
        console.error('Database connection error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Database connection failed.'
        });
    }
});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Study Finder backend running on port ${PORT}`);
});