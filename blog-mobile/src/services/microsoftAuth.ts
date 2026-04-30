import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import api from './api';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Microsoft Azure AD endpoint discovery
const discovery = {
  authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

const CLIENT_ID = '96d0e710-d245-42f7-acba-24747c4c0003';

export const signInWithMicrosoft = async () => {
  try {
    // Generate the redirect URI (e.g., scribeflow://auth)
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'scribeflow',
      path: 'auth'
    });
    console.log('[Microsoft Auth] Redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      prompt: AuthSession.Prompt.SelectAccount,
      usePKCE: false, 
      extraParams: {
        nonce: Math.random().toString(36).substring(2, 15)
      }
    });

    console.log('[Microsoft Auth] Prompting user...');
    const result = await request.promptAsync(discovery);
    console.log('[Microsoft Auth] Result:', JSON.stringify(result, null, 2));

    if (result.type === 'success' && result.params.id_token) {
      const idToken = result.params.id_token;
      console.log('[Microsoft Auth] Sending id_token to backend...');

      const response = await api.post('/api/auth/oauth', {
        provider: 'microsoft',
        idToken: idToken
      });
      
      const { user, token } = response.data;
      console.log('[Microsoft Auth] Backend success for user:', user.email);

      const login = useAuthStore.getState().login;
      await login(user, token);

      return user;
    } else if (result.type === 'cancel') {
      console.log('[Microsoft Auth] User cancelled login');
      return null;
    } else {
      console.error('[Microsoft Auth] Failure. Type:', result.type, 'Error:', (result as any).error);
      throw new Error(`Microsoft auth failed: ${(result as any).error || result.type}`);
    }
  } catch (error: any) {
    console.error('Microsoft Sign-In Error:', error);
    throw error;
  }
};
