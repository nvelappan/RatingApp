
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type LocationMiniMapProps = {
  latitude: number;
  longitude: number;
  label: string;
  markerType?: 'study' | 'food';
};

export default function LocationMiniMap({
  latitude,
  longitude,
  label,
  markerType = 'study',
}: LocationMiniMapProps) {
  const markerColor = markerType === 'food' ? '#D18A32' : '#8B1E2D';
  const markerIcon = markerType === 'food' ? '☕' : '📚';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html, body, #map {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #e8e5dc;
}
.pin {
  width: 36px;
  height: 36px;
  border: 2px solid white;
  border-radius: 50%;
  background: ${markerColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  box-shadow: 0 2px 8px #0006;
}
.popup-title {
  font-weight: 800;
  font-size: 14px;
  color: #292522;
}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: false
}).setView([${latitude}, ${longitude}], 18);

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
    opacity: 0.9
  }
).addTo(map);

const icon = L.divIcon({
  className: '',
  html: '<div class="pin">${markerIcon}</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

L.marker([${latitude}, ${longitude}], { icon })
  .addTo(map)
  .bindPopup('<div class="popup-title">${label.replace(/'/g, "\\'")}</div>')
  .openPopup();
</script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          style={styles.webview}
        />
      </View>
      <Text style={styles.caption}>
        Satellite imagery © Esri · Pin marks this building
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  map: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8E5DC',
  },
  webview: {
    flex: 1,
    backgroundColor: '#E8E5DC',
  },
  caption: {
    color: '#8A837C',
    fontSize: 10,
    marginTop: 7,
  },
});
