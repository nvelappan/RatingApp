
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://nmsu-studyroom-ratingapp.onrender.com';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please complete all fields.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Your password must be at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please check your passwords.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Registration Failed',
          data.message || 'Unable to create your account.'
        );
        return;
      }

      Alert.alert(
        'Account Created!',
        'Your account was successfully created. You can now sign in.',
        [
          {
            text: 'Continue to Login',
            onPress: () => router.replace('/login'),
          },
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Make sure your backend is running and your phone is connected to the same Wi-Fi.'
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>
              NMSU Studyroom Rating App
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join the NMSU studyroom community.
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#777777"
              autoCapitalize="words"
              autoComplete="name"
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#777777"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="#777777"
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor="#777777"
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />

            <Pressable
              style={[
                styles.registerButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <View style={styles.signInRow}>
              <Text style={styles.secondaryText}>
                Already have an account?
              </Text>
              <Pressable
                onPress={() => router.replace('/login')}
                disabled={loading}
              >
                <Text style={styles.link}> Sign In</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.replace('/')}
              style={styles.backButton}
              disabled={loading}
            >
              <Text style={styles.link}>← Back to Home</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 520,
    paddingVertical: 20,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B1E2D',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD8',
    borderRadius: 14,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#222222',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    minHeight: 46,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#D0C9C5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222222',
  },
  registerButton: {
    backgroundColor: '#8B1E2D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
  },
  secondaryText: {
    color: '#666666',
    fontSize: 14,
  },
  link: {
    color: '#8B1E2D',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
});
