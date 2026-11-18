
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

const BURGUNDY = '#8B1E2D';

const foodLocations = [
  { id: 'taos', name: 'Taos Restaurant', building: 'Corbett Center Student Union' },
  { id: 'einstein-corbett', name: 'Einstein Bros. Bagels', building: 'Corbett Center Student Union' },
  { id: 'wow', name: 'WOW', building: 'Corbett Center Student Union' },
  { id: 'ramshi', name: 'Ramshi', building: 'Corbett Center Student Union' },
  { id: 'mediterranean', name: 'Mediterranean', building: 'Corbett Center Student Union' },
  { id: 'petes-patio', name: "Pete's Patio", building: 'Corbett Center Student Union' },
  { id: 'wild-blue', name: 'Wild Blue Modern Japanese Kitchen', building: 'Corbett Center Student Union' },
  { id: 'bookstore-cafe', name: 'Bookstore Cafe', building: 'NMSU Bookstore' },
  { id: 'panda-express', name: 'Panda Express', building: 'NMSU Bookstore' },
  { id: 'almas-kitchen', name: "Alma's Kitchen", building: 'Frenger Food Court' },
  { id: 'coffee-haus', name: 'Coffee Haus', building: 'Frenger Food Court' },
  { id: 'the-mix', name: 'The Mix', building: 'Frenger Food Court' },
  { id: 'gila-grill', name: 'Gila Grill', building: 'College of Health and Social Services' },
  { id: 'einstein-health', name: 'Einstein Bros. Bagels', building: 'College of Health and Social Services' },
  { id: 'zuhl-fuel', name: 'Zuhl Fuel', building: 'Zuhl Library' },
  { id: 'subway', name: 'Subway', building: "O'Donnell Hall" },
  { id: 'la-jefa', name: 'La Jefa', building: 'Gerald Thomas Hall' },
];

const filters = [
  { label: 'All', value: 'All Locations' },
  { label: 'Corbett', value: 'Corbett Center Student Union' },
  { label: 'Bookstore', value: 'NMSU Bookstore' },
  { label: 'Frenger', value: 'Frenger Food Court' },
  { label: 'Health & Social', value: 'College of Health and Social Services' },
  { label: 'Zuhl', value: 'Zuhl Library' },
  { label: "O'Donnell", value: "O'Donnell Hall" },
  { label: 'Gerald Thomas', value: 'Gerald Thomas Hall' },
];

export default function FoodScreen() {
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('All Locations');

  const filteredLocations = useMemo(() => {
    return foodLocations.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.building.toLowerCase().includes(search.toLowerCase());

      const matchesBuilding =
        selectedBuilding === 'All Locations' ||
        place.building === selectedBuilding;

      return matchesSearch && matchesBuilding;
    });
  }, [search, selectedBuilding]);

  const groupedLocations = useMemo(() => {
    return filters
      .filter((filter) => filter.value !== 'All Locations')
      .map((filter) => ({
        building: filter.value,
        locations: filteredLocations.filter(
          (place) => place.building === filter.value
        ),
      }))
      .filter((group) => group.locations.length > 0);
  }, [filteredLocations]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>NEW MEXICO STATE UNIVERSITY</Text>
        <Text style={styles.title}>Food & Drinks</Text>
        <Text style={styles.subtitle}>
          Find places to eat and grab a drink around campus.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food, drinks, or buildings..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionLabel}>CAMPUS LOCATIONS</Text>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((filter) => {
          const active = selectedBuilding === filter.value;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setSelectedBuilding(filter.value)}
              style={[styles.filter, active && styles.activeFilter]}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {groupedLocations.length > 0 ? (
          groupedLocations.map((group) => (
            <View key={group.building} style={styles.group}>
              <View style={styles.buildingHeader}>
                <Text style={styles.buildingIcon}>⌖</Text>
                <Text style={styles.buildingTitle}>
                  {group.building}
                </Text>
              </View>

              {group.locations.map((place, index) => (
                <Pressable
                  key={place.id}
                  onPress={() => router.push(`/food/${place.id}`)}
                  style={({ pressed }) => [
                    styles.locationCard,
                    index === group.locations.length - 1 &&
                      styles.lastCard,
                    pressed && styles.locationCardPressed,
                  ]}
                >
                  <View style={styles.foodIcon}>
                    <Text style={styles.foodEmoji}>🍴</Text>
                  </View>

                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{place.name}</Text>
                    <Text style={styles.locationBuilding}>
                      {place.building}
                    </Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No locations found</Text>
            <Text style={styles.emptyText}>
              Try another search or choose a different campus building.
            </Text>
            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedBuilding('All Locations');
              }}
            >
              <Text style={styles.resetText}>Clear filters</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F2',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 80,
    paddingBottom: 12,
  },
  eyebrow: {
    color: BURGUNDY,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#292525',
  },
  subtitle: {
    color: '#77716D',
    fontSize: 13,
    marginTop: 4,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EAE5DF',
  },
  searchIcon: {
    fontSize: 22,
    color: '#888',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  sectionLabel: {
    marginTop: 15,
    marginHorizontal: 22,
    marginBottom: 15,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#817B75',
  },
  filterScroll: {
    height: 34,
    flexGrow: 0,
    marginBottom: 2,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2DC',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 19,
  },
  activeFilter: {
    backgroundColor: BURGUNDY,
    borderColor: BURGUNDY,
  },
  filterText: {
    fontSize: 10,
    color: '#5F5955',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 3,
    paddingBottom: 25,
  },
  group: {
    marginBottom: 13,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  buildingIcon: {
    color: BURGUNDY,
    fontSize: 18,
  },
  buildingTitle: {
    color: '#38322F',
    fontSize: 14,
    fontWeight: '800',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE7',
  },
  locationCardPressed: {
    backgroundColor: '#F7F2EE',
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F8EEF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodEmoji: {
    fontSize: 19,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#302C29',
  },
  locationBuilding: {
    fontSize: 11,
    color: '#88817B',
    marginTop: 3,
  },
  chevron: {
    color: '#A39A92',
    fontSize: 25,
    paddingHorizontal: 5,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 7,
  },
  resetText: {
    color: BURGUNDY,
    fontWeight: '700',
    marginTop: 15,
  },
});
