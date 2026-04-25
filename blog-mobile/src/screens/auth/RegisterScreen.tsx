import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

import SaveLoginPopup from '../../components/SaveLoginPopup';
import { signInWithGoogle, configureGoogleSignin } from '../../services/googleAuth';
import GoogleIcon from '../../components/GoogleIcon';

const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
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



  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { 
        fullName, 
        email, 
        password,
        preferredEmail: '' // Optional in web, keeping consistent
      });
      await loginStore(response.data.user, response.data.token);
      setRegisteredUser(response.data.user);
      setShowSavePopup(true);
    } catch (error: any) {
      if (isMounted.current) {
        Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView contentContainerClassName="flex-grow justify-center py-12" className="bg-background px-8">
      <View className="mb-12">
        <Text className="text-accent text-[10px] font-bold uppercase tracking-[4px] mb-2">Registration</Text>
        <Text className="text-text-primary text-6xl font-serif leading-tight">Join Us</Text>
        <View className="w-12 h-1 bg-accent mt-4" />
      </View>

      <View className="space-y-6">
        <View className="border-b border-border py-2 mb-6">
          <View className="flex-row justify-between items-end mb-1">
            <Text className="text-text-muted text-[10px] tracking-widest uppercase">Full Name</Text>
            <Text className="text-accent text-[8px] uppercase tracking-[2px] opacity-70 italic">Mandatory</Text>
          </View>
          <TextInput
            className="text-text-primary text-lg"
            placeholder="Arthur Rimbaud"
            placeholderTextColor="#555"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View className="border-b border-border py-2 mb-6">
          <View className="flex-row justify-between items-end mb-1">
            <Text className="text-text-muted text-[10px] tracking-widest uppercase">Email Address</Text>
            <Text className="text-accent text-[8px] uppercase tracking-[2px] opacity-70 italic">Mandatory</Text>
          </View>
          <TextInput
            className="text-text-primary text-lg"
            placeholder="muse@editorial.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="border-b border-border py-2 mb-10">
          <View className="flex-row justify-between items-end mb-1">
            <Text className="text-text-muted text-[10px] tracking-widest uppercase">Password</Text>
            <Text className="text-accent text-[8px] uppercase tracking-[2px] opacity-70 italic">Mandatory</Text>
          </View>
          <TextInput
            className="text-text-primary text-lg"
            placeholder="••••••••"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="bg-accent py-4 flex-row justify-center items-center rounded-sm"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text className="text-primary font-bold tracking-widest uppercase text-[12px]">Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-card border border-border py-4 flex-row justify-center items-center rounded-sm"
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#22c55e" />
          ) : (
            <>
              <GoogleIcon size={18} />
              <Text className="text-text-primary font-bold tracking-widest uppercase text-[12px] ml-3">Google</Text>
            </>
          )}
        </TouchableOpacity>



        <View className="flex-row justify-center mt-12">
          <Text className="text-text-secondary">Already a member? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-text-primary font-bold underline">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SaveLoginPopup 
        visible={showSavePopup} 
        userName={registeredUser?.fullName || 'User'} 
        onClose={() => {
          setShowSavePopup(false);
          navigation.navigate('Main');
        }}
      />
    </ScrollView>
  );
};

export default RegisterScreen;
