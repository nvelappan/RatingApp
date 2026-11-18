
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

type Recommendation = {
  recommendation_id: number;
  location_name: string;
  description: string;
  room_number: string | null;
  amenities: string[];
  moderation_reason: string | null;
  created_at: string;
  full_name: string;
  email: string;
};

export default function AdminScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadRecommendations = useCallback(async () => {
    try {
      setError('');

      const token = await SecureStore.getItemAsync('authToken');

      if (!token) {
        setRecommendations([]);
        setError('Please sign in with an administrator account.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setRecommendations([]);
        setError('Your session has expired. Please sign in again.');
        return;
      }

      if (response.status === 403) {
        setRecommendations([]);
        setError('Administrator access is required to view this page.');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to load pending recommendations.'
        );
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Admin recommendations error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load recommendations.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [loadRecommendations])
  );

  async function refresh() {
    setRefreshing(true);
    await loadRecommendations();
  }

  async function moderateRecommendation(
    recommendationId: number,
    decision: 'approved' | 'rejected'
  ) {
    if (processingId !== null) return;

    const actionLabel =
      decision === 'approved' ? 'approve' : 'reject';

    Alert.alert(
      decision === 'approved'
        ? 'Approve Recommendation'
        : 'Reject Recommendation',
      `Are you sure you want to ${actionLabel} this study location?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: decision === 'approved' ? 'Approve' : 'Reject',
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setProcessingId(recommendationId);

              const token = await SecureStore.getItemAsync('authToken');

              if (!token) {
                throw new Error('Please sign in again.');
              }

              const response = await fetch(
                `${API_URL}/api/admin/recommendations/${recommendationId}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ decision }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || 'Unable to update recommendation.'
                );
              }

              setRecommendations((current) =>
                current.filter(
                  (item) =>
                    item.recommendation_id !== recommendationId
                )
              );

              Alert.alert(
                'Success',
                `Recommendation ${decision} successfully.`
              );
            } catch (err) {
              Alert.alert(
                'Moderation Error',
                err instanceof Error
                  ? err.message
                  : 'Unable to update recommendation.'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Recommendation Moderation
          </Text>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Home</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#8B1E2D"
          />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Pending Recommendations
          </Text>

          <Text style={styles.summaryNumber}>
            {recommendations.length}
          </Text>

          <Text style={styles.summaryDescription}>
            Locations waiting for administrator review
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Review Queue
          </Text>

          <Pressable onPress={refresh} disabled={refreshing}>
            <Text style={styles.refreshText}>
              Refresh
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#8B1E2D" />
            <Text style={styles.statusText}>
              Loading recommendations...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Unable to Access Dashboard
            </Text>

            <Text style={styles.emptyDescription}>
              {error}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.primaryButtonText}>
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={refresh}
            >
              <Text style={styles.secondaryButtonText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : recommendations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✓</Text>

            <Text style={styles.emptyTitle}>
              All Caught Up!
            </Text>

            <Text style={styles.emptyDescription}>
              There are currently no pending recommendations to review.
            </Text>
          </View>
        ) : (
          recommendations.map((item) => {
            const isProcessing =
              processingId === item.recommendation_id;

            return (
              <View
                key={item.recommendation_id}
                style={styles.recommendationCard}
              >
                <View style={styles.cardTop}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      Pending Review
                    </Text>
                  </View>

                  <Text style={styles.dateText}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                <Text style={styles.locationName}>
                  {item.location_name}
                </Text>

                <Text style={styles.description}>
                  {item.description}
                </Text>

                {item.room_number ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Room:
                    </Text>
                    <Text style={styles.detailValue}>
                      {item.room_number}
                    </Text>
                  </View>
                ) : null}

                {item.amenities?.length > 0 && (
                  <View style={styles.amenitySection}>
                    <Text style={styles.detailLabel}>
                      Amenities
                    </Text>

                    <View style={styles.amenityList}>
                      {item.amenities.map((amenity) => (
                        <View
                          key={amenity}
                          style={styles.amenityTag}
                        >
                          <Text style={styles.amenityText}>
                            {amenity}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.submitterSection}>
                  <Text style={styles.submitterTitle}>
                    Submitted By
                  </Text>

                  <Text style={styles.submitterName}>
                    {item.full_name}
                  </Text>

                  <Text style={styles.submitterEmail}>
                    {item.email}
                  </Text>
                </View>

                {item.moderation_reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonTitle}>
                      Review Note
                    </Text>

                    <Text style={styles.reasonText}>
                      {item.moderation_reason}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <Pressable
                    style={[
                      styles.approveButton,
                      isProcessing && styles.disabledButton,
                    ]}
                    onPress={() =>
                      moderateRecommendation(
                        item.recommendation_id,
                        'approved'
                      )
                    }
                    disabled={processingId !== null}
                  >
                    <Text style={styles.actionButtonText}>
                      {isProcessing ? 'Processing...' : '✓ Approve'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.rejectButton,
                      isProcessing && styles.disabledButton,
                    ]}
                    onPress={() =>
                      moderateRecommendation(
                        item.recommendation_id,
                        'rejected'
                      )
                    }
                    disabled={processingId !== null}
                  >
                    <Text style={styles.actionButtonText}>
                      {isProcessing ? 'Processing...' : '✕ Reject'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  headerSubtitle: {
    color: '#777777',
    fontSize: 13,
    marginTop: 3,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#8B1E2D',
    borderRadius: 12,
    padding: 22,
    marginBottom: 24,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  summaryDescription: {
    color: '#F4E7E9',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  refreshText: {
    color: '#8B1E2D',
    fontWeight: '600',
    padding: 8,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statusText: {
    color: '#777777',
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDD8',
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 34,
    color: '#3D8055',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#222222',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 12,
  },
  secondaryButtonText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDD8',
    padding: 18,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: '#F5EEDC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingBadgeText: {
    color: '#86651B',
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    color: '#999999',
    fontSize: 12,
  },
  locationName: {
    color: '#222222',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailLabel: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  detailValue: {
    color: '#666666',
    fontSize: 13,
  },
  amenitySection: {
    marginBottom: 14,
  },
  amenityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  amenityTag: {
    backgroundColor: '#F1EEE7',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  amenityText: {
    color: '#555044',
    fontSize: 12,
  },
  submitterSection: {
    backgroundColor: '#F8F7F4',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  submitterTitle: {
    color: '#444444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  submitterName: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  submitterEmail: {
    color: '#777777',
    fontSize: 12,
    marginTop: 3,
  },
  reasonBox: {
    backgroundColor: '#FFF8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  reasonTitle: {
    color: '#86651B',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  reasonText: {
    color: '#6F5A2A',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34734B',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#A52A2A',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.55,
  },
});
