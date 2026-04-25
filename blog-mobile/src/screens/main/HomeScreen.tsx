import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import BlogCard from '../../components/BlogCard';
import { Search, Filter, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../store/authStore';

// Moved Header to a separate component to prevent focus loss during typing
const HomeHeader = React.memo(({ search, setSearch, categories, selectedCategory, setSelectedCategory, colorScheme }: any) => {
  return (
    <View className="mb-8 px-6 pt-6">
      <View className="flex-row items-center bg-card border border-border px-4 py-3 rounded-sm mb-8 shadow-sm">
        <Search size={18} color="#22c55e" strokeWidth={2.5} />
        <TextInput
          className="flex-1 ml-3 text-text-primary text-base font-sans"
          placeholder="Explore stories..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search?.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearch('')}
            className="p-1"
          >
            <X size={16} color={colorScheme === 'dark' ? '#f9f7f2' : '#111111'} opacity={0.5} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            className="mr-8 pb-3 relative"
            activeOpacity={0.7}
          >
            <Text className={`text-[12px] font-bold tracking-[1.5px] uppercase ${
              selectedCategory === item ? 'text-accent' : 'text-text-muted'
            }`}>
              {item}
            </Text>
            {selectedCategory === item && (
              <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-full" />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
});

const HomeScreen = ({ route, navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const { user } = useAuthStore();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState(route.params?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(route.params?.search || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isMounted = useRef(true);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  useEffect(() => {
    if (route.params?.search) {
      setSearch(route.params.search);
      setDebouncedSearch(route.params.search);
      navigation.setParams({ search: undefined });
    }
  }, [route.params?.search, navigation]);

  const fetchBlogs = useCallback(async (pageNum = 1, shouldAppend = false) => {
    try {
      // Logic: If logged in, show interacted posts. If not, show all.
      const endpoint = user ? '/api/blogs/interacted' : '/api/blogs';
      
      const response = await api.get(endpoint, {
        params: {
          page: pageNum,
          pageSize: 10,
          category: (user || selectedCategory === 'All') ? undefined : selectedCategory,
          search: debouncedSearch || undefined
        }
      });

      if (!isMounted.current) return;

      const newBlogs = response.data.items || [];
      setBlogs(prev => shouldAppend ? [...prev, ...newBlogs] : newBlogs);
      setHasMore(newBlogs.length === 10);
    } catch (error: any) {
      console.error('Failed to fetch blogs:', error.response?.data || error.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedCategory, debouncedSearch, user]);

  useEffect(() => {
    setPage(1);
    fetchBlogs(1, false);
  }, [selectedCategory, debouncedSearch, fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBlogs(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBlogs(nextPage, true);
    }
  };

  return (
    <View className="flex-1 bg-background dark:bg-[#111111]">
      <FlatList
        data={blogs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <BlogCard 
            blog={item} 
            onTagClick={(tag) => {
              setSearch(tag);
              setDebouncedSearch(tag);
            }}
          />
        )}
        ListHeaderComponent={
          <HomeHeader 
            search={search}
            setSearch={setSearch}
            categories={user ? [] : categories} // Hide categories if logged in
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            colorScheme={colorScheme}
          />
        }
        ListEmptyComponent={!loading ? (
          <View className="flex-1 items-center justify-center pt-20 px-10">
            <Text className="text-text-primary text-lg font-serif mb-2">No results found</Text>
            <Text className="text-text-muted text-center leading-relaxed">Try adjusting your search or filters to find what you're looking for.</Text>
          </View>
        ) : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore && blogs.length > 0 ? <ActivityIndicator className="my-8" color="#22c55e" /> : null}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default HomeScreen;
