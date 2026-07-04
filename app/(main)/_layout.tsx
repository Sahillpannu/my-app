import { Tabs } from 'expo-router';
import { House, Compass, ListDashes, Gear } from 'phosphor-react-native';

const COLORS = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  accent: '#D97706',       // Active tab color (amber)
  textTertiary: '#94A3B8', // Inactive tab color (muted slate)
};

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={22} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Compass size={22} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <ListDashes size={22} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Gear size={22} color={color} weight="bold" />
          ),
        }}
      />
    </Tabs>
  );
}
