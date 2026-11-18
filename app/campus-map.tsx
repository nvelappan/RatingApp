
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

type MapFilter = 'all' | 'study' | 'food';

const STUDY_LOCATIONS = [
  { id: 'zuhl', name: 'Zuhl Library', lat: 32.28148, lng: -106.74964 },
  { id: 'branson', name: 'Branson Library', lat: 32.28150, lng: -106.75210 },
  { id: 'corbett', name: 'Corbett Center', lat: 32.28310706280288, lng: -106.74763390421676 },
  { id: 'hardman-jacobs', name: 'Hardman & Jacobs', lat: 32.28248, lng: -106.75122 },
  { id: 'native-american', name: 'Native American Center', lat: 32.283009803831604, lng: -106.74592109072447 },
  { id: 'la-vista', name: 'La Vista Learning Center', lat: 32.28045, lng: -106.74890 },
  { id: 'garcia', name: 'Garcia Center', lat: 32.2821861421539, lng: -106.74769079257787 },
];

const FOOD_LOCATIONS = [
  { name: 'Taos Restaurant', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'Einstein Bros. Bagels', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'WOW', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'Ramshi', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'Mediterranean', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: "Pete's Patio", building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'Wild Blue Modern Japanese Kitchen', building: 'Corbett Center Student Union', lat: 32.28310706280288, lng: -106.74763390421676 },
  { name: 'Bookstore Cafe', building: 'NMSU Bookstore', lat: 32.28490833725161, lng: -106.74999537538008 },
  { name: 'Panda Express', building: 'NMSU Bookstore', lat: 32.28490833725161, lng: -106.74999537538008 },
  { name: "Alma's Kitchen", building: 'Frenger Food Court', lat: 32.281487184502154, lng: -106.75040774469142 },
  { name: 'Coffee Haus', building: 'Frenger Food Court', lat: 32.281487184502154, lng: -106.75040774469142 },
  { name: 'The Mix', building: 'Frenger Food Court', lat: 32.281487184502154, lng: -106.75040774469142 },
  { name: 'Gila Grill', building: 'College of Health and Social Services', lat: 32.283758331561145, lng: -106.75144790236368 },
  { name: 'Einstein Bros. Bagels', building: 'College of Health and Social Services', lat: 32.283758331561145, lng: -106.75144790236368 },
  { name: 'Zuhl Fuel', building: 'Zuhl Library', lat: 32.28148, lng: -106.74964 },
  { name: 'Subway', building: "O'Donnell Hall", lat: 32.27923, lng: -106.75207 },
  { name: 'La Jefa', building: 'Gerald Thomas Hall', lat: 32.28129997318765, lng: -106.7569391753806 },
];

function makeMapHtml(filter: MapFilter) {
  const studyJson = JSON.stringify(STUDY_LOCATIONS);
  const foodJson = JSON.stringify(FOOD_LOCATIONS);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html, body, #map {
  height: 100%;
  width: 100%;
  margin: 0;
  background: #e8e5dc;
  font-family: Arial, sans-serif;
}
.pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px #0006;
  color: white;
  font-size: 17px;
}
.pin.study { background: #8B1E2D; }
.pin.food { background: #D18A32; }
.popup-title {
  font-weight: 800;
  font-size: 14px;
  color: #292522;
}
.popup-sub {
  font-size: 12px;
  color: #777;
  margin-top: 5px;
}
.popup-action {
  border: 0;
  background: #8B1E2D;
  color: white;
  padding: 9px 12px;
  border-radius: 7px;
  margin-top: 10px;
  font-weight: bold;
}
.food-list {
  padding-left: 18px;
  line-height: 1.7;
  font-size: 12px;
}
</style>
</head>
<body>
<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
const study = ${studyJson};
const food = ${foodJson};
const filter = '${filter}';

const map = L.map('map', {
  zoomControl: false
}).setView([32.2821, -106.7495], 16);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    attribution: 'Tiles © Esri'
  }
).addTo(map);

L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    opacity: 0.9,
    attribution: 'Labels © Esri'
  }
).addTo(map);

