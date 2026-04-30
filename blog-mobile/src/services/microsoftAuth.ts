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

    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      prompt: AuthSession.Prompt.SelectAccount,
      usePKCE: false, // Must be false for Implicit Flow (IdToken)
      extraParams: {
        nonce: Math.random().toString(36).substring(2, 15)
      }
    });

    const result = await request.promptAsync(discovery);
    console.log('[Microsoft Auth] Result:', JSON.stringify(result, null, 2));

    if (result.type === 'success' && result.params.id_token) {
      const idToken = result.params.id_token;

      // The mobile token from MS doesn't decode perfectly in frontend without jwt-decode
      // But our backend extracts the email and providerId during validation
      const response = await api.post('/api/auth/oauth', {
        provider: 'microsoft',
        idToken: idToken
      });
      
      const { user, token } = response.data;

      // Use auth store to set the user and token
      const login = useAuthStore.getState().login;
      await login(user, token);

      return user;
    } else if (result.type !== 'cancel') {
      console.error('[Microsoft Auth] Missing id_token or failed. Result:', result);
      throw new Error(`Microsoft auth failed. Type: ${result.type}`);
    }
  } catch (error: any) {
    console.error('Microsoft Sign-In Error:', error);
    throw error;
  }
};
