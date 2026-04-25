import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator, useColorScheme as useSystemColorScheme, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api, { API_BASE_URL } from '../../services/api';
import { User as UserIcon, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, setUser } = useAuthStore();
  const systemColorScheme = useSystemColorScheme();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ stories: 0, likes: 0 });
  const isMounted = useRef(true);

  const isDark = systemColorScheme === 'dark';

  useEffect(() => {
    isMounted.current = true;
    if (user) {
      fetchUserStats();
    }
    return () => { isMounted.current = false; };
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const res = await api.get('/api/blogs/my');
      if (isMounted.current) {
        const blogs = res.data.items;
        setStats({
          stories: res.data.totalCount,
          likes: blogs.reduce((acc: number, b: any) => acc + (b.likesCount || 0), 0)
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.put('/api/auth/profile', { fullName, bio });
      if (isMounted.current) {
        setUser(res.data);
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (err) {
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };



  const pickImage = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your gallery to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (image: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const updateRes = await api.put('/api/auth/profile', { avatarUrl: uploadRes.data.url });
      if (isMounted.current) {
        setUser(updateRes.data);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (user?.avatarUrl) {
      let url = user.avatarUrl;
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        url = url.replace('localhost', '192.168.1.4').replace('127.0.0.1', '192.168.1.4');
      }
      if (url.startsWith('http')) return { uri: url };
      const cleanPath = url.replace(/\\/g, '/').startsWith('/') ? url.substring(1) : url;
      return { uri: `${API_BASE_URL}/${cleanPath}` };
    }
    return null;
  };



  if (!user) {
    return (
      <View className="flex-1 bg-background px-6 items-center justify-center">
        <UserIcon size={64} className="text-text-muted" />
        <Text className="text-text-primary text-xl font-serif mt-6 mb-2">Guest Explorer</Text>
        <Text className="text-text-secondary text-center mb-10">Sign in to share your own stories and manage your profile.</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          className="bg-accent px-10 py-4 w-full items-center rounded-sm"
        >
          <Text className="text-primary font-bold uppercase tracking-widest">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-8 py-4">
        {/* Profile Header Card */}
        <View className="bg-card p-6 border border-border mb-12 shadow-sm rounded-sm">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} className="relative">
              <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center overflow-hidden border-2 border-accent/20">
                {getProfileImage() ? (
                  <Image source={getProfileImage()} className="w-full h-full" />
                ) : (
                  <Text className="text-text-primary text-4xl font-serif">{(user?.fullName || 'U').charAt(0)}</Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-accent w-8 h-8 rounded-full items-center justify-center border border-card shadow-sm">
                <Camera size={14} color="#111" />
              </View>
            </TouchableOpacity>
            <View className="ml-6 flex-1">
              <Text className="text-text-primary text-2xl font-serif leading-tight">{user?.fullName}</Text>
              <Text className="text-text-muted text-[10px] uppercase tracking-widest mt-2">{user?.email}</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row border-t border-border/50 pt-6">
            <View className="flex-1 items-center border-r border-border/50">
              <Text className="text-text-primary text-xl font-serif">{stats.stories}</Text>
              <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Stories</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-text-primary text-xl font-serif">{stats.likes}</Text>
              <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Likes</Text>
            </View>
          </View>
        </View>



        {/* Display Name Form */}
        <View className="space-y-12">
          <View className="mb-6">
            <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-6">Display Name</Text>
            <TextInput
              className="text-text-primary text-lg font-serif border-b border-border/50 pb-2"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your Full Name"
              placeholderTextColor="#555"
            />
          </View>

          <View className="mb-10">
            <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-6">Bio</Text>
            <TextInput
              className="text-text-primary text-base font-sans border-b border-border/50 pb-4"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell your story..."
              placeholderTextColor="#555"
              multiline
            />
          </View>

          <TouchableOpacity 
            onPress={handleUpdate}
            className="bg-accent py-5 rounded-sm items-center shadow-md shadow-accent/20"
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#111" /> : <Text className="text-primary font-bold uppercase tracking-widest text-[12px]">Save Changes</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => logout()}
            className="bg-card py-5 rounded-sm items-center border border-border mt-4"
          >
            <Text className="text-danger font-bold uppercase tracking-widest text-[12px]">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
