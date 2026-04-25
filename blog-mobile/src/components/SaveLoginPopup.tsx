import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, ShieldCheck, Heart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface SaveLoginPopupProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
}

const { width } = Dimensions.get('window');

const SaveLoginPopup = ({ visible, onClose, userName }: SaveLoginPopupProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
          {BlurView ? (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
          )}
        
        <Animated.View 
          entering={FadeIn.duration(400)} 
          exiting={FadeOut.duration(200)}
          style={styles.modalContent}
        >
          <View style={styles.iconContainer}>
            <ShieldCheck size={48} color="#C5A059" strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>Secure Login</Text>
          <Text style={styles.greeting}>Welcome back, {userName}</Text>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <CheckCircle size={16} color="#C5A059" />
              <Text style={styles.infoText}>Encrypted session established</Text>
            </View>
            <View style={styles.infoRow}>
              <CheckCircle size={16} color="#C5A059" />
              <Text style={styles.infoText}>Secure credentials saved</Text>
            </View>
            <View style={styles.infoRow}>
              <CheckCircle size={16} color="#C5A059" />
              <Text style={styles.infoText}>Biometric ready for next time</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Your login information has been securely stored in your device's protected vault.
          </Text>

          <TouchableOpacity 
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>ENTER SCRIBEFLOW</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Heart size={12} color="#888" />
            <Text style={styles.footerText}>Crafted with security in mind</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    padding: 20,
    borderRadius: 100,
  },
  title: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'serif',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
  },
  description: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    backgroundColor: '#C5A059',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: '#666',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default SaveLoginPopup;
