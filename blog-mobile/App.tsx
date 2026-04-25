import React, { useEffect, useState } from 'react';
import "./src/styles/global.css";
import { StatusBar } from 'expo-status-bar';
import { View, useColorScheme, Appearance } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from './src/store/authStore';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme as useNWColorScheme } from 'nativewind';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const { setColorScheme } = useNWColorScheme();
  
  // Use BOTH the hook and a direct listener for maximum compatibility
  const [currentTheme, setCurrentTheme] = useState(Appearance.getColorScheme());

  let [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Restore session
        const userStr = await SecureStore.getItemAsync('user');
        const token = await SecureStore.getItemAsync('token');
        if (userStr && token) {
           setUser(JSON.parse(userStr));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, [setUser]);

  // Robust theme listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const isDark = currentTheme === 'dark';

  // Sync Native UI and NativeWind
  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    setColorScheme(theme);
    SystemUI.setBackgroundColorAsync(isDark ? '#111111' : '#f9f7f2').catch(() => {});
  }, [isDark, setColorScheme]);

  useEffect(() => {
    if (fontsLoaded && appIsReady) {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 500); 
    }
  }, [fontsLoaded, appIsReady]);

  if (!fontsLoaded || !appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View 
        key={`theme-root-${isDark}`} 
        className={`flex-1 ${isDark ? 'dark' : ''} bg-background`}
        style={{ backgroundColor: isDark ? '#111111' : '#f9f7f2' }}
      >
        <SafeAreaView 
          className="flex-1 bg-background" 
          edges={['top', 'left', 'right']}
          style={{ backgroundColor: isDark ? '#111111' : '#f9f7f2' }}
        >
          <AppNavigator key={`nav-stack-${isDark}`} />
          <StatusBar style={isDark ? 'light' : 'dark'} key={`status-bar-${isDark}`} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