function makeIcon(type) {
  return L.divIcon({
    className: '',
    html: '<div class="pin ' + type + '">' +
      (type === 'study' ? '📚' : '☕') +
      '</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

function sendToApp(data) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }
}

if (filter !== 'food') {
  study.forEach(function(place) {
    const marker = L.marker(
      [place.lat, place.lng],
      { icon: makeIcon('study') }
    ).addTo(map);

    marker.bindPopup(
      '<div class="popup-title">' + place.name + '</div>' +
      '<div class="popup-sub">NMSU Study Finder location</div>' +
      '<button class="popup-action" onclick="openStudy(\\'' +
      place.id + '\\')">View Study Space</button>'
    );
  });
}

if (filter !== 'study') {
  const buildings = {};

  food.forEach(function(place) {
    if (!buildings[place.building]) {
      buildings[place.building] = {
        lat: place.lat,
        lng: place.lng,
        restaurants: []
      };
    }

    buildings[place.building].restaurants.push(place.name);
  });

  Object.keys(buildings).forEach(function(buildingName) {
    const building = buildings[buildingName];

    const restaurantList = building.restaurants
      .map(function(name) {
        return '<li>' + name + '</li>';
      })
      .join('');

    L.marker(
      [building.lat, building.lng],
      { icon: makeIcon('food') }
    ).addTo(map).bindPopup(
      '<div class="popup-title">' + buildingName + '</div>' +
      '<ul class="food-list">' + restaurantList + '</ul>'
    );
  });
}

function openStudy(id) {
  sendToApp({ type: 'open-study', id: id });
}
</script>
</body>
</html>`;
}

export default function CampusMapScreen() {
  const [filter, setFilter] = useState<MapFilter>('all');
  const [loading, setLoading] = useState(true);

  const html = useMemo(
    () => makeMapHtml(filter),
    [filter]
  );

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'open-study') {
        router.push(`/studyroom/${message.id}`);
      }
    } catch {
      // Ignore invalid map messages.
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            NEW MEXICO STATE UNIVERSITY
          </Text>
          <Text style={styles.title}>Campus Map</Text>
          <Text style={styles.subtitle}>
            Explore study spaces and campus dining
          </Text>
        </View>

        <View style={styles.compass}>
          <Text style={styles.compassText}>N</Text>
          <Text style={styles.compassArrow}>↑</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {([
          ['all', 'All Locations'],
          ['study', 'Study Spaces'],
          ['food', 'Food & Drinks'],
        ] as [MapFilter, string][]).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => {
              setLoading(true);
              setFilter(value);
            }}
            style={[
              styles.filter,
              filter === value && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === value && styles.filterTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.mapWrap}>
        <WebView
          key={filter}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          onError={() => setLoading(false)}
        />

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#8B1E2D" />
            <Text style={styles.loadingText}>
              Loading NMSU campus map...
            </Text>
          </View>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#8B1E2D' }]} />
            <Text style={styles.legendText}>Study Spaces</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#D18A32' }]} />
            <Text style={styles.legendText}>Food & Drinks</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Satellite imagery © Esri • Pin locations based on campus building coordinates
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
  },
  eyebrow: {
    color: '#8B1E2D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#272321',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  subtitle: {
    color: '#77716B',
    fontSize: 12,
    marginTop: 2,
  },
  compass: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#F7F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassText: {
    color: '#8B1E2D',
    fontSize: 9,
    fontWeight: '800',
  },
  compassArrow: {
    color: '#8B1E2D',
    fontSize: 15,
    lineHeight: 16,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
  },
  filter: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#F4F1ED',
    borderWidth: 1,
    borderColor: '#E8E2DC',
  },
  filterActive: {
    backgroundColor: '#8B1E2D',
    borderColor: '#8B1E2D',
  },
  filterText: {
    color: '#5F5955',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#E8E5DC',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B625C',
    marginTop: 9,
    fontSize: 12,
  },
  legend: {
    position: 'absolute',
    left: 12,
    bottom: 14,
    backgroundColor: '#FFFFFFEE',
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 7,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    color: '#4B4540',
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EAE5DF',
  },
  footerText: {
    color: '#8A837C',
    fontSize: 9,
  },
});
