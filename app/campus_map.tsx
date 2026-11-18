
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const MAP_URL = 'https://map.nmsu.edu';

export default function CampusMapScreen() {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>NMSU Campus Map</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mapContainer}>
        {!hasError ? (
          <WebView
            source={{ uri: MAP_URL }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>
              Map could not load inside the app
            </Text>

            <Text style={styles.errorMessage}>
              You can still access the official NMSU campus map
              using your browser.
            </Text>

            <Pressable
              style={styles.openButton}
              onPress={() => Linking.openURL(MAP_URL)}
            >
              <Text style={styles.openButtonText}>
                Open Official NMSU Map
              </Text>
            </Pressable>
          </View>
        )}

        {loading && !hasError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B1E2D" />
            <Text style={styles.loadingText}>
              Loading NMSU Campus Map...
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },

  backText: {
    color: '#8B1E2D',
    fontSize: 15,
    fontWeight: '600',
  },

  headerTitle: {
    color: '#8B1E2D',
    fontSize: 18,
    fontWeight: 'bold',
  },

  headerSpacer: {
    width: 50,
  },

  mapContainer: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },

  webview: {
    flex: 1,
  },

  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  errorTitle: {
    color: '#222222',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },

  errorMessage: {
    color: '#666666',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },

  openButton: {
    backgroundColor: '#8B1E2D',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
  },

  openButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
