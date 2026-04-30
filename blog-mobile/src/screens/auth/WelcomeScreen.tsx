import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { signInWithGoogle, configureGoogleSignin } from '../../services/googleAuth';
import { useEffect } from 'react';
import GoogleIcon from '../../components/GoogleIcon';
import { signInWithMicrosoft } from '../../services/microsoftAuth';
import MicrosoftIcon from '../../components/MicrosoftIcon';
const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  const loginStore = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    configureGoogleSignin();
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
      navigation.navigate('Main');
    } catch (err: any) {
      Alert.alert('Microsoft Sign-In Error', err.message || 'Failed to sign in with Microsoft');
    } finally {
      setLoading(false);
    }
  };



  return (
    <View className="flex-1 bg-background">
      {/* Abstract background elements for premium feel */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />
      
      {/* Skip Button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Main')}
        className="absolute top-12 right-6 z-10 flex-row items-center px-4 py-2 rounded-full border border-border bg-card/30"
        style={styles.glassEffect}
      >
        <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mr-1">Skip</Text>
        <ArrowRight size={12} color="#888" />
      </TouchableOpacity>

      <View className="flex-1 px-10 justify-between py-24">
        {/* App Name Section */}
        <View className="mt-12">
          <Text className="text-accent text-[12px] font-bold uppercase tracking-[4px] mb-2">The Art of Storytelling</Text>
          <Text className="text-text-primary text-6xl font-serif leading-tight">Scribe{"\n"}Flow</Text>
          <View className="w-12 h-1 bg-accent mt-4" />
        </View>

        {/* Action Section */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            className="bg-accent py-4 rounded-full flex-row justify-center items-center shadow-sm"
            activeOpacity={0.8}
          >
            <Text className="text-primary font-bold text-[15px]">Sign In to Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-card border border-border/50 py-4 rounded-full flex-row justify-center items-center mt-2 shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text className="text-text-primary font-semibold text-[15px] ml-3">Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleMicrosoftSignIn}
            disabled={loading}
            className="bg-card border border-border/50 py-4 rounded-full flex-row justify-center items-center mt-3 shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#00a4ef" />
            ) : (
              <>
                <MicrosoftIcon size={20} />
                <Text className="text-text-primary font-semibold text-[15px] ml-3">Continue with Microsoft</Text>
              </>
            )}
          </TouchableOpacity>



          <View className="mt-10 items-center">
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-text-muted text-[11px] tracking-widest">
                NEW HERE? <Text className="text-accent font-bold">CREATE AN ACCOUNT</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topCircle: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#22c55e10',
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -height * 0.2,
    left: -width * 0.3,
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: '#1a1a1a',
  },
  glassEffect: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backdropFilter: 'blur(10px)', // Web only but conceptually for design
  }
});

export default WelcomeScreen;
