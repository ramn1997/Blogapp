import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import GoogleIcon from './GoogleIcon';
import MicrosoftIcon from './MicrosoftIcon';

interface SocialAuthProps {
  onGooglePress: () => void;
  onMicrosoftPress: () => void;
  disabled?: boolean;
}

const SocialAuth = ({ onGooglePress, onMicrosoftPress, disabled }: SocialAuthProps) => {
  return (
    <View className="mt-8">
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="mx-4 text-text-muted text-[10px] uppercase tracking-widest">Or continue with</Text>
        <View className="flex-1 h-[1px] bg-border" />
      </View>

      <View className="flex-row justify-between space-x-4">
        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center bg-card border border-border py-4 rounded-sm ${disabled ? 'opacity-50' : ''}`}
          activeOpacity={0.7}
          onPress={onGooglePress}
          disabled={disabled}
        >
          <GoogleIcon size={18} />
          <Text className="text-text-primary ml-3 font-bold uppercase tracking-widest text-[10px]">Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center bg-card border border-border py-4 rounded-sm ${disabled ? 'opacity-50' : ''}`}
          activeOpacity={0.7}
          onPress={onMicrosoftPress}
          disabled={disabled}
        >
          <MicrosoftIcon size={18} />
          <Text className="text-text-primary ml-3 font-bold uppercase tracking-widest text-[10px]">Microsoft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SocialAuth;
