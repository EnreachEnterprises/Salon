import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AzeretMono_400Regular, AzeretMono_700Bold, useFonts } from '@expo-google-fonts/azeret-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { ThemeProvider, useTheme } from '@/theme';

// Hold the splash until the typeface is ready. Azeret Mono is the brand;
// rendering a system font for 200ms and then swapping looks broken.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AzeretMono_400Regular,
    AzeretMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider initialScheme="dark">
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}
