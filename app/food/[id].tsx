
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationMiniMap from '../../components/LocationMiniMap';

const foodLocations = [
  { id: 'taos', name: 'Taos Restaurant', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'einstein-corbett', name: 'Einstein Bros. Bagels', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'wow', name: 'WOW', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'ramshi', name: 'Ramshi', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'mediterranean', name: 'Mediterranean', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'petes-patio', name: "Pete's Patio", building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'wild-blue', name: 'Wild Blue Modern Japanese Kitchen', building: 'Corbett Center Student Union', latitude: 32.28310706280288, longitude: -106.74763390421676 },
  { id: 'bookstore-cafe', name: 'Bookstore Cafe', building: 'NMSU Bookstore', latitude: 32.28490833725161, longitude: -106.74999537538008 },
  { id: 'panda-express', name: 'Panda Express', building: 'NMSU Bookstore', latitude: 32.28490833725161, longitude: -106.74999537538008 },
  { id: 'almas-kitchen', name: "Alma's Kitchen", building: 'Frenger Food Court', latitude: 32.281487184502154, longitude: -106.75040774469142 },
  { id: 'coffee-haus', name: 'Coffee Haus', building: 'Frenger Food Court', latitude: 32.281487184502154, longitude: -106.75040774469142 },
  { id: 'the-mix', name: 'The Mix', building: 'Frenger Food Court', latitude: 32.281487184502154, longitude: -106.75040774469142 },
  { id: 'gila-grill', name: 'Gila Grill', building: 'College of Health and Social Services', latitude: 32.283758331561145, longitude: -106.75144790236368 },
  { id: 'einstein-health', name: 'Einstein Bros. Bagels', building: 'College of Health and Social Services', latitude: 32.283758331561145, longitude: -106.75144790236368 },
  { id: 'zuhl-fuel', name: 'Zuhl Fuel', building: 'Zuhl Library', latitude: 32.28148, longitude: -106.74964 },
  { id: 'subway', name: 'Subway', building: "O'Donnell Hall", latitude: 32.27923, longitude: -106.75207 },
  { id: 'la-jefa', name: 'La Jefa', building: 'Gerald Thomas Hall', latitude: 32.28129997318765, longitude: -106.7569391753806 },
];

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const foodId = Array.isArray(id) ? id[0] : id;

  const place = foodLocations.find((item) => item.id === foodId);

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Location not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back to Food & Drinks</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>NEW MEXICO STATE UNIVERSITY</Text>
        <Text style={styles.headerTitle}>Food & Drinks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back to Food & Drinks</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.foodIcon}>
            <Text style={styles.foodEmoji}>🍴</Text>
          </View>

          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.building}>{place.building}</Text>

          <Text style={styles.sectionTitle}>Find this location</Text>

          <LocationMiniMap
            latitude={place.latitude}
            longitude={place.longitude}
            label={place.name}
            markerType="food"
          />

          <Text style={styles.sectionTitle}>Operating Hours</Text>

          <View style={styles.hoursBox}>
            <Text style={styles.hoursIcon}>🕒</Text>
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursTitle}>Hours not yet verified</Text>
              <Text style={styles.hoursDescription}>
                Hours may vary by semester, weekday, and university holidays.
                Check with the location for its current schedule.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Campus Location</Text>
          <Text style={styles.description}>
            Located inside {place.building} at New Mexico State University.
          </Text>

          <Pressable
            onPress={() => router.push('/campus_map')}
            style={styles.mapButton}
          >
            <Text style={styles.mapButtonText}>
              🗺 View Full Campus Map
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F2',
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 17,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
  },
  eyebrow: {
    color: '#8B1E2D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#292525',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 12,
  },
  backText: {
    color: '#8B1E2D',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D9',
    padding: 20,
  },
  foodIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8EEF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  foodEmoji: {
    fontSize: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#292525',
  },
  building: {
    fontSize: 13,
    color: '#77716D',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#302C29',
    marginTop: 22,
    marginBottom: 8,
  },
  hoursBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F6F2',
    borderRadius: 10,
    padding: 13,
    gap: 11,
    alignItems: 'flex-start',
  },
  hoursIcon: {
    fontSize: 20,
  },
  hoursInfo: {
    flex: 1,
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38322F',
  },
  hoursDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#77716D',
    marginTop: 4,
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 22,
  },
  mapButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
