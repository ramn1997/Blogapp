import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from './api';
import { useAuthStore } from '../store/authStore';

export const configureGoogleSignin = () => {
  GoogleSignin.configure({
    webClientId: '391768819107-0t2nt3q06qsspvg3re3b73e3jo1pfdku.apps.googleusercontent.com', // Corrected from frontend env
    offlineAccess: true,
  });
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;

    if (!idToken) throw new Error('No ID Token found');

    // Send the token and user info to your backend
    const response = await api.post('/api/auth/oauth', {
      provider: 'google',
      idToken: idToken,
      email: userInfo.data?.user.email,
      fullName: userInfo.data?.user.name,
      avatarUrl: userInfo.data?.user.photo,
      providerId: userInfo.data?.user.id
    });
    
    const { user, token } = response.data;

    // Use your auth store to set the user and token
    const login = useAuthStore.getState().login;
    await login(user, token);

    return user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
