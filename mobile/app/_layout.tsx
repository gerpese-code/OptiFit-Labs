import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, LogBox, Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { UnitProvider } from '@/context/UnitContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ocultar avisos de depuración de Expo en pantalla
LogBox.ignoreAllLogs(true);

function RootNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Configuración de la barra de navegación del sistema de Android (botones atrás/inicio/cerrar)
    // Se establece en modo 'dark' (barra oscura y botones claros) para eliminar cualquier espacio en blanco inferior
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle('dark');
      } catch (e) {
        console.warn('Error configurando Android navigation bar:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirigir a login si no hay sesión
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirigir al inicio si ya está autenticado
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff87" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020503' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#020503' }}>
      <LanguageProvider>
        <AuthProvider>
          <UnitProvider>
            <StatusBar style="light" />
            {Platform.OS === 'android' && <NavigationBar style="dark" />}
            <RootNavigation />
          </UnitProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020503',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
