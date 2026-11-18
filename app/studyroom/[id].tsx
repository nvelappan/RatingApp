
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewRadarChart from '@/components/ReviewRadarChart';

import bransonImage from '../../assets/images/Branson.png';
import corbettImage from '../../assets/images/Corbett.jpeg';
import garciaImage from '../../assets/images/Garcia.jpg';
import hardmanImage from '../../assets/images/Hardman.jpeg';
import laVistaImage from '../../assets/images/LaVista.jpeg';
import nativeAmericanImage from '../../assets/images/NA.png';
import zuhlImage from '../../assets/images/Zuhl.png';
import LocationMiniMap from '../../components/LocationMiniMap';


const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

const STUDY_COORDINATES: Record<
  string,
  { latitude: number; longitude: number }
> = {
  zuhl: { latitude: 32.28148, longitude: -106.74964 },
  branson: { latitude: 32.28150, longitude: -106.75210 },
  corbett: {
    latitude: 32.28310706280288,
    longitude: -106.74763390421676,
  },
  'hardman-jacobs': {
    latitude: 32.28248,
    longitude: -106.75122,
  },
  'native-american': {
    latitude: 32.283009803831604,
    longitude: -106.74592109072447,
  },
  'la-vista': {
    latitude: 32.28045,
    longitude: -106.74890,
  },
  garcia: {
    latitude: 32.2821861421539,
    longitude: -106.74769079257787,
  },
};

type Review = {
  review_id: number;
  user_id: number;
  studyroom_id: string;
  overall_rating: number;
  environment_rating: number;
  comfort_rating: number;
  comment: string;
  created_at: string;
  full_name: string;
  helpful_count: number;
  has_voted: number;
};

type Studyroom = {
  name: string;
  description: string;
  rooms: string;
  image: any;
  printing?: boolean;
  amenities?: string[];
};

const studyrooms: Record<string, Studyroom> = {
  zuhl: {
    name: 'Zuhl Library',
    description: 'A place to study, read, and work on assignments at NMSU.',
    rooms: 'Study areas and seating throughout the library.',
    image: zuhlImage,
  },
  branson: {
    name: 'Branson Library',
    description: 'A study space for individual study and group work.',
    rooms: 'Quiet areas and spaces for focused studying.',
    image: bransonImage,
    printing: true,
  },
  corbett: {
    name: 'Corbett Center',
    description: 'A convenient campus location to meet, relax, and study.',
    rooms: 'Common seating and study spaces.',
    image: corbettImage,
  },
  'native-american': {
    name: 'Native American Center',
    description:
      'A campus location offering students a place to study, gather, and connect.',
    rooms: 'Study and gathering spaces available to students.',
    image: nativeAmericanImage,
    printing: true,
  },
  'la-vista': {
    name: 'La Vista Learning Center',
    description:
      'A learning center offering spaces for individual and group study.',
    rooms: 'Study areas and learning spaces for students.',
    image: laVistaImage,
  },
  'hardman-jacobs': {
    name: 'Hardman & Jacobs Undergraduate Learning Center',
    description:
      'A campus learning center with computer labs and study areas.',
    rooms: 'Computer labs and student study areas.',
    image: hardmanImage,
  },
  garcia: {
    name: 'Garcia Center',
    description: 'A student center offering lounge and study spaces.',
    rooms: 'Lounge seating and student study spaces.',
    image: garciaImage,
  },
};

