
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import bransonImage from '../../assets/images/Branson.png';
import corbettImage from '../../assets/images/Corbett.jpeg';
import garciaImage from '../../assets/images/Garcia.jpg';
import hardmanImage from '../../assets/images/Hardman.jpeg';
import laVistaImage from '../../assets/images/LaVista.jpeg';
import nativeAmericanImage from '../../assets/images/NA.png';
import zuhlImage from '../../assets/images/Zuhl.png';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

const studyrooms = [
  {
    id: 'zuhl',
    name: 'Zuhl Library',
    description: 'A place to study, read, and work on assignments.',
    image: zuhlImage,
    amenities: [] as string[],
  },
  {
    id: 'branson',
    name: 'Branson Library',
    description: 'A study space for individual and group work.',
    image: bransonImage,
    amenities: ['Printing'],
  },
  {
    id: 'corbett',
    name: 'Corbett Center',
    description: 'A convenient campus location to meet, relax, and study.',
    image: corbettImage,
    amenities: [],
  },
  {
    id: 'native-american',
    name: 'Native American Center',
    description: 'A welcoming campus space for studying and student gatherings.',
    image: nativeAmericanImage,
    amenities: ['Printing'],
  },
  {
    id: 'la-vista',
    name: 'La Vista Learning Center',
    description: 'A learning center offering spaces for individual and group study.',
    image: laVistaImage,
    amenities: [],
  },
  {
    id: 'hardman-jacobs',
    name: 'Hardman & Jacobs Undergraduate Learning Center',
    description: 'A campus learning center with computer labs and study areas.',
    image: hardmanImage,
    amenities: [],
  },
  {
    id: 'garcia',
    name: 'Garcia Center',
    description: 'A student center offering lounge and study spaces.',
    image: garciaImage,
    amenities: [],
  },
];

const amenityFilters = [
  'All Locations',
  'Printing',
  'Wi-Fi / Internet',
  'Computer Access',
  'Coffee',
  'Power Outlets',
  'Quiet Environment',
  'Group Study',
  'Food Nearby',
];

type Review = {
  overall_rating: number;
};

type RatingSummary = {
  average: number;
  count: number;
};

type RatingMap = Record<string, RatingSummary>;

type CommunityLocation = {
  recommendation_id: number;
  studyroom_id: string;
  location_name: string;
  description: string;
  room_number?: string | null;
  amenities: string[];
};

