import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '../../services/api';
import BlogCard from '../../components/BlogCard';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard } from 'lucide-react-native';

const DashboardScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Published');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    likes: 0,
    views: 0
  });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchData();
      }
    }, [user, activeTab])
  );

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all "my" blogs for stats and filtering
      const myRes = await api.get('/api/blogs/my');
      const allMyBlogs = myRes.data.items || [];
      
      if (isMounted.current) {
        setStats({
          total: myRes.data.totalCount || 0,
          published: allMyBlogs.filter((b: any) => b.isPublished).length,
          drafts: allMyBlogs.filter((b: any) => !b.isPublished).length,
          likes: allMyBlogs.reduce((acc: number, b: any) => acc + (b.likeCount || 0), 0),
          views: allMyBlogs.reduce((acc: number, b: any) => acc + (b.viewCount || 0), 0)
        });
      }

      if (activeTab === 'Published') {
        setBlogs(allMyBlogs.filter((b: any) => b.isPublished));
      } else if (activeTab === 'Drafts') {
        setBlogs(allMyBlogs.filter((b: any) => !b.isPublished));
      } else if (activeTab === 'Saved') {
        const res = await api.get('/api/blogs/saved');
        if (isMounted.current) setBlogs(res.data.items || []);
      } else if (activeTab === 'Activity') {
        // Activity could be recently liked/commented blogs or notifications
        // For now, let's show an empty state or a message
        setBlogs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleEdit = (blog: any) => {
    navigation.navigate('Write', { id: blog.id });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/blogs/${id}`);
              setBlogs(prev => prev.filter((b: any) => b.id !== id));
              fetchData(); // Refresh stats
            } catch (err) {
              Alert.alert('Error', 'Failed to delete story');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 bg-background px-6 items-center justify-center">
        <LayoutDashboard size={64} color="#333" />
        <Text className="text-text-primary text-xl font-serif mt-6 mb-2">Personal Library</Text>
        <Text className="text-text-secondary text-center mb-10">Sign in to see your published stories and saved collections.</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            className="bg-accent px-10 py-4 w-full items-center rounded-full shadow-sm"
          >
            <Text className="text-primary font-bold text-[15px]">Sign In to View Dashboard</Text>
          </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Enhanced Stats Header */}
      <View className="px-6 py-8 border-b border-border bg-card/20">
        
        <View className="flex-row justify-between mb-2">
          <View className="items-center flex-1 border-r border-border/30">
            <Text className="text-text-primary text-2xl font-serif">{stats.total}</Text>
            <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Total Posts</Text>
          </View>
          <View className="items-center flex-1 border-r border-border/30">
            <Text className="text-accent text-2xl font-serif">{stats.published}</Text>
            <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Published</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-text-secondary text-2xl font-serif">{stats.drafts}</Text>
            <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-1">Drafts</Text>
          </View>
        </View>

        <View className="flex-row justify-center pt-6 border-t border-border/30 mt-6">
          <View className="flex-row items-center">
            <View className="bg-secondary/10 p-2 rounded-full mr-3">
               <Text className="text-text-primary text-xs font-bold">{stats.views}</Text>
            </View>
            <Text className="text-text-muted text-[9px] uppercase tracking-widest">Total Views</Text>
          </View>
        </View>
      </View>

      <View className="flex-row border-b border-border px-6 bg-card/40">
        {['Published', 'Drafts', 'Saved', 'Activity'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`py-4 mr-6 border-b-2 ${activeTab === tab ? 'border-accent' : 'border-transparent'}`}
          >
            <Text className={`text-[9px] uppercase tracking-widest font-bold ${activeTab === tab ? 'text-text-primary' : 'text-text-muted'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#22c55e" />
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <BlogCard 
              blog={item} 
              onEdit={(activeTab === 'Published' || activeTab === 'Drafts') ? () => handleEdit(item) : undefined}
              onDelete={(activeTab === 'Published' || activeTab === 'Drafts') ? () => handleDelete(item.id) : undefined}
            />
          )}
          contentContainerStyle={{ paddingTop: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-text-muted">Nothing to show yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default DashboardScreen;
