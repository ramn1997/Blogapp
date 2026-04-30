import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react-native';
import SaveLoginPopup from '../../components/SaveLoginPopup';
import { signInWithGoogle, configureGoogleSignin } from '../../services/googleAuth';
import { signInWithMicrosoft } from '../../services/microsoftAuth';
import GoogleIcon from '../../components/GoogleIcon';
import MicrosoftIcon from '../../components/MicrosoftIcon';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const loginStore = useAuthStore(state => state.login);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    configureGoogleSignin();
    return () => { isMounted.current = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigation.navigate('Main');
    } catch (err: any) {
      if (err.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Google Sign-In Error', err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    try {
      await signInWithMicrosoft();
      setShowSavePopup(true);
    } catch (err: any) {
      Alert.alert('Microsoft Sign-In Error', err.message || 'Failed to sign in with Microsoft');
    } finally {
      setLoading(false);
    }
  };



  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      await loginStore(response.data.user, response.data.token);
      setLoggedInUser(response.data.user);
      setShowSavePopup(true);
      // navigation.navigate('Main'); // Moved to popup onClose
    } catch (error: any) {
      if (isMounted.current) {
        Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView contentContainerClassName="flex-grow justify-center" className="bg-background px-8">
      <View className="mb-12">
        <Text className="text-accent text-[10px] font-bold uppercase tracking-[4px] mb-2">Access Portal</Text>
        <Text className="text-text-primary text-6xl font-serif leading-tight">Welcome{"\n"}Back</Text>
        <View className="w-12 h-1 bg-accent mt-4" />
      </View>

      <View className="space-y-6">
        <View className="border-b border-border py-2 mb-6">
        <View className="flex-row justify-between items-end mb-1">
          <Text className="text-text-muted text-[10px] tracking-widest uppercase">Email Address</Text>
          <Text className="text-accent text-[8px] uppercase tracking-[2px] opacity-70 italic">Mandatory</Text>
        </View>
          <TextInput
            className="text-text-primary text-lg"
            placeholder="name@example.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="border-b border-border py-2 mb-8 relative">
          <View className="flex-row justify-between items-end mb-1">
            <Text className="text-text-muted text-[10px] tracking-widest uppercase">Password</Text>
            <Text className="text-accent text-[8px] uppercase tracking-[2px] opacity-70 italic">Mandatory</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <TextInput
              className="text-text-primary text-lg flex-1"
              placeholder="••••••••"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-accent py-4 flex-row justify-center items-center rounded-full shadow-sm"
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text className="text-primary font-bold text-[15px]">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-between space-x-3 mt-2">
          <TouchableOpacity 
            className="flex-1 bg-card border border-border/50 py-4 flex-row justify-center items-center rounded-full shadow-sm"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text className="text-text-primary font-semibold text-[15px] ml-2">Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-card border border-border/50 py-4 flex-row justify-center items-center rounded-full shadow-sm"
            onPress={handleMicrosoftSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#00a4ef" />
            ) : (
              <>
                <MicrosoftIcon size={20} />
                <Text className="text-text-primary font-semibold text-[15px] ml-2">Microsoft</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-12 pb-10">
          <Text className="text-text-secondary">New to the gallery? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-text-primary font-bold underline">Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SaveLoginPopup 
        visible={showSavePopup} 
        userName={loggedInUser?.fullName || 'User'} 
        onClose={() => {
          setShowSavePopup(false);
          navigation.navigate('Main');
        }}
      />
    </ScrollView>
  );
};

export default LoginScreen;
