import React, { useState } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { View, Text, Image, TouchableOpacity, Alert, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api, { API_BASE_URL } from '../services/api';
import { Edit2, Trash2, Heart, MessageCircle, Bookmark } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useColorScheme } from 'nativewind';

interface BlogCardProps {
  blog: any;
  onEdit?: () => void;
  onDelete?: (id?: any) => void;
  onTagClick?: (tag: string) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog: initialBlog, onEdit, onDelete, onTagClick }) => {
  // Normalize backend field names to what the component expects
  const normalizeBlog = (b: any) => ({
    ...b,
    isSaved: b.isSaved ?? b.isSavedByCurrentUser ?? false,
    isLiked: b.isLiked ?? b.isLikedByCurrentUser ?? false,
    likesCount: b.likesCount ?? b.likeCount ?? 0,
    commentsCount: b.commentsCount ?? b.commentCount ?? 0,
  });
  const [blog, setBlog] = useState(normalizeBlog(initialBlog));
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to save stories.');
      return;
    }

    // Optimistic Update
    const previousState = blog.isSaved;
    setBlog({ ...blog, isSaved: !previousState });

    try {
      const res = await api.post(`/api/blogs/${blog.id}/save`);
      // Update with final state from server
      setBlog({ ...blog, isSaved: res.data.saved });
    } catch (err) {
      // Rollback on error
      setBlog({ ...blog, isSaved: previousState });
      Alert.alert('Error', 'Failed to update saved status');
    }
  };

  const renderTags = () => {
    let tagsArray = [];
    const rawTags = blog.tags;
    
    if (Array.isArray(rawTags)) {
      tagsArray = rawTags;
    } else if (typeof rawTags === 'string' && rawTags.length > 0) {
      if (rawTags.includes('[')) {
        try {
          tagsArray = JSON.parse(rawTags);
        } catch {
          tagsArray = rawTags.split(',').map(t => t.trim());
        }
      } else {
        tagsArray = rawTags.split(',').map(t => t.trim());
      }
    }

    if (!Array.isArray(tagsArray) || tagsArray.length === 0) return null;

    return (
      <View className="flex-row flex-wrap mb-4">
        {tagsArray.slice(0, 3).map((tag: any, index: number) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => onTagClick?.(tag)}
            className="bg-accent/10 px-2.5 py-1 rounded-full mr-2 mb-1 border border-accent/20"
          >
            <Text className="text-accent text-[9px] font-bold uppercase tracking-widest">#{String(tag)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View className="bg-card mx-6 mb-10 border border-border/50 shadow-xl shadow-black/10 overflow-hidden rounded-2xl">
      <Pressable 
        onPress={() => navigation.navigate('BlogDetail', { id: blog.id })}
      >
        <Image 
          source={{ uri: getImageUrl(blog.coverImageUrl) }} 
          className="w-full h-60 bg-secondary/10"
          resizeMode="cover"
        />
      </Pressable>
      
      {/* Floating Save Button - Outside main Pressable to avoid event issues */}
      <TouchableOpacity 
        onPress={handleSave}
        className="absolute top-4 right-4 p-3"
      >
        <Bookmark size={18} color={blog.isSaved ? "#22c55e" : (isDark ? "#fff" : "#111")} fill={blog.isSaved ? "#22c55e" : "transparent"} />
      </TouchableOpacity>

      <View className="p-6">
        <Pressable onPress={() => navigation.navigate('BlogDetail', { id: blog.id })}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-accent text-[10px] font-bold tracking-[3px] uppercase">
              {blog.category}
            </Text>
            {blog.isPublished === false && (
              <View className="bg-secondary/20 px-2 py-0.5 rounded-sm">
                <Text className="text-text-muted text-[8px] uppercase tracking-widest font-bold">Draft</Text>
              </View>
            )}
          </View>

          <Text className="text-text-primary text-2xl font-serif mb-3 leading-tight tracking-tight">
            {blog.title}
          </Text>
          
          <Text numberOfLines={2} className="text-text-secondary text-sm mb-5 leading-relaxed opacity-70">
            {blog.summary}
          </Text>
          
          {renderTags()}
        </Pressable>

        <View className="flex-row items-center justify-between border-t border-border/30 pt-6 mt-2">
          <TouchableOpacity 
            onPress={() => navigation.navigate('AuthorProfile', { 
              authorId: blog.author?.id, 
              authorName: blog.author?.fullName,
              authorAvatar: blog.author?.avatarUrl
            })}
            className="flex-row items-center flex-1"
          >
             <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-3 border border-accent/20 overflow-hidden">
                {blog.author?.avatarUrl ? (
                  <Image source={{ uri: getImageUrl(blog.author.avatarUrl) }} className="w-full h-full" />
                ) : (
                  <Text className="text-accent text-sm font-serif">{(blog.author?.fullName || 'U').charAt(0)}</Text>
                )}
             </View>
             <View className="flex-1">
              <Text className="text-text-primary text-xs font-bold" numberOfLines={1}>{blog.author?.fullName || 'Auteur'}</Text>
              <Text className="text-text-muted text-[8px] uppercase tracking-widest mt-0.5">{blog.readTimeMinutes || 0} MIN READ</Text>
             </View>
          </TouchableOpacity>
          
          <View className="flex-row items-center ml-4">
            <View className="flex-row items-center mr-5">
              <Heart size={14} color={isDark ? "#999" : "#666"} fill={blog.isLiked ? "#ef4444" : "transparent"} />
              <Text className="text-text-muted text-[12px] ml-2 font-bold">
                {(() => {
                  const b = blog;
                  const e = b.engagement;
                  const val = b.likesCount ?? b.likes_count ?? b.likesCount ?? b.likes?.length ?? b.likes ?? e?.likesCount ?? e?.likes ?? 0;
                  if (typeof val === 'number') return val;
                  if (Array.isArray(val)) return val.length;
                  if (typeof val === 'object' && val !== null) return val.count ?? val.total ?? Object.keys(val).length ?? 0;
                  return 0;
                })()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MessageCircle size={14} color={isDark ? "#999" : "#666"} />
              <Text className="text-text-muted text-[12px] ml-2 font-bold">
                {(() => {
                  const b = blog;
                  const e = b.engagement;
                  const val = b.commentsCount ?? b.comments_count ?? b.commentsCount ?? b.comments?.length ?? b.comments ?? e?.commentsCount ?? e?.comments ?? 0;
                  if (typeof val === 'number') return val;
                  if (Array.isArray(val)) return val.length;
                  if (typeof val === 'object' && val !== null) return val.count ?? val.total ?? Object.keys(val).length ?? 0;
                  return 0;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {(onEdit || onDelete) && (
          <View className="flex-row justify-end mt-6 border-t border-border/30 pt-5">
            {onEdit && (
              <TouchableOpacity onPress={onEdit} className="mr-4 flex-row items-center px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
                <Edit2 size={14} color="#22c55e" />
                <Text className="text-accent text-[12px] font-semibold ml-2">Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(blog.id)} className="flex-row items-center px-4 py-2 bg-danger/10 border border-danger/20 rounded-full">
                <Trash2 size={14} color="#ef4444" />
                <Text className="text-danger text-[12px] font-semibold ml-2">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default BlogCard;