export default function HomeScreen() {
  const [ratings, setRatings] = useState<RatingMap>({});
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState(false);

  const [communityLocations, setCommunityLocations] = useState<
    CommunityLocation[]
  >([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Locations');

  // null means the login status is still being checked.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check login status whenever the homepage comes into focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function checkLoginStatus() {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          const savedUser = await SecureStore.getItemAsync('user');

          if (active) {
            setIsLoggedIn(Boolean(token && savedUser));
          }
        } catch (error) {
          console.error('Login status check error:', error);

          if (active) {
            setIsLoggedIn(false);
          }
        }
      }

      checkLoginStatus();

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    let active = true;

    async function loadHomepage() {
      try {
        setCommunityLoading(true);
        setCommunityError(false);

        const response = await fetch(
          `${API_URL}/api/recommendations/approved`
        );

        if (!response.ok) {
          throw new Error('Unable to retrieve community recommendations.');
        }

        const data = await response.json();

        if (active) {
          setCommunityLocations(data.recommendations || []);
        }
      } catch (error) {
        console.error('Community recommendations error:', error);
        if (active) setCommunityError(true);
      } finally {
        if (active) setCommunityLoading(false);
      }
    }

    loadHomepage();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRatings() {
      try {
        setRatingsLoading(true);
        setRatingsError(false);

        const allLocations = [
          ...studyrooms.map((location) => location.id),
          ...communityLocations.map((location) => location.studyroom_id),
        ];

        const results = await Promise.all(
          allLocations.map(async (id) => {
            const response = await fetch(`${API_URL}/api/reviews/${id}`);

            if (!response.ok) {
              throw new Error(`Unable to load ratings for ${id}`);
            }

            const data = await response.json();
            const reviews: Review[] = data.reviews || [];

            const total = reviews.reduce(
              (sum, review) => sum + Number(review.overall_rating),
              0
            );

            return {
              id,
              average:
                reviews.length > 0
                  ? Math.round((total / reviews.length) * 10) / 10
                  : 0,
              count: reviews.length,
            };
          })
        );

        const summaries: RatingMap = {};

        results.forEach((result) => {
          summaries[result.id] = {
            average: result.average,
            count: result.count,
          };
        });

        if (active) setRatings(summaries);
      } catch (error) {
        console.error('Homepage rating error:', error);
        if (active) setRatingsError(true);
      } finally {
        if (active) setRatingsLoading(false);
      }
    }

    loadRatings();

    return () => {
      active = false;
    };
  }, [communityLocations]);

  function renderRating(locationId: string) {
    if (ratingsLoading) return 'Loading ratings...';
    if (ratingsError) return 'Ratings unavailable';

    const summary = ratings[locationId];

    if (!summary || summary.count === 0) return 'Not rated yet';

    return `⭐ ${summary.average.toFixed(1)}/5 · ${summary.count} ${
      summary.count === 1 ? 'review' : 'reviews'
    }`;
  }

  const search = searchQuery.trim().toLowerCase();

  const filteredLocations = studyrooms.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(search) ||
      location.description.toLowerCase().includes(search);

    const matchesFilter =
      selectedFilter === 'All Locations' ||
      location.amenities.includes(selectedFilter);

    return matchesSearch && matchesFilter;
  });

  const filteredCommunity = communityLocations.filter((location) => {
    const matchesSearch =
      location.location_name.toLowerCase().includes(search) ||
      location.description.toLowerCase().includes(search);

    const matchesFilter =
      selectedFilter === 'All Locations' ||
      location.amenities.includes(selectedFilter);

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>NMSU Studyrooms</Text>

        <Pressable
          onPress={() =>
            router.push(
              isLoggedIn ? '/(tabs)/account' : '/login'
            )
          }
          disabled={isLoggedIn === null}
          style={[
            styles.signInButton,
            isLoggedIn === null && styles.disabledButton,
          ]}
        >
          <Text style={styles.signInText}>
            {isLoggedIn === null
              ? '...'
              : isLoggedIn
                ? 'My Account'
                : 'Sign In'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Studyrooms</Text>

        <Text style={styles.subtitle}>
          Discover and rate your favorite places to study
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search study locations..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {amenityFilters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter === 'Printing' ? '🖨 Printing' : filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>
          Showing {filteredLocations.length + filteredCommunity.length} of{' '}
          {studyrooms.length + communityLocations.length} study locations
        </Text>

        <Pressable
          onPress={() => router.push('/create_post')}
          style={styles.createPostButton}
        >
          <Text style={styles.createPostText}>
            + Recommend a Study Location
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/campus-map')}
          style={styles.mapButton}
        >
          <Text style={styles.mapButtonText}>
            🗺 Explore Campus
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>NMSU Study Locations</Text>

        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <Pressable
              key={location.id}
              style={styles.locationCard}
              onPress={() => router.push(`/studyroom/${location.id}`)}
            >
              <Image
                source={location.image}
                style={styles.locationImage}
                resizeMode="cover"
              />

              <View style={styles.cardInfo}>
                <Text style={styles.locationName}>{location.name}</Text>

                <Text style={styles.description}>
                  {location.description}
                </Text>

                {location.amenities.includes('Printing') && (
                  <View style={styles.featureTag}>
                    <Text style={styles.featureText}>🖨 Printing</Text>
                  </View>
                )}

                <Text style={styles.rating}>
                  {renderRating(location.id)}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsTitle}>
              No NMSU locations found
            </Text>
            <Text style={styles.emptyResultsText}>
              Try another search or select a different amenity.
            </Text>
          </View>
        )}

        <View style={styles.communityHeader}>
          <Text style={styles.sectionTitle}>
            Community Recommendations
          </Text>

          <Text style={styles.communitySubtitle}>
            Study spots recommended by fellow NMSU students.
          </Text>
        </View>

        {communityLoading ? (
          <Text style={styles.statusText}>
            Loading community recommendations...
          </Text>
        ) : communityError ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsTitle}>
              Recommendations unavailable
            </Text>
            <Text style={styles.emptyResultsText}>
              We couldn't load community locations right now. Please try
              again later.
            </Text>
          </View>
        ) : filteredCommunity.length > 0 ? (
          filteredCommunity.map((location) => (
            <Pressable
              key={location.recommendation_id}
              style={styles.communityCard}
              onPress={() =>
                router.push(`/studyroom/${location.studyroom_id}`)
              }
            >
              <View style={styles.communityCardTop}>
                <View style={styles.communityIcon}>
                  <Text style={styles.communityIconText}>📍</Text>
                </View>

                <View style={styles.communityTitleContainer}>
                  <Text style={styles.locationName}>
                    {location.location_name}
                  </Text>
                  <Text style={styles.communityLabel}>
                    Student recommended
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>
                {location.description}
              </Text>

              {location.room_number ? (
                <Text style={styles.roomNumber}>
                  Room: {location.room_number}
                </Text>
              ) : null}

              {location.amenities.length > 0 && (
                <View style={styles.amenityTags}>
                  {location.amenities.map((amenity) => (
                    <View key={amenity} style={styles.amenityTag}>
                      <Text style={styles.amenityTagText}>
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.rating}>
                {renderRating(location.studyroom_id)}
              </Text>

              <Text style={styles.viewDetails}>
                View location and reviews →
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsTitle}>
              {communityLocations.length === 0
                ? 'No community recommendations yet'
                : 'No matching recommendations'}
            </Text>

            <Text style={styles.emptyResultsText}>
              {communityLocations.length === 0
                ? 'Be the first to recommend a new place to study!'
                : 'Try another search or choose a different amenity filter.'}
            </Text>

            <Pressable
              onPress={() => router.push('/create_post')}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>
                Recommend a Location
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => {
            setSearchQuery('');
            setSelectedFilter('All Locations');
          }}
          style={styles.clearFiltersButton}
        >
          <Text style={styles.clearFiltersText}>
            Clear Search and Filters
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
    paddingHorizontal: 28,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },
  appTitle: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B1E2D',
  },
  signInButton: {
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signInText: {
    color: '#8B1E2D',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 25,
    color: '#777777',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
    paddingVertical: 14,
  },
  clearSearch: {
    fontSize: 25,
    color: '#777777',
    paddingHorizontal: 5,
  },
  filterRow: {
    gap: 10,
    paddingBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#D8D3CC',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: '#8B1E2D',
    borderColor: '#8B1E2D',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 16,
  },
  createPostButton: {
    backgroundColor: '#8B1E2D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  createPostText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8B1E2D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 28,
  },
  mapButtonText: {
    color: '#8B1E2D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  locationImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#E5E2DE',
  },
  cardInfo: {
    padding: 20,
  },
  locationName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
  },
  featureTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1EEE7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555044',
  },
  rating: {
    fontSize: 14,
    marginTop: 10,
    color: '#333333',
  },
  communityHeader: {
    marginTop: 22,
    marginBottom: 14,
  },
  communitySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD5CA',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  communityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1EEE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityIconText: {
    fontSize: 20,
  },
  communityTitleContainer: {
    flex: 1,
  },
  communityLabel: {
    fontSize: 12,
    color: '#8B1E2D',
    fontWeight: '600',
  },
  roomNumber: {
    fontSize: 13,
    color: '#555555',
    marginTop: 8,
  },
  amenityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  amenityTag: {
    backgroundColor: '#F1EEE7',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  amenityTagText: {
    fontSize: 12,
    color: '#555044',
    fontWeight: '500',
  },
  viewDetails: {
    color: '#8B1E2D',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#777777',
    paddingVertical: 20,
    textAlign: 'center',
  },
  emptyResults: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyResultsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyResultsText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#8B1E2D',
    fontSize: 14,
    fontWeight: '600',
  },
});