export default function StudyroomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Array.isArray(id) ? id[0] : id;

  const [communityLocation, setCommunityLocation] = useState<{
    name: string;
    description: string;
    rooms: string;
    amenities: string[];
  } | null>(null);

  const [communityLoading, setCommunityLoading] = useState(false);

  const isCommunityLocation = String(locationId || '').startsWith(
    'community-'
  );

  const room = studyrooms[String(locationId).toLowerCase()] ?? {
    name: communityLocation?.name ?? 'Studyroom',
    description:
      communityLocation?.description ?? 'Study location at NMSU.',
    rooms:
      communityLocation?.rooms ??
      'Studyroom information will be added later.',
    image: zuhlImage,
    amenities: communityLocation?.amenities ?? [],
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editOverall, setEditOverall] = useState(5);
  const [editEnvironment, setEditEnvironment] = useState(5);
  const [editComfort, setEditComfort] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const getToken = async () => {
    return await SecureStore.getItemAsync('authToken');
  };

  const fetchReviews = useCallback(async () => {
    if (!locationId) return;

    try {
      setLoading(true);
      setError('');

      const token = await getToken();

      const response = await fetch(
        `${API_URL}/api/reviews/${encodeURIComponent(locationId)}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load reviews.');
      }

      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Review loading error:', err);
      setError('Unable to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadScreen() {
        try {
          const token = await getToken();
          const savedUser = await SecureStore.getItemAsync('user');

          if (active && savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUserId(Number(user.user_id));
          } else if (active) {
            setCurrentUserId(null);
          }

          if (active && isCommunityLocation) {
            setCommunityLoading(true);

            try {
              const recommendationId = String(locationId).replace(
                'community-',
                ''
              );

              const communityResponse = await fetch(
                `${API_URL}/api/recommendations/community/${encodeURIComponent(
                  recommendationId
                )}`
              );

              const communityData = await communityResponse.json();

              if (!communityResponse.ok) {
                throw new Error(
                  communityData.message ||
                    'Unable to load this community location.'
                );
              }

              const recommendation = communityData.recommendation;

              if (active && recommendation) {
                setCommunityLocation({
                  name: recommendation.location_name,
                  description: recommendation.description,
                  rooms: recommendation.room_number
                    ? `Room: ${recommendation.room_number}`
                    : 'Community-recommended study location.',
                  amenities: Array.isArray(recommendation.amenities)
                    ? recommendation.amenities
                    : [],
                });
              }
            } catch (communityError) {
              console.error(
                'Community location loading error:',
                communityError
              );

              if (active) {
                setError('Unable to load this community location.');
              }
            } finally {
              if (active) setCommunityLoading(false);
            }
          } else if (active) {
            setCommunityLocation(null);
          }

          if (active) {
            await fetchReviews();
          }

          if (!token || !locationId) {
            if (active) setIsFavorite(false);
            return;
          }

          const response = await fetch(`${API_URL}/api/my/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            const favorites = data.favorites || [];

            if (active) {
              setIsFavorite(
                favorites.some(
                  (favorite: any) =>
                    favorite.studyroom_id === locationId
                )
              );
            }
          }
        } catch (err) {
          console.error('Studyroom loading error:', err);
        }
      }

      loadScreen();

      return () => {
        active = false;
      };
    }, [locationId, fetchReviews, isCommunityLocation])
  );

  async function toggleFavorite() {
    if (favoriteLoading || !locationId) return;

    try {
      setFavoriteLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to save favorite study locations.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/login') },
          ]
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/favorites/${locationId}`,
        {
          method: isFavorite ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update favorite.');
      }

      setIsFavorite(!isFavorite);
    } catch (err) {
      Alert.alert(
        'Favorite Error',
        err instanceof Error ? err.message : 'Unable to update favorite.'
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function toggleHelpful(review: Review) {
    if (votingReviewId !== null) return;

    const token = await getToken();

    if (!token) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to mark reviews as helpful.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (Number(review.user_id) === currentUserId) {
      Alert.alert('Your Review', 'You cannot vote on your own review.');
      return;
    }

    try {
      setVotingReviewId(review.review_id);

      const response = await fetch(
        `${API_URL}/api/reviews/${review.review_id}/helpful`,
        {
          method: Number(review.has_voted) === 1 ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update helpful vote.');
      }

      await fetchReviews();
    } catch (err) {
      Alert.alert(
        'Helpful Vote Error',
        err instanceof Error ? err.message : 'Unable to update vote.'
      );
    } finally {
      setVotingReviewId(null);
    }
  }

  function startEditing(review: Review) {
    setEditingReviewId(review.review_id);
    setEditOverall(review.overall_rating);
    setEditEnvironment(review.environment_rating);
    setEditComfort(review.comfort_rating);
    setEditComment(review.comment);
  }

  function cancelEditing() {
    setEditingReviewId(null);
    setEditComment('');
  }

  async function saveReviewEdit() {
    if (!editingReviewId || savingEdit) return;

    if (!editComment.trim()) {
      Alert.alert('Missing Review', 'Please enter a review comment.');
      return;
    }

    try {
      setSavingEdit(true);

      const token = await getToken();

      if (!token) {
        Alert.alert('Sign In Required', 'Please sign in again.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/reviews/${editingReviewId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            overall_rating: editOverall,
            environment_rating: editEnvironment,
            comfort_rating: editComfort,
            comment: editComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update review.');
      }

      Alert.alert('Success', 'Your review has been updated.');

      setEditingReviewId(null);
      await fetchReviews();
    } catch (err) {
      Alert.alert(
        'Update Error',
        err instanceof Error ? err.message : 'Unable to update review.'
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteReview(reviewId: number) {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();

              if (!token) {
                Alert.alert('Sign In Required', 'Please sign in again.');
                return;
              }

              const response = await fetch(
                `${API_URL}/api/reviews/${reviewId}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || 'Unable to delete review.');
              }

              if (editingReviewId === reviewId) {
                cancelEditing();
              }

              Alert.alert('Deleted', 'Your review has been deleted.');
              await fetchReviews();
            } catch (err) {
              Alert.alert(
                'Delete Error',
                err instanceof Error ? err.message : 'Unable to delete review.'
              );
            }
          },
        },
      ]
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (total, review) => total + Number(review.overall_rating),
          0
        ) / reviews.length
      : null;

  const averageEnvironment =
  reviews.length > 0
    ? reviews.reduce(
        (total, review) => total + Number(review.environment_rating),
        0
      ) / reviews.length
    : 0;

