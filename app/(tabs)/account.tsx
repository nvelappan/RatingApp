
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

type User = {
  user_id: number;
  full_name: string;
  email: string;
  role?: string;
};

type Review = {
  review_id: number;
  studyroom_id: string;
  overall_rating: number;
  environment_rating: number;
  comfort_rating: number;
  comment: string;
  created_at: string;
};

type Recommendation = {
  recommendation_id: number;
  location_name: string;
  description: string;
  room_number: string | null;
  amenities?: string[];
  moderation_reason?: string | null;
  status: string;
  created_at: string;
};

type Favorite = {
  studyroom_id: string;
  created_at: string;
};

const locationNames: Record<string, string> = {
  zuhl: 'Zuhl Library',
  branson: 'Branson Library',
  corbett: 'Corbett Center',
  'native-american': 'Native American Center',
  'la-vista': 'La Vista Learning Center',
  'hardman-jacobs': 'Hardman & Jacobs',
  garcia: 'Garcia Center',
};

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleDateString();
}

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = await SecureStore.getItemAsync('authToken');
      const savedUser = await SecureStore.getItemAsync('user');

      if (!token || !savedUser) {
        setUser(null);
        setReviews([]);
        setRecommendations([]);
        setFavorites([]);
        return;
      }

      const parsedUser = JSON.parse(savedUser) as User;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        reviewResponse,
        recommendationResponse,
        favoriteResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/my/reviews`, { headers }),
        fetch(`${API_URL}/api/my/recommendations`, { headers }),
        fetch(`${API_URL}/api/my/favorites`, { headers }),
      ]);

      const responses = [
        reviewResponse,
        recommendationResponse,
        favoriteResponse,
      ];

      if (
        responses.some(
          response =>
            response.status === 401 || response.status === 403
        )
      ) {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('user');

        setUser(null);
        setReviews([]);
        setRecommendations([]);
        setFavorites([]);
        setError('Your session has expired. Please sign in again.');
        return;
      }

      if (responses.some(response => !response.ok)) {
        throw new Error('Unable to load your account activity.');
      }

      const [
        reviewData,
        recommendationData,
        favoriteData,
      ] = await Promise.all([
        reviewResponse.json(),
        recommendationResponse.json(),
        favoriteResponse.json(),
      ]);

      setUser(parsedUser);
      setReviews(reviewData.reviews || []);
      setRecommendations(recommendationData.recommendations || []);
      setFavorites(favoriteData.favorites || []);

    } catch (err) {
      console.error('Account loading error:', err);
      setError(
        'Unable to load your account. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [loadAccount])
  );

  async function logout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('user');

            setUser(null);
            setReviews([]);
            setRecommendations([]);
            setFavorites([]);

            router.replace('/login');
          },
        },
      ]
    );
  }

  function getStatusStyle(status: string) {
    switch (status.toLowerCase()) {
      case 'approved':
        return styles.approved;
      case 'rejected':
        return styles.rejected;
      default:
        return styles.pending;
    }
  }

  function openFavorite(favorite: Favorite) {
    router.push({
      pathname: '/studyroom/[id]',
      params: { id: favorite.studyroom_id },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B1E2D" />
          <Text style={styles.loadingText}>
            Loading your account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            You're not signed in
          </Text>

          <Text style={styles.emptyDescription}>
            Sign in to view your account, reviews, and recommendations.
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>

        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.studentName}>
            {user.full_name}
          </Text>

          <Text style={styles.email}>{user.email}</Text>

          <Text style={styles.memberLabel}>
            {isAdmin
              ? 'STUDY FINDER ADMINISTRATOR'
              : 'NMSU STUDY FINDER MEMBER'}
          </Text>
        </View>

        {/* Administrator Dashboard */}
        {isAdmin && (
          <Pressable
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.adminButtonInfo}>
              <Text style={styles.adminButtonTitle}>
                Administrator Dashboard
              </Text>

              <Text style={styles.adminButtonDescription}>
                Review and manage student study location recommendations.
              </Text>
            </View>

            <Text style={styles.adminArrow}>›</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>My Activity</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {reviews.length}
            </Text>
            <Text style={styles.statLabel}>My Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {recommendations.length}
            </Text>
            <Text style={styles.statLabel}>
              Recommendations
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Favorites</Text>
          <Text style={styles.favoriteCount}>
            ♥ {favorites.length}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>
              No favorites yet
            </Text>
            <Text style={styles.emptyCardText}>
              Tap the heart on any studyroom to save it here.
            </Text>
          </View>
        ) : (
          favorites.map(favorite => (
            <Pressable
              key={favorite.studyroom_id}
              style={styles.favoriteCard}
              onPress={() => openFavorite(favorite)}
            >
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>
                  {locationNames[favorite.studyroom_id] ||
                    favorite.studyroom_id}
                </Text>

                <Text style={styles.favoriteDescription}>
                  View study location and student reviews
                </Text>
              </View>

              <Text style={styles.favoriteHeart}>♥</Text>
              <Text style={styles.favoriteArrow}>›</Text>
            </Pressable>
          ))
        )}

        <Text style={styles.sectionTitle}>My Reviews</Text>

        {reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>
              No reviews yet
            </Text>
            <Text style={styles.emptyCardText}>
              Your studyroom reviews will appear here.
            </Text>
          </View>
        ) : (
          reviews.map(review => (
            <View key={review.review_id} style={styles.activityCard}>
              <Text style={styles.activityTitle}>
                {locationNames[review.studyroom_id] ||
                  review.studyroom_id}
              </Text>

              <Text style={styles.rating}>
                {'★'.repeat(review.overall_rating)}
                {'☆'.repeat(5 - review.overall_rating)}
                {' '}
                {review.overall_rating}/5
              </Text>

              <Text style={styles.comment}>
                {review.comment}
              </Text>

              <Text style={styles.date}>
                {formatDate(review.created_at)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>
          My Recommendations
        </Text>

        {recommendations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>
              No recommendations yet
            </Text>
            <Text style={styles.emptyCardText}>
              Study locations you recommend will appear here.
            </Text>
          </View>
        ) : (
          recommendations.map(recommendation => (
            <View
              key={recommendation.recommendation_id}
              style={styles.activityCard}
            >
              <View style={styles.recommendationHeader}>
                <Text style={styles.activityTitle}>
                  {recommendation.location_name}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(recommendation.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {recommendation.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.comment}>
                {recommendation.description}
              </Text>

              {recommendation.room_number ? (
                <Text style={styles.roomNumber}>
                  Room: {recommendation.room_number}
                </Text>
              ) : null}

              {recommendation.amenities?.length ? (
                <Text style={styles.roomNumber}>
                  Amenities: {recommendation.amenities.join(', ')}
                </Text>
              ) : null}

              {recommendation.moderation_reason ? (
                <Text style={styles.moderationReason}>
                  Review note: {recommendation.moderation_reason}
                </Text>
              ) : null}

              <Text style={styles.date}>
                {formatDate(recommendation.created_at)}
              </Text>
            </View>
          ))
        )}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Pressable
          style={styles.refreshButton}
          onPress={loadAccount}
        >
          <Text style={styles.refreshText}>
            Refresh Account
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  content: {
    width: '100%',
    maxWidth: 750,
    alignSelf: 'center',
    padding: 22,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 14,
    alignItems: 'center',
    padding: 25,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1E5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  studentName: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#222222',
  },
  email: {
    fontSize: 14,
    color: '#777777',
    marginTop: 5,
  },
  memberLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#8B1E2D',
    marginTop: 15,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B1E2D',
    borderRadius: 12,
    padding: 18,
    marginBottom: 25,
  },
  adminButtonInfo: {
    flex: 1,
  },
  adminButtonTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  adminButtonDescription: {
    color: '#F4E7E9',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  adminArrow: {
    color: '#FFFFFF',
    fontSize: 30,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteCount: {
    color: '#8B1E2D',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 17,
    marginBottom: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  favoriteDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
  },
  favoriteHeart: {
    color: '#8B1E2D',
    fontSize: 22,
    marginHorizontal: 12,
  },
  favoriteArrow: {
    color: '#999999',
    fontSize: 26,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 17,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
    flexShrink: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  rating: {
    color: '#B27A18',
    fontSize: 16,
    marginTop: 7,
  },
  comment: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  date: {
    fontSize: 12,
    color: '#888888',
    marginTop: 12,
  },
  roomNumber: {
    fontSize: 13,
    color: '#666666',
    marginTop: 7,
  },
  moderationReason: {
    fontSize: 13,
    color: '#8B1E2D',
    marginTop: 7,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pending: {
    backgroundColor: '#F5EBD4',
  },
  approved: {
    backgroundColor: '#DDEEDF',
  },
  rejected: {
    backgroundColor: '#F3DEDE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#444444',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  emptyCardText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 10,
    paddingHorizontal: 35,
    paddingVertical: 13,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    color: '#B42318',
    textAlign: 'center',
    marginTop: 15,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
});
