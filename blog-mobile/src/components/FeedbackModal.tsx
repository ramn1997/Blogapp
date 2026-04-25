import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { AlertCircle, CheckCircle2, X } from 'lucide-react-native';

interface FeedbackModalProps {
  visible: boolean;
  type: 'error' | 'success';
  title: string;
  message: string;
  onClose: () => void;
}

const FeedbackModal = ({ visible, type, title, message, onClose }: FeedbackModalProps) => {
  const isError = type === 'error';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <View className="bg-card w-full p-8 border border-border shadow-2xl">
          <View className="flex-row justify-between items-start mb-6">
            <View className="p-3 rounded-full bg-accent/10">
              {isError ? (
                <AlertCircle size={32} color="#ef4444" />
              ) : (
                <CheckCircle2 size={32} color="#22c55e" />
              )}
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text className="text-text-primary text-2xl font-serif mb-3 leading-tight">{title}</Text>
          <Text className="text-text-secondary text-sm leading-relaxed mb-8 opacity-80">{message}</Text>

          <TouchableOpacity 
            onPress={onClose}
            className={`w-full py-4 items-center rounded-sm ${isError ? 'bg-danger/10 border border-danger/20' : 'bg-accent'}`}
          >
            <Text className={`font-bold uppercase tracking-widest text-[10px] ${isError ? 'text-danger' : 'text-primary'}`}>
              {isError ? 'Dismiss' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackModal;
