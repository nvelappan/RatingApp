
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Information', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login Failed', data.message || 'Unable to log in.');
        return;
      }

      // Securely store authentication token
      await SecureStore.setItemAsync('authToken', data.token);

      // Store basic student information for the app
      await SecureStore.setItemAsync(
        'user',
        JSON.stringify(data.user)
      );

      Alert.alert(
        'Welcome!',
        `You are now logged in as ${data.user.full_name}.`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/'),
          },
        ]
      );

    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Make sure your backend is running and your phone is connected to the same Wi-Fi.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginContent}>

          {/* Profile placeholder */}
          <View style={styles.avatar} />

          {/* Page title */}
          <Text style={styles.title}>LOGIN</Text>

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A18E88"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A18E88"
            secureTextEntry
            autoCapitalize="none"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {/* Login button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>

          {/* Registration prompt */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New User? </Text>
            <Pressable
              onPress={() => router.push('/register')}
              disabled={loading}
            >
              <Text style={styles.registerLink}>Register</Text>
            </Pressable>
          </View>

          {/* Back to Home button */}
          <Pressable
            onPress={() => router.replace('/')}
            style={styles.backButton}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F3',
  },

  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },

  loginContent: {
    width: '70%',
    maxWidth: 360,
    alignSelf: 'center',
    alignItems: 'stretch',
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#D9B8B5',
    backgroundColor: '#F3E7E3',
    alignSelf: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#8B1E2D',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },

  input: {
    height: 34,
    borderWidth: 1,
    borderColor: '#E4D8D1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#463936',
    marginBottom: 12,
    borderRadius: 5,
  },

  loginButton: {
    height: 36,
    backgroundColor: '#8B1E2D',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  registerText: {
    color: '#65534E',
    fontSize: 18,
  },

  registerLink: {
    color: '#8B1E2D',
    fontSize: 18,
    fontWeight: '600',
  },

  backButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
  },

  backButtonText: {
    color: '#8B1E2D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
