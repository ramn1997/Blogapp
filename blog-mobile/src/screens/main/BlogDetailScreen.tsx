import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Share, KeyboardAvoidingView, Platform } from 'react-native';
import api, { API_BASE_URL } from '../../services/api';
import { Heart, MessageCircle, Bookmark, Share2, Eye, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

const BlogDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const isMounted = useRef(true);
  const { user } = useAuthStore();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const res = await api.get(`/api/blogs/${id}`);
      if (isMounted.current) {
        const data = res.data;
        setBlog({
          ...data,
          isSaved: data.isSaved ?? data.isSavedByCurrentUser ?? false,
          isLiked: data.isLiked ?? data.isLikedByCurrentUser ?? false,
          likesCount: data.likesCount ?? data.likeCount ?? 0,
          commentsCount: data.commentsCount ?? data.commentCount ?? 0,
        });
        setLoading(false);
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load blog post');
      }
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/blogs/${id}/comments`);
      if (isMounted.current) {
        setComments(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please log in to like stories');
      return;
    }

    const prevLiked = blog.isLiked;
    const prevCount = blog.likesCount || 0;
    setBlog({ 
      ...blog, 
      isLiked: !prevLiked, 
      likesCount: prevLiked ? prevCount - 1 : prevCount + 1 
    });

    try {
      const res = await api.post(`/api/blogs/${id}/like`);
      if (isMounted.current) {
        setBlog({ 
          ...blog, 
          isLiked: res.data.liked, 
          likesCount: res.data.liked ? (prevLiked ? prevCount : prevCount + 1) : (prevLiked ? prevCount - 1 : prevCount) 
        });
      }
    } catch (error) {
      setBlog({ ...blog, isLiked: prevLiked, likesCount: prevCount });
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please log in to save stories');
      return;
    }

    const prevSaved = blog.isSaved;
    setBlog({ ...blog, isSaved: !prevSaved });

    try {
      const res = await api.post(`/api/blogs/${id}/save`);
      if (isMounted.current) {
        setBlog({ ...blog, isSaved: res.data.saved });
      }
    } catch (error) {
      setBlog({ ...blog, isSaved: prevSaved });
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://scribeflow.blog/blog/${id}`;
      await Share.share({
        message: `${blog.title}\n\nRead more at: ${shareUrl}`,
        url: shareUrl,
        title: blog.title,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/blogs/${id}/comments`, { content: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (error) {
        Alert.alert('Error', 'Failed to post comment');
    } finally {
      if (isMounted.current) {
        setSubmittingComment(false);
      }
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/800x400?text=Scribeflow';
    
    // If backend returns 'localhost' or '127.0.0.1', replace it with our hardcoded IP for dev devices
    let finalUrl = url;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      finalUrl = url.replace('localhost', '192.168.1.4').replace('127.0.0.1', '192.168.1.4');
    }

    if (finalUrl.startsWith('http')) return finalUrl;
    
    // Normalize slashes for mixed backend environments (Windows/Linux)
    let cleanPath = finalUrl.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    return `${API_BASE_URL}/${cleanPath}`;
  };

  if (loading) return (
    <View className="flex-1 bg-background dark:bg-[#111111] justify-center items-center">
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      className="flex-1 bg-background dark:bg-[#111111]"
    >
      <ScrollView className="flex-1">
        <View className="relative">
          <Image 
            source={{ uri: getImageUrl(blog.coverImageUrl) }} 
            className="w-full h-80 bg-card/50"
            resizeMode="cover"
          />
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="absolute top-6 left-6 bg-black/40 p-2 rounded-full"
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View className="px-7 py-10">
          <Text className="text-accent text-[10px] font-bold tracking-[4px] uppercase mb-4">
            {blog.category}
          </Text>
          <Text className="text-text-primary text-4xl font-serif mb-8 leading-[48px] tracking-tight">
            {blog.title}
          </Text>

          <View className="flex-row items-center justify-between mb-10 border-b border-border pb-8">
            <TouchableOpacity 
              onPress={() => navigation.navigate('AuthorProfile', { 
                authorId: blog.author?.id, 
                authorName: blog.author?.fullName 
              })}
              className="flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center mr-3 border border-accent/20 overflow-hidden">
                {blog.author?.avatarUrl ? (
                  <Image source={{ uri: getImageUrl(blog.author.avatarUrl) }} className="w-full h-full" />
                ) : (
                  <Text className="text-accent text-lg font-serif">{(blog.author?.fullName || 'U')[0]}</Text>
                )}
              </View>
              <View>
                <Text className="text-text-primary text-sm font-bold">{blog.author?.fullName || 'Auteur'}</Text>
                <Text className="text-text-muted text-[9px] uppercase tracking-widest mt-1">
                  {new Date(blog.createdAt).toLocaleDateString()} • {blog.readTimeMinutes} MIN
                </Text>
              </View>
            </TouchableOpacity>
            <View className="flex-row items-center space-x-6">
              <TouchableOpacity onPress={handleSave}>
                <Bookmark size={22} color={blog.isSaved ? '#22c55e' : '#888'} fill={blog.isSaved ? '#22c55e' : 'transparent'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}>
                <Share2 size={22} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-text-primary text-[17px] leading-[32px] font-sans opacity-95 mb-10">
            {blog.content}
          </Text>

          {/* Tags Section */}
          <View className="flex-row flex-wrap mb-12">
            {(() => {
              let tagsArray: string[] = [];
              try {
                if (Array.isArray(blog.tags)) {
                  tagsArray = blog.tags;
                } else if (typeof blog.tags === 'string') {
                  const cleaned = blog.tags.trim();
                  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                    tagsArray = JSON.parse(cleaned);
                  } else {
                    tagsArray = cleaned.split(',').map(t => t.trim()).filter(Boolean);
                  }
                }
              } catch (e) {
                console.log('Detail tags parse error');
              }
              
              return tagsArray.map((tag, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => navigation.navigate('Main', { screen: 'Explore', params: { search: tag } })}
                  className="bg-card border border-border px-4 py-1.5 rounded-full mr-3 mb-3"
                >
                  <Text className="text-accent text-[11px] font-bold uppercase tracking-widest">#{tag}</Text>
                </TouchableOpacity>
              ));
            })()}
          </View>

          <View className="flex-row items-center justify-center mb-16 py-8 border-y border-border/50">
            <View className="flex-row items-center mx-8">
              <TouchableOpacity onPress={handleLike} className="flex-row items-center">
                <Heart size={24} color={blog.isLiked ? '#ef4444' : '#888'} fill={blog.isLiked ? '#ef4444' : 'transparent'} />
                <Text className="text-text-primary ml-3 font-bold text-lg" style={{ lineHeight: 24 }}>
                  {blog?.likesCount ?? blog?.likes_count ?? 0}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="w-[1px] h-6 bg-border/50" />
            
            <View className="flex-row items-center mx-8">
              <Eye size={24} color="#888" />
              <Text className="text-text-primary ml-3 font-bold text-lg" style={{ lineHeight: 24 }}>
                {blog?.viewCount ?? blog?.view_count ?? 0}
              </Text>
            </View>
          </View>

          {/* Comments Section */}
          <View>
            <Text className="text-text-primary text-2xl font-serif mb-8">Comments ({comments?.length || 0})</Text>
            
            <View className="mb-10 bg-card border border-border p-4 rounded-sm">
              <TextInput
                className="text-text-primary text-base min-h-[80px] font-sans"
                placeholder="Share your thoughts..."
                placeholderTextColor="#666"
                multiline
                value={newComment}
                onChangeText={setNewComment}
                textAlignVertical="top"
              />
              <View className="flex-row justify-end mt-4">
                <TouchableOpacity 
                  onPress={postComment}
                  disabled={submittingComment}
                  className="bg-accent px-8 py-2.5 rounded-sm"
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#111" />
                  ) : (
                    <Text className="text-[#111] font-bold uppercase text-[11px] tracking-widest">Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {comments.length > 0 ? comments.map((comment: any) => (
              <View key={comment.id} className="mb-6 pb-6 border-b border-border/30">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-text-primary font-bold text-sm">{comment.author?.fullName || 'Guest'}</Text>
                  <Text className="text-text-muted text-[10px]">{new Date(comment.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text className="text-text-secondary text-sm leading-relaxed">{comment.content}</Text>
              </View>
            )) : (
              <Text className="text-text-muted text-center italic py-10 opacity-50">Be the first to join the conversation.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BlogDetailScreen;
