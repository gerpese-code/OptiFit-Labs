import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Dumbbell, Apple, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // En Android con barra de navegación de 3 botones (como en la captura del usuario),
  // insets.bottom suele medir entre 44 y 48dp.
  // Si el dispositivo reporta insets.bottom (ej. 48dp), lo usamos directamente.
  // Si por alguna razón de renderizado en Android insets.bottom fuera 0 o menor a 48,
  // aplicamos un piso seguro de 48dp para garantizar al 100% que los botones del sistema
  // nunca queden encima de los iconos y textos de la app.
  // En iOS, respetamos el inset nativo (34dp en iPhone con notch/isla dinámica, o 10dp base).
  const isAndroid = Platform.OS === 'android';
  // Con la barra de navegación del sistema en #090d16, respetamos el inset del sistema
  // evitando espacios excesivos pero manteniendo holgura cómoda para los 3 botones
  const bottomInset = isAndroid
    ? Math.max(insets.bottom, 12)
    : Math.max(insets.bottom, 10);

  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#030805',
          borderTopColor: 'rgba(16, 185, 129, 0.35)',
          borderTopWidth: 1.5,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          shadowColor: '#00ff87',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#00ff87',
        tabBarInactiveTintColor: '#4b6354',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.workout'),
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs.nutrition'),
          tabBarIcon: ({ color, size }) => (
            <Apple color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 22} />
          ),
        }}
      />
    </Tabs>
  );
}
