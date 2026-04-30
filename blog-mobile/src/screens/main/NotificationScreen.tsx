import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import api, { API_BASE_URL } from '../../services/api';
import { Bell, Heart, MessageCircle, User, CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

interface AppNotification {
  id: number;
  type: string;
  message: string;
  relatedBlogId?: number;
  isRead: boolean;
  createdAt: string;
  actorName: string;
  actorAvatar?: string;
}

const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
    return () => { isMounted.current = false; };
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      if (isMounted.current) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Fetch notifications failed');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const markAsRead = async (id: number, blogId?: number) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (blogId) {
        navigation.navigate('BlogDetail', { id: blogId });
      }
    } catch (err) {
      console.error('Mark read failed');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read failed');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'like': return <Heart size={16} color="#ef4444" fill="#ef4444" />;
      case 'comment': return <MessageCircle size={16} color="#22c55e" />;
      case 'follow': return <User size={16} color="#3b82f6" />;
      default: return <Bell size={16} color="#888" />;
    }
  };

  const getActorAvatar = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanPath = url.replace(/\\/g, '/').startsWith('/') ? url.substring(1) : url;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  if (!user) {
    return (
      <View className="flex-1 bg-background px-6 items-center justify-center">
        <Bell size={64} className="text-text-muted opacity-30" />
        <Text className="text-text-primary text-xl font-serif mt-6 mb-2">Stay Connected</Text>
        <Text className="text-text-secondary text-center mb-10 px-8">Sign in to receive updates on your stories and community interactions.</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          className="bg-accent px-10 py-4 w-full items-center rounded-full shadow-sm"
        >
          <Text className="text-primary font-bold text-[15px]">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-2 pb-4 flex-row justify-end items-center">
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={markAllAsRead} className="bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
            <Text className="text-accent text-[10px] font-bold uppercase tracking-widest">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20 px-10">
            <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-6">
              <CheckCircle2 size={32} className="text-text-muted opacity-20" />
            </View>
            <Text className="text-text-primary text-lg font-serif mb-2">All caught up</Text>
            <Text className="text-text-muted text-center leading-relaxed">When people interaction with your content, it will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => markAsRead(item.id, item.relatedBlogId)}
            className={`px-6 py-5 flex-row items-start border-b border-border/30 ${!item.isRead ? 'bg-accent/5' : ''}`}
          >
            <View className="relative">
              <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center overflow-hidden border border-border/50">
                {item.actorAvatar ? (
                  <Image source={{ uri: getActorAvatar(item.actorAvatar) }} className="w-full h-full" />
                ) : (
                  <Text className="text-text-primary font-serif">{item.actorName?.charAt(0)}</Text>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full border border-border/50 shadow-sm">
                {getNotificationIcon(item.type)}
              </View>
            </View>
            
            <View className="flex-1 ml-4 mr-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-text-primary font-bold text-sm" numberOfLines={1}>{item.actorName}</Text>
                <Text className="text-text-muted text-[9px] uppercase tracking-tighter">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-text-secondary text-xs leading-relaxed" numberOfLines={2}>
                {item.message}
              </Text>
            </View>
            {!item.isRead && <View className="w-2 h-2 rounded-full bg-accent mt-2" />}
            <ChevronRight size={14} className="text-text-muted mt-2 opacity-30" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default NotificationScreen;
