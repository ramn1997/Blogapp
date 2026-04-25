import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { TouchableOpacity, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Bell, Bookmark } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import HomeScreen from '../screens/main/HomeScreen';
import BlogDetailScreen from '../screens/main/BlogDetailScreen';
import WriteBlogScreen from '../screens/main/WriteBlogScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationScreen from '../screens/main/NotificationScreen';
import AuthorProfileScreen from '../screens/main/AuthorProfileScreen';
import SearchScreen from '../screens/main/SearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  
  const isDark = colorScheme === 'dark';
  
  const themeColors = {
    bg: isDark ? '#111111' : '#f9f7f2', // Matching global.css
    text: isDark ? '#f9f7f2' : '#111111',
    border: isDark ? '#333333' : '#eeeeee',
    inactive: isDark ? '#666' : '#999',
    accent: '#22c55e'
  };
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { 
          backgroundColor: themeColors.bg, 
          borderTopColor: themeColors.border,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 18,
          paddingTop: 12,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.8,
        },
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.inactive,
        headerStyle: { backgroundColor: themeColors.bg, borderBottomWidth: 1, borderBottomColor: themeColors.border },
        headerTitleStyle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: themeColors.text },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({ 
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
          headerShown: false,
          headerRight: () => !isAuthenticated ? (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              className="mr-5 px-4 py-1.5 bg-accent rounded-sm"
              activeOpacity={0.7}
            >
              <Text className="text-[#111] text-[10px] font-bold uppercase tracking-widest">Login</Text>
            </TouchableOpacity>
          ) : null
        })}
      />
      <Tab.Screen 
        name="Write" 
        component={WriteBlogScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Feather name="plus-square" size={20} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color }) => <Bookmark size={20} color={color} />,
          headerTitle: 'My Dashboard'
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        options={{
          tabBarIcon: ({ color }) => <Bell size={20} color={color} />,
          tabBarLabel: 'Notifications'
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> 
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    bg: isDark ? '#111111' : '#f9f7f2',
    text: isDark ? '#f9f7f2' : '#111111',
    border: isDark ? '#333333' : '#eeeeee',
  };

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: themeColors.bg,
      card: themeColors.bg,
      text: themeColors.text,
      border: themeColors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "Main" : "Welcome"}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="BlogDetail" 
          component={BlogDetailScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AuthorProfile" 
          component={AuthorProfileScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
