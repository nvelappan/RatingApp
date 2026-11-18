
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

const locations: Record<string, string> = {
  zuhl: 'Zuhl Library',
  branson: 'Branson Library',
  corbett: 'Corbett Center',
  'native-american': 'Native American Center',
  'la-vista': 'La Vista Learning Center',
  'hardman-jacobs': 'Hardman & Jacobs Undergraduate Learning Center',
  garcia: 'Garcia Center',
};

export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const locationId = Array.isArray(id) ? id[0] : id;
  const locationName = locations[locationId] || 'Study Location';

  const [overallRating, setOverallRating] = useState(0);
  const [environmentRating, setEnvironmentRating] = useState(0);
  const [comfortRating, setComfortRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!locationId || !locations[locationId]) {
      Alert.alert('Error', 'Invalid studyroom location.');
      return;
    }

    if (
      overallRating === 0 ||
      environmentRating === 0 ||
      comfortRating === 0
    ) {
      Alert.alert('Missing Ratings', 'Please complete all three ratings.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert(
        'Missing Review',
        'Please write a few comments about your experience.'
      );
      return;
    }

    try {
      setLoading(true);

      // Retrieve the student's saved login token
      const token = await SecureStore.getItemAsync('authToken');

      if (!token) {
        Alert.alert(
          'Login Required',
          'Please sign in before submitting a review.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/login'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // Send review to the backend
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyroom_id: locationId,
          overall_rating: overallRating,
          environment_rating: environmentRating,
          comfort_rating: comfortRating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');

          Alert.alert(
            'Session Expired',
            'Please sign in again before submitting your review.',
            [
              {
                text: 'Sign In',
                onPress: () => router.replace('/login'),
              },
            ]
          );
          return;
        }

        Alert.alert(
          'Submission Failed',
          data.message || 'Unable to submit your review.'
        );
        return;
      }

      Alert.alert(
        'Review Submitted!',
        'Thank you! Your review has been saved successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error) {
      console.error('Review submission error:', error);

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your connection and try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  const renderRating = (
    title: string,
    rating: number,
    setRating: (value: number) => void
  ) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingTitle}>{title}</Text>

      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            disabled={loading}
          >
            <Text
              style={[
                styles.star,
                star <= rating && styles.selectedStar,
              ]}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.ratingHint}>
        {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} disabled={loading}>
            <Text style={styles.backButton}>‹ Back</Text>
          </Pressable>

          <Text style={styles.heading}>Write a Review</Text>

          <Text style={styles.subtitle}>
            Share your experience and help other NMSU students find their
            ideal study space.
          </Text>

          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>REVIEWING LOCATION</Text>
            <Text style={styles.locationName}>{locationName}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionHeading}>Rate Your Experience</Text>

            {renderRating(
              'Overall Rating',
              overallRating,
              setOverallRating
            )}

            {renderRating(
              'Study Environment',
              environmentRating,
              setEnvironmentRating
            )}

            {renderRating(
              'Comfort',
              comfortRating,
              setComfortRating
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>Your Review</Text>

            <Text style={styles.inputLabel}>
              Tell us about your experience
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="What did you like about this location? How was the noise level, seating, and overall atmosphere?"
              placeholderTextColor="#999999"
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              maxLength={2000}
              editable={!loading}
            />

            <Text style={styles.characterHint}>
              {comment.length}/2000 characters
            </Text>

            <Pressable
              style={[
                styles.submitButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Submit Review
                </Text>
              )}
            </Pressable>

            <Text style={styles.footerText}>
              Your feedback helps the NMSU student community.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    color: '#8B1E2D',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 20,
  },
  heading: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#777777',
    lineHeight: 22,
    marginBottom: 24,
  },
  locationCard: {
    backgroundColor: '#8B1E2D',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationLabel: {
    color: '#E8C9CD',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE7E2',
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 18,
  },
  ratingSection: {
    marginBottom: 22,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    paddingRight: 9,
    paddingVertical: 2,
  },
  star: {
    fontSize: 34,
    color: '#D9D6D1',
  },
  selectedStar: {
    color: '#E5A928',
  },
  ratingHint: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE7E2',
    marginVertical: 8,
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 10,
  },
  textInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#DEDAD4',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FDFCFA',
  },
  characterHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    marginBottom: 22,
  },
  submitButton: {
    backgroundColor: '#8B1E2D',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
    marginTop: 15,
  },
});
