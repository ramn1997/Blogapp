import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import api from '../../services/api';
import BlogCard from '../../components/BlogCard';
import { Search, ArrowLeft, X, Filter } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const SearchScreen = ({ navigation, route }: any) => {
  const { colorScheme } = useColorScheme();
  const initialQuery = route.params?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get('/api/blogs', {
        params: { search: text, pageSize: 20 }
      });
      setResults(res.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      // Focus search bar on entry only if not performing an initial search
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [initialQuery, handleSearch]);

  // Debounced search would be better, but let's do a simple trigger on submit for now
  // or use a timeout
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onQueryChange = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header with Search Input */}
      <View className="px-6 pt-6 pb-4 border-b border-border/50 bg-card">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 mr-2">
            <ArrowLeft size={24} color={colorScheme === 'dark' ? '#f9f7f2' : '#111111'} />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-secondary/10 px-4 py-2 rounded-xl">
            <Search size={18} color="#22c55e" />
            <TextInput
              ref={inputRef}
              className="flex-1 ml-3 text-text-primary text-base"
              placeholder="Search stories, topics..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={onQueryChange}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => onQueryChange('')}>
                <X size={16} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Results List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#22c55e" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <BlogCard blog={item} />}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListEmptyComponent={hasSearched ? (
            <View className="flex-1 items-center justify-center pt-20 px-10">
              <Text className="text-text-primary text-lg font-serif mb-2">No results for "{query}"</Text>
              <Text className="text-text-muted text-center">Try different keywords or check for typos.</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center pt-20 px-10">
              <Search size={48} color="#ccc" strokeWidth={1} />
              <Text className="text-text-muted text-center mt-4">Type something to find your next favorite story.</Text>
            </View>
          )}
          onScrollBeginDrag={Keyboard.dismiss}
        />
      )}
    </View>
  );
};

export default SearchScreen;
