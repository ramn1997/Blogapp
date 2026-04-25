import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { API_BASE_URL } from '../../services/api';
import { Camera, ArrowLeft, PenSquare } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import FeedbackModal from '../../components/FeedbackModal';

const WriteBlogScreen = ({ navigation, route }: any) => {
  const editId = route.params?.id;
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [image, setImage] = useState<any>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const isMounted = useRef(true);

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success' as 'success' | 'error', title: '', message: '' });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    fetchCategories();
    if (editId) {
      fetchBlogDetails();
    }
  }, [editId]);

  const showFeedback = (type: 'success' | 'error', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const fetchCategories = async () => {
    const predefinedCategories = ['Lifestyle', 'Technology', 'Culture', 'Health', 'Travel', 'Business'];
    try {
      const res = await api.get('/api/blogs/categories');
      if (isMounted.current) {
        const apiCats = Array.isArray(res.data) ? res.data : [];
        setCategories([...new Set([...predefinedCategories, ...apiCats])]);
      }
    } catch (err) {
      if (isMounted.current) setCategories(predefinedCategories);
    }
  };

  const fetchBlogDetails = async () => {
    setFetching(true);
    try {
      const res = await api.get(`/api/blogs/${editId}`);
      if (isMounted.current) {
        const blog = res.data;
        setTitle(blog.title || '');
        setSummary(blog.summary || '');
        setContent(blog.content || '');
        setCategory(blog.category || '');
        
        if (Array.isArray(blog.tags)) {
          setTags(blog.tags.join(', '));
        } else {
          setTags(blog.tags || '');
        }
        
        setExistingImageUrl(blog.coverImageUrl || '');
      }
    } catch (err) {
      showFeedback('error', 'Retrieval Failed', 'We couldn\'t load your story details at this time.');
    } finally {
      if (isMounted.current) setFetching(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !content.trim() || !category.trim()) {
      showFeedback('error', 'Requirements Missing', 'Please ensure your story has a title, content, and a chosen category.');
      return;
    }

    setLoading(true);
    try {
      let coverImageUrl = existingImageUrl;
      
      if (image) {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', { uri: image.uri, type: 'image/jpeg', name: 'cover.jpg' });
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        coverImageUrl = uploadRes.data.url;
      }

      // FIXED PAYLOAD: Wrapping in 'dto' and keeping 'tags' as a string to match backend expectations.
      const payload = {
        dto: {
          title: title.trim(),
          summary: summary.trim() || title.substring(0, 100).trim(),
          content,
          category,
          coverImageUrl,
          isPublished,
          tags: tags // Backend expects System.String, sending comma-separated string
        }
      };

      if (editId) {
        await api.put(`/api/blogs/${editId}`, payload);
        showFeedback('success', 'Story Updated', 'Your story has been updated successfully.');
      } else {
        await api.post('/api/blogs', payload);
        showFeedback('success', isPublished ? 'Published' : 'Draft Saved', isPublished ? 'Your story has been published to the community.' : 'Your progress has been preserved in your drafts.');
      }
    } catch (error: any) {
      console.error('Save failed details:', error.response?.data || error.message);
      const serverMsg = error.response?.data?.title || error.response?.data?.message || 'The server encountered an issue processing your request.';
      showFeedback('error', 'Publication Failed', serverMsg);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalConfig.type === 'success') {
      navigation.goBack();
    }
  };

  const { user } = useAuthStore();

  if (!user) {
    return (
      <View className="flex-1 bg-background px-6 items-center justify-center">
        <PenSquare size={64} className="text-text-muted opacity-40" />
        <Text className="text-text-primary text-xl font-serif mt-6 mb-2">Share Your Voice</Text>
        <Text className="text-text-secondary text-center mb-10 px-4">Sign in to publish stories to the community.</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          className="bg-accent px-10 py-4 w-full items-center rounded-sm"
        >
          <Text className="text-primary font-bold uppercase tracking-widest text-xs">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fetching) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-6 py-2">
          <TouchableOpacity 
            onPress={pickImage}
            className="w-full h-56 bg-card border border-dashed border-border mb-12 items-center justify-center overflow-hidden rounded-sm"
          >
            {image ? (
              <Image source={{ uri: image.uri }} className="w-full h-full" />
            ) : existingImageUrl ? (
              <Image source={{ uri: existingImageUrl.startsWith('http') ? existingImageUrl : `${API_BASE_URL}${existingImageUrl.startsWith('/') ? '' : '/'}${existingImageUrl}` }} className="w-full h-full" />
            ) : (
              <>
                <Camera size={32} className="text-text-muted opacity-50" />
                <Text className="text-text-muted mt-3 uppercase tracking-widest text-[9px] font-bold">Add Cover Image</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="space-y-10">
            <View className="mb-8">
              <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-5">Title</Text>
              <TextInput
                className="text-text-primary text-3xl font-serif border-b border-border/50 pb-4"
                placeholder="Story Title"
                placeholderTextColor="#444"
                value={title}
                onChangeText={setTitle}
                multiline
              />
            </View>

            <View className="mb-8">
              <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-5">Summary</Text>
              <TextInput
                className="text-text-secondary text-base font-sans border-b border-border/50 pb-4"
                placeholder="Brief Summary"
                placeholderTextColor="#444"
                value={summary}
                onChangeText={setSummary}
                multiline
              />
            </View>

            <View className="mb-8">
              <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-5">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-2">
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`mr-3 px-5 py-2.5 border rounded-sm ${category === cat ? 'bg-accent border-accent' : 'border-border'}`}
                  >
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${category === cat ? 'text-primary' : 'text-text-secondary'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-8">
              <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-5">Tags (Comma Separated)</Text>
              <TextInput
                className="text-text-secondary text-sm border-b border-border/50 pb-4"
                placeholder="tech, lifestyle, art"
                placeholderTextColor="#444"
                value={tags}
                onChangeText={setTags}
              />
            </View>

            <View className="mb-8">
              <Text className="text-text-muted text-[10px] uppercase tracking-[3px] mb-5">Content</Text>
              <TextInput
                className="text-text-primary text-lg leading-relaxed min-h-[400px] font-sans mt-2"
                placeholder="Write your story..."
                placeholderTextColor="#444"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row space-x-4 mt-8 mb-20">
              <TouchableOpacity 
                onPress={() => handleSave(false)}
                disabled={loading}
                className="flex-1 bg-card border border-border py-5 items-center justify-center rounded-sm"
              >
                <Text className="text-text-primary font-bold uppercase tracking-widest text-[10px]">Save Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleSave(true)}
                disabled={loading}
                className="flex-1 bg-accent py-5 items-center justify-center rounded-sm shadow-lg shadow-accent/20"
              >
                {loading ? (
                  <ActivityIndicator color="#111" />
                ) : (
                  <Text className="text-primary font-bold uppercase tracking-widest text-[10px]">{editId ? 'Update Story' : 'Publish Story'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <FeedbackModal 
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={handleModalClose}
      />
    </KeyboardAvoidingView>
  );
};

export default WriteBlogScreen;
