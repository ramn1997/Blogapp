import { API_BASE_URL } from '../services/api';

/**
 * Normalizes an image URL to handle:
 * 1. Relative paths from the backend (/uploads/...)
 * 2. Stale absolute URLs pointing to old IP addresses or localhost
 * 3. Fallback for missing images
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url) {
    return 'https://via.placeholder.com/600x300?text=Scribeflow';
  }

  // If it's already a correct URL (e.g., data URL or already points to our current API)
  if (url.startsWith('data:') || url.startsWith(API_BASE_URL)) {
    return url;
  }

  // Handle absolute URLs that point to stale backend hosts (IPs, localhost, etc)
  const apiHostMatch = url.match(/^https?:\/\/[^\/]+/);
  if (apiHostMatch) {
    const urlHost = apiHostMatch[0];
    const currentApiHost = API_BASE_URL.replace(/\/$/, '');
    
    // List of known stale patterns we want to repair
    const isStaleHost = urlHost.includes('localhost') || 
                        urlHost.includes('127.0.0.1') || 
                        urlHost.includes('192.168.') ||
                        urlHost.includes('azurewebsites.net');
                        
    if (isStaleHost) {
      return url.replace(urlHost, currentApiHost);
    }
  }

  // Handle relative paths (e.g., /uploads/xyz.png)
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  // If it's a relative path without leading slash, add one
  if (!url.startsWith('http')) {
    return `${API_BASE_URL}/${url}`;
  }

  return url;
};
