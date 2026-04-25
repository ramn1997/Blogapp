import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import GoogleIcon from './GoogleIcon';

interface SocialAuthProps {
  onGooglePress: () => void;
  disabled?: boolean;
}

const SocialAuth = ({ onGooglePress, disabled }: SocialAuthProps) => {
  return (
    <View className="mt-8">
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="mx-4 text-text-muted text-[10px] uppercase tracking-widest">Or continue with</Text>
        <View className="flex-1 h-[1px] bg-border" />
      </View>

      <TouchableOpacity 
        className={`w-full flex-row items-center justify-center bg-card border border-border py-5 rounded-sm ${disabled ? 'opacity-50' : ''}`}
        activeOpacity={0.7}
        onPress={onGooglePress}
        disabled={disabled}
      >
        <GoogleIcon size={18} />
        <Text className="text-text-primary ml-3 font-medium uppercase tracking-widest text-[10px]">Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SocialAuth;