const averageComfort =
  reviews.length > 0
    ? reviews.reduce(
        (total, review) => total + Number(review.comfort_rating),
        0
      ) / reviews.length
    : 0;

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Recently posted';
    return parsedDate.toLocaleDateString();
  };

  function renderRatingSelector(
    label: string,
    value: number,
    setValue: (rating: number) => void
  ) {
    return (
      <View style={styles.ratingEditor}>
        <Text style={styles.editorLabel}>{label}</Text>

        <View style={styles.ratingOptions}>
          {[1, 2, 3, 4, 5].map((number) => (
            <Pressable
              key={number}
              onPress={() => setValue(number)}
              style={[
                styles.ratingOption,
                value === number && styles.ratingOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.ratingOptionText,
                  value === number && styles.ratingOptionTextSelected,
                ]}
              >
                {number}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const studyCoordinates =
    STUDY_COORDINATES[String(locationId || '').toLowerCase()];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>NMSU Studyroom Ratings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => router.replace('/')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Home</Text>
        </Pressable>

        <View style={styles.card}>
          {isCommunityLocation ? (
            <View style={styles.communityImagePlaceholder}>
              <Text style={styles.communityImageIcon}>📍</Text>
              <Text style={styles.communityImageLabel}>
                Community Study Location
              </Text>
            </View>
          ) : (
            <Image
              source={room.image}
              style={styles.locationImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.titleRow}>
            <Text style={styles.locationName}>{room.name}</Text>

            <Pressable
              onPress={toggleFavorite}
              disabled={favoriteLoading}
              style={styles.favoriteButton}
            >
              <Text style={styles.favoriteText}>
                {favoriteLoading
                  ? '...'
                  : isFavorite
                    ? '♥ Saved'
                    : '♡ Save'}
              </Text>
            </Pressable>
          </View>

          {reviews.length > 0 && (
            <ReviewRadarChart
              overall={averageRating ?? 0}
              environment={averageEnvironment}
              comfort={averageComfort}
            />
          )}

          <Text style={styles.reviewCount}>
            {reviews.length} student{' '}
            {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>

          {room.printing && (
            <View style={styles.printingTag}>
              <Text style={styles.printingText}>
                🖨 Free Printing Available
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>About this location</Text>
          <Text style={styles.description}>{room.description}</Text>

          <Text style={styles.sectionTitle}>
            {isCommunityLocation ? 'Location Details' : 'Study areas'}
          </Text>

          <Text style={styles.description}>{room.rooms}</Text>

          {!isCommunityLocation && studyCoordinates && (
            <>
              <Text style={styles.sectionTitle}>Find this location</Text>

              <LocationMiniMap
                latitude={studyCoordinates.latitude}
                longitude={studyCoordinates.longitude}
                label={room.name}
                markerType="study"
              />
            </>
          )}

          {isCommunityLocation && (
            <>
              <Text style={styles.sectionTitle}>Reported Amenities</Text>

              {communityLoading ? (
                <ActivityIndicator color="#8B1E2D" />
              ) : communityLocation?.amenities.length ? (
                <View style={styles.communityAmenities}>
                  {communityLocation.amenities.map((amenity) => (
                    <View key={amenity} style={styles.communityAmenityTag}>
                      <Text style={styles.communityAmenityText}>
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.description}>
                  No amenities were provided.
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Student Reviews ({reviews.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B1E2D" />
              <Text style={styles.description}>
                Loading student reviews...
              </Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : reviews.length > 0 ? (
            reviews.map((review) => {
              const isMyReview =
                currentUserId !== null &&
                Number(review.user_id) === currentUserId;

              const isEditing = editingReviewId === review.review_id;

              return (
                <View style={styles.review} key={review.review_id}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>
                      {review.full_name}
                      {isMyReview ? ' (You)' : ''}
                    </Text>

                    <Text style={styles.reviewDate}>
                      {formatDate(review.created_at)}
                    </Text>
                  </View>

                  <Text style={styles.reviewStars}>
                    {'★'.repeat(review.overall_rating)}
                    {'☆'.repeat(5 - review.overall_rating)}
                  </Text>

                  <Text style={styles.reviewCategory}>
                    Study Environment: {review.environment_rating}/5
                  </Text>

                  <Text style={styles.reviewCategory}>
                    Comfort: {review.comfort_rating}/5
                  </Text>

                  <Text style={styles.description}>{review.comment}</Text>

                  {isMyReview ? (
                    <View style={styles.ownerActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() =>
                          isEditing
                            ? cancelEditing()
                            : startEditing(review)
                        }
                      >
                        <Text style={styles.editButtonText}>
                          {isEditing ? 'Cancel Edit' : '✎ Edit Review'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => deleteReview(review.review_id)}
                      >
                        <Text style={styles.deleteButtonText}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={[
                        styles.helpfulButton,
                        Number(review.has_voted) === 1 &&
                          styles.helpfulButtonActive,
                      ]}
                      disabled={votingReviewId === review.review_id}
                      onPress={() => toggleHelpful(review)}
                    >
                      <Text
                        style={[
                          styles.helpfulText,
                          Number(review.has_voted) === 1 &&
                            styles.helpfulTextActive,
                        ]}
                      >
                        {votingReviewId === review.review_id
                          ? 'Updating...'
                          : Number(review.has_voted) === 1
                            ? '✓ Helpful'
                            : '♡ Helpful'}{' '}
                        ({Number(review.helpful_count) || 0})
                      </Text>
                    </Pressable>
                  )}

                  {isEditing && (
                    <View style={styles.editPanel}>
                      <Text style={styles.editPanelTitle}>
                        Edit Your Review
                      </Text>

                      {renderRatingSelector(
                        'Overall Rating',
                        editOverall,
                        setEditOverall
                      )}

                      {renderRatingSelector(
                        'Study Environment',
                        editEnvironment,
                        setEditEnvironment
                      )}

                      {renderRatingSelector(
                        'Comfort',
                        editComfort,
                        setEditComfort
                      )}

                      <Text style={styles.editorLabel}>Your Comment</Text>

                      <TextInput
                        style={styles.commentInput}
                        value={editComment}
                        onChangeText={setEditComment}
                        multiline
                        maxLength={2000}
                        placeholder="Update your review..."
                        placeholderTextColor="#999999"
                        textAlignVertical="top"
                      />

                      <Text style={styles.characterCount}>
                        {editComment.length}/2000 characters
                      </Text>

                      <Pressable
                        style={styles.saveEditButton}
                        onPress={saveReviewEdit}
                        disabled={savingEdit}
                      >
                        <Text style={styles.saveEditText}>
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.description}>
              No reviews yet. Be the first to share your experience!
            </Text>
          )}
        </View>

        <Pressable
          style={styles.createPostButton}
          onPress={() =>
            router.push({
              pathname: '/write_review',
              params: { id: String(locationId) },
            })
          }
        >
          <Text style={styles.createPostText}>+ Write a Review</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 12,
  },
  backText: {
    color: '#8B1E2D',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 18,
  },
  communityImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 18,
    backgroundColor: '#F1EEE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityImageIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  communityImageLabel: {
    color: '#8B1E2D',
    fontSize: 14,
    fontWeight: '600',
  },
  communityAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  communityAmenityTag: {
    backgroundColor: '#F1EEE7',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  communityAmenityText: {
    color: '#555044',
    fontSize: 13,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationName: {
    flex: 1,
    fontSize: 25,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
  },
  favoriteButton: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  favoriteText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  rating: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 12,
  },
  printingTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F0E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  printingText: {
    color: '#555044',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 10,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#666666',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: '#B3261E',
    fontSize: 14,
    lineHeight: 22,
  },
  review: {
    borderTopWidth: 1,
    borderTopColor: '#E5E2DE',
    paddingTop: 14,
    marginTop: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999999',
  },
  reviewStars: {
    color: '#D69B24',
    fontSize: 19,
    marginVertical: 6,
    letterSpacing: 2,
  },
  reviewCategory: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 4,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  editButton: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  editButtonText: {
    color: '#8B1E2D',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#B3261E',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#B3261E',
    fontWeight: '600',
    fontSize: 13,
  },
  helpfulButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#D8D4CE',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 12,
  },
  helpfulButtonActive: {
    backgroundColor: '#F5E9EB',
    borderColor: '#8B1E2D',
  },
  helpfulText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 13,
  },
  helpfulTextActive: {
    color: '#8B1E2D',
  },
  editPanel: {
    backgroundColor: '#F8F7F4',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E0DDD8',
  },
  editPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B1E2D',
    marginBottom: 12,
  },
  ratingEditor: {
    marginBottom: 12,
  },
  editorLabel: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingOption: {
    width: 38,
    height: 36,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D8D4CE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingOptionSelected: {
    backgroundColor: '#8B1E2D',
    borderColor: '#8B1E2D',
  },
  ratingOptionText: {
    color: '#555555',
    fontWeight: '600',
  },
  ratingOptionTextSelected: {
    color: '#FFFFFF',
  },
  commentInput: {
    minHeight: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D4CE',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
  },
  characterCount: {
    textAlign: 'right',
    color: '#999999',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 12,
  },
  saveEditButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createPostButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  createPostText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
