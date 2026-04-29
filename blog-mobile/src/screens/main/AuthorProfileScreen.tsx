import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import api, { API_BASE_URL } from '../../services/api';
import BlogCard from '../../components/BlogCard';
import { ArrowLeft, User } from 'lucide-react-native';

const AuthorProfileScreen = ({ route, navigation }: any) => {
  const { authorId, authorName, authorAvatar } = route.params;
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorInfo, setAuthorInfo] = useState<any>({ fullName: authorName, avatarUrl: authorAvatar });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchAuthorData();
    fetchAuthorBlogs();
    return () => { isMounted.current = false; };
  }, [authorId]);

  const fetchAuthorData = async () => {
    try {
      // Assuming there's a profile endpoint, otherwise we'll just use the name passed in params
      const res = await api.get(`/api/auth/profile/${authorId}`);
      if (isMounted.current) setAuthorInfo(res.data);
    } catch (err) {
      console.log('Author profile fetch failed, using params instead');
    }
  };

  const fetchAuthorBlogs = useCallback(async () => {
    try {
      const res = await api.get('/api/blogs', {
        params: { userId: authorId, pageSize: 50 } // Backend expects 'userId'
      });
      if (isMounted.current) {
        setBlogs(res.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch author blogs');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [authorId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuthorBlogs();
  };

  const renderHeader = () => (
    <View className="px-8 pt-6 pb-10 items-center border-b border-border/30 mb-8">
      <View className="w-24 h-24 rounded-full bg-accent/10 items-center justify-center overflow-hidden border-2 border-accent/20 mb-6">
        {authorInfo?.avatarUrl ? (
          <Image source={{ uri: getImageUrl(authorInfo.avatarUrl) || '' }} className="w-full h-full" />
        ) : (
          <Text className="text-accent text-3xl font-serif">{(authorName || 'U').charAt(0)}</Text>
        )}
      </View>
      <Text className="text-text-primary text-3xl font-serif mb-2">{authorName}</Text>
      {authorInfo?.bio && (
        <Text className="text-text-secondary text-center leading-relaxed opacity-80 px-4 mb-4">{authorInfo.bio}</Text>
      )}
      <View className="flex-row items-center space-x-6 mt-2">
        <View className="items-center">
          <Text className="text-text-primary font-bold text-lg">{blogs.length}</Text>
          <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Stories</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-text-primary" />
        </TouchableOpacity>
        <Text className="text-text-primary ml-4 text-[10px] font-bold uppercase tracking-[3px]">Author Profile</Text>
      </View>

      <FlatList
        data={blogs}
        keyExtractor={(item: any) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <BlogCard blog={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <Text className="text-text-muted">No stories published yet.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default AuthorProfileScreen;
