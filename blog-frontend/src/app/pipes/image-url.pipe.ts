import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | undefined | null): string {
    if (!url) {
      return '';
    }

    // Normalize backslashes to forward slashes (common in .NET paths)
    let normalizedUrl = url.replace(/\\/g, '/');

    // 1. If it's a data URL, return as is
    if (normalizedUrl.startsWith('data:')) {
      return normalizedUrl;
    }

    // 2. Normalizing absolute URLs from any known API host (local, IP, or production)
    const apiHostMatch = normalizedUrl.match(/^https?:\/\/[^\/]+/);
    const currentApiHost = environment.apiUrl.replace(/\/$/, '');

    if (apiHostMatch) {
      const urlHost = apiHostMatch[0];
      
      // If it's already using the correct host, just return it
      if (urlHost === currentApiHost) {
        return normalizedUrl;
      }

      // If it points to any of our known backend patterns, replace it with current apiUrl
      const isStaleHost = urlHost.includes('localhost') || 
                          urlHost.includes('127.0.0.1') || 
                          urlHost.includes('192.168.') ||
                          urlHost.includes('azurewebsites.net');
                          
      if (isStaleHost) {
        return normalizedUrl.replace(urlHost, currentApiHost);
      }
      
      // If it's a full URL but not one of ours (e.g. placeholder), return as is
      return normalizedUrl;
    }

    // 3. Handle relative paths (e.g., /uploads/xyz.png or uploads/xyz.png)
    const cleanPath = normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl;
    return `${currentApiHost}/${cleanPath}`;
  }
}
