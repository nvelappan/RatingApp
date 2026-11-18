
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B1E2D',
        tabBarInactiveTintColor: '#777777',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E2DE',
          height: 60,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⌂</Text>
          ),
        }}
      />

    

      <Tabs.Screen
        name="food"
        options={{
          title: 'Food & Drinks',
          tabBarLabel: 'Food',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🍴</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'My Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>♙</Text>
          ),
        }}
      />
    </Tabs>
  );
}

