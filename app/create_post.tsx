
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
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

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

const amenities = [
  'Printing',
  'Wi-Fi / Internet',
  'Computer Access',
  'Coffee',
  'Power Outlets',
  'Quiet Environment',
  'Group Study',
  'Food Nearby',
];

export default function CreatePostScreen() {
  const [location, setLocation] = useState('');
  const [story, setStory] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  }

  async function selectPhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to add a picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  }

  function clearForm() {
    setLocation('');
    setStory('');
    setRoomNumber('');
    setPhoto(null);
    setSelectedAmenities([]);
  }

  async function submitPost() {
    if (!location.trim() || !story.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter a location and description.'
      );
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('authToken');

      if (!token) {
        Alert.alert(
          'Sign In Required',
          'Please sign in before submitting a recommendation.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => router.push('/login'),
            },
          ]
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location_name: location.trim(),
          description: story.trim(),
          room_number: roomNumber.trim() || null,
          amenities: selectedAmenities,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            'Session Expired',
            'Please sign in again before submitting your recommendation.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign In',
                onPress: () => router.push('/login'),
              },
            ]
          );
          return;
        }

        throw new Error(
          data.message || 'Unable to submit your recommendation.'
        );
      }

      Alert.alert(
        data.moderation_status === 'approved'
          ? 'Recommendation Published!'
          : 'Recommendation Submitted!',
        data.moderation_status === 'approved'
          ? 'Your recommendation is now available for other students to see!'
          : 'Thank you! Your recommendation has been submitted and is awaiting administrator review.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearForm();
              router.replace('/');
            },
          },
        ]
      );

    } catch (error) {
      console.error('Recommendation submission error:', error);

      Alert.alert(
        'Submission Failed',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Location</Text>

        <Pressable
          onPress={() => router.push('/login')}
          style={styles.signIn}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>
            Recommend a Study Location
          </Text>

          <Text style={styles.subtitle}>
            Know a great place to study on campus? Share it with other
            NMSU students!
          </Text>

          <Text style={styles.note}>
            Suitable recommendations may be published automatically.
            Others may be sent to the team for review before appearing
            in the app.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Location Name *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter building or studyroom"
            placeholderTextColor="#777777"
            maxLength={150}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.storyInput]}
            value={story}
            onChangeText={setStory}
            placeholder="Describe this study location and what makes it useful for studying"
            placeholderTextColor="#777777"
            multiline
          />

          <Text style={styles.label}>Room Number (Optional)</Text>
          <TextInput
            style={styles.input}
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="Enter room number if applicable"
            placeholderTextColor="#777777"
          />

          <Text style={styles.label}>Available Amenities</Text>

          <Text style={styles.amenityDescription}>
            Select any features available at this study location.
          </Text>

          <View style={styles.amenitiesContainer}>
            {amenities.map((amenity) => {
              const selected = selectedAmenities.includes(amenity);

              return (
                <Pressable
                  key={amenity}
                  onPress={() => toggleAmenity(amenity)}
                  style={[
                    styles.amenityOption,
                    selected && styles.amenityOptionSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selected && styles.checkboxSelected,
                    ]}
                  >
                    {selected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.amenityText,
                      selected && styles.amenityTextSelected,
                    ]}
                  >
                    {amenity}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.selectionCount}>
            {selectedAmenities.length} amenities selected
          </Text>

          <Text style={styles.label}>Add a Photo (Optional)</Text>

          {photo ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo }}
                style={styles.photoPreview}
                resizeMode="cover"
              />

              <Pressable
                style={styles.removePhoto}
                onPress={() => setPhoto(null)}
              >
                <Text style={styles.removePhotoText}>
                  Remove Photo
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.photoButton}
              onPress={selectPhoto}
            >
              <Text style={styles.photoButtonText}>
                + Choose a Photo
              </Text>
            </Pressable>
          )}

          {photo && (
            <Pressable
              style={styles.changePhotoButton}
              onPress={selectPhoto}
            >
              <Text style={styles.changePhotoText}>
                Change Photo
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.clearButton}
            onPress={clearForm}
            disabled={submitting}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>

          <Pressable
            style={[
              styles.submitButton,
              submitting && styles.disabledButton,
            ]}
            onPress={submitPost}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                Submit Recommendation
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.replace('/')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Home</Text>
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
  signIn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  signInText: {
    fontSize: 13,
    color: '#8B1E2D',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  intro: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
    marginTop: 10,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDD8',
  },
  label: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    minHeight: 42,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#D0C9C5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222222',
  },
  storyInput: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  amenityDescription: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  amenityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#D0C9C5',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    width: '48%',
    minHeight: 48,
  },
  amenityOptionSelected: {
    backgroundColor: '#F7EDEF',
    borderColor: '#8B1E2D',
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#A9A29D',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#8B1E2D',
    borderColor: '#8B1E2D',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  amenityText: {
    color: '#444444',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  amenityTextSelected: {
    color: '#8B1E2D',
    fontWeight: '700',
  },
  selectionCount: {
    color: '#777777',
    fontSize: 12,
    marginTop: 10,
  },
  photoButton: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 22,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#8B1E2D',
    fontSize: 15,
    fontWeight: '600',
  },
  photoContainer: {
    marginTop: 4,
  },
  photoPreview: {
    width: '100%',
    height: 190,
    borderRadius: 10,
  },
  removePhoto: {
    alignSelf: 'center',
    padding: 10,
  },
  removePhotoText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  changePhotoButton: {
    alignItems: 'center',
    padding: 8,
  },
  changePhotoText: {
    color: '#8B1E2D',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 18,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    paddingVertical: 14,
    borderRadius: 10,
  },
  clearText: {
    color: '#8B1E2D',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#8B1E2D',
    paddingVertical: 14,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 12,
  },
  backText: {
    color: '#8B1E2D',
    fontSize: 15,
  },
});
