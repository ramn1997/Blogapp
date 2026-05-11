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

  // 1. Normalize backslashes to forward slashes (common in .NET paths)
  let normalizedUrl = url.replace(/\\/g, '/');

  // 2. Handle absolute URLs and stale IP addresses
  const apiHostMatch = normalizedUrl.match(/^https?:\/\/[^\/]+/);
  if (apiHostMatch) {
    const urlHost = apiHostMatch[0];
    const currentApiHost = API_BASE_URL.replace(/\/$/, '');
    
    // List of known stale patterns we want to repair
    const isStaleHost = urlHost.includes('localhost') || 
                        urlHost.includes('127.0.0.1') || 
                        urlHost.includes('192.168.') ||
                        urlHost.includes('azurewebsites.net');
                        
    if (isStaleHost && urlHost !== currentApiHost) {
      normalizedUrl = normalizedUrl.replace(urlHost, currentApiHost);
    }
  }

  // 3. If it's already a full URL now, return it
  if (normalizedUrl.startsWith('http') || normalizedUrl.startsWith('data:')) {
    return normalizedUrl;
  }

  // 4. Handle relative paths (e.g., /uploads/xyz.png or uploads/xyz.png)
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl;
  return `${baseUrl}/${cleanPath}`;
};
