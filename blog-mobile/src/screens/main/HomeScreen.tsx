import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions } from 'react-native';
import api, { API_BASE_URL } from '../../services/api';
import BlogCard from '../../components/BlogCard';
import { Search, Bell, ChevronRight, Sun, Moon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');



// --- Sub-components ---

const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
  <View className="flex-row justify-between items-center px-6 mb-4 mt-8">
    <Text className="text-text-primary text-xl font-serif">{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} className="flex-row items-center">
        <Text className="text-accent text-xs font-bold uppercase tracking-widest">See All</Text>
        <ChevronRight size={14} color="#22c55e" />
      </TouchableOpacity>
    )}
  </View>
);

const TrendingBlogCard = ({ blog, navigation }: any) => {
  const imageUrl = getImageUrl(blog.coverImageUrl);
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BlogDetail', { id: blog.id })}
      className="w-[280px] mr-6 bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm"
    >
      <Image source={{ uri: imageUrl }} className="w-full h-36 bg-secondary/10" />
      <View className="p-4">
        <Text className="text-accent text-[8px] font-bold tracking-[2px] uppercase mb-1">{blog.category}</Text>
        <Text numberOfLines={2} className="text-text-primary text-base font-serif mb-2 leading-tight">{blog.title}</Text>
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center">
             <View className="w-5 h-5 rounded-full bg-accent/10 items-center justify-center mr-2 overflow-hidden">
                {blog.author?.avatarUrl ? (
                  <Image source={{ uri: getImageUrl(blog.author.avatarUrl) }} className="w-full h-full" />
                ) : (
                  <Text className="text-accent text-[8px] font-bold">{(blog.author?.fullName || 'U')[0]}</Text>
                )}
             </View>
             <Text className="text-text-muted text-[10px]">{blog.author?.fullName}</Text>
          </View>
          <Text className="text-text-muted text-[10px]">{blog.readTimeMinutes} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};



// --- Main Screen ---

const HomeScreen = ({ navigation }: any) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { user } = useAuthStore();
  
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);

  const [savedBlogs, setSavedBlogs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchAllData();
    return () => { isMounted.current = false; };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch data with individual error handling
      const fetchLatest = api.get('/api/blogs', { params: { pageSize: 10, sortBy: 'latest', category: selectedCategory === 'All' ? undefined : selectedCategory } }).catch(() => ({ data: { items: [] } }));
      const fetchTrending = api.get('/api/blogs', { params: { pageSize: 5, sortBy: 'trending' } }).catch(() => ({ data: { items: [] } }));

      const fetchCategories = api.get('/api/blogs/categories').catch(() => ({ data: [] }));

      const [latestRes, trendingRes, categoriesRes] = await Promise.all([
        fetchLatest, fetchTrending, fetchCategories
      ]);

      let savedRes = { data: { items: [] } };
      if (user) {
        savedRes = await api.get('/api/blogs/saved', { params: { pageSize: 5 } }).catch(() => ({ data: { items: [] } }));
      }

      if (isMounted.current) {
        setLatestBlogs(latestRes.data.items || []);
        setTrendingBlogs(trendingRes.data.items || []);

        setCategories(['All', ...(categoriesRes.data || [])]);
        setSavedBlogs(savedRes.data.items || []);
      }
    } catch (error) {
      console.error('Home feed fetch error:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Re-fetch latest blogs when category changes
  useEffect(() => {
    if (!loading) {
      const fetchCategoryBlogs = async () => {
        try {
          const res = await api.get('/api/blogs', { 
            params: { 
              pageSize: 10, 
              sortBy: 'latest', 
              category: selectedCategory === 'All' ? undefined : selectedCategory 
            } 
          });
          if (isMounted.current) setLatestBlogs(res.data.items || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCategoryBlogs();
    }
  }, [selectedCategory]);

  const Header = () => (
    <View className="pt-4">
      {/* Top Bar */}
      <View className="flex-row justify-between items-center px-6 mb-8">
        <View>
          <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-1">Welcome back,</Text>
          <Text className="text-text-primary text-2xl font-serif">{user?.fullName || 'Reader'}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => toggleColorScheme()}
          className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center shadow-sm"
        >
          {colorScheme === 'dark' ? (
            <Sun size={20} color="#f9f7f2" />
          ) : (
            <Moon size={20} color="#111111" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Search')}
        className="mx-6 bg-card border border-border px-4 py-3.5 rounded-2xl flex-row items-center shadow-sm mb-4"
      >
        <Search size={18} color="#22c55e" strokeWidth={2.5} />
        <Text className="ml-3 text-text-muted text-base">Search stories, authors, topics...</Text>
      </TouchableOpacity>

      {/* Trending Section */}
      {trendingBlogs.length > 0 && (
        <View>
          <SectionHeader title="Trending Today" onSeeAll={() => {}} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendingBlogs}
            keyExtractor={item => `trending-${item.id}`}
            renderItem={({ item }) => <TrendingBlogCard blog={item} navigation={navigation} />}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
          />
        </View>
      )}

      {/* Categories */}
      <SectionHeader title="Topics for you" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={item => `cat-${item}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            className={`mr-4 px-6 py-2.5 rounded-full border ${
              selectedCategory === item ? 'bg-accent border-accent' : 'bg-card border-border'
            }`}
          >
            <Text className={`text-[11px] font-bold uppercase tracking-wider ${
              selectedCategory === item ? 'text-primary' : 'text-text-muted'
            }`}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
      />

      {/* Saved for Later */}
      {savedBlogs.length > 0 && (
        <View>
          <SectionHeader title="From your Library" onSeeAll={() => navigation.navigate('Dashboard')} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={savedBlogs}
            keyExtractor={item => `saved-${item.id}`}
            renderItem={({ item }) => <TrendingBlogCard blog={item} navigation={navigation} />}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
          />
        </View>
      )}



      {/* Latest Section Header */}
      <View className="mt-12 mb-2">
        <SectionHeader title="Latest Stories" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background dark:bg-[#111111]">
      <FlatList
        data={latestBlogs}
        keyExtractor={item => `latest-${item.id}`}
        renderItem={({ item }) => (
          <BlogCard 
            blog={item} 
            onTagClick={(tag) => navigation.navigate('Search', { query: tag })}
          />
        )}
        ListHeaderComponent={Header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator color="#22c55e" />
            </View>
          ) : (
            <View className="items-center py-20 px-10">
              <Text className="text-text-primary text-lg font-serif">No stories found</Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default HomeScreen;
