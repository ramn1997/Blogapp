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

    // If it's a data URL, return as is
    if (url.startsWith('data:')) {
      return url;
    }

    // Normalizing absolute URLs from any known API host (local, IP, or production)
    // We want to redirect these to our current environment.apiUrl
    const apiHostMatch = url.match(/^https?:\/\/[^\/]+/);
    if (apiHostMatch) {
      const currentApiHost = environment.apiUrl.replace(/\/$/, '');
      const urlHost = apiHostMatch[0];
      
      // If it's already using the correct host, just ensure protocol matches
      if (urlHost === currentApiHost) {
        return url;
      }

      // If it points to any of our known backend patterns, replace it with current apiUrl
      const isStaleHost = urlHost.includes('localhost') || 
                          urlHost.includes('127.0.0.1') || 
                          urlHost.includes('192.168.') ||
                          urlHost.includes('azurewebsites.net');
                          
      if (isStaleHost) {
        return url.replace(urlHost, currentApiHost);
      }
    }

    // If it's a relative path (e.g., /uploads/xyz.png), prefix it
    if (url.startsWith('/')) {
      return `${environment.apiUrl}${url}`;
    }

    return url;
  }
}
