/**
 * Helper to normalize, validate, and parse URLs safely
 */
export function normalizeUrl(input: string): string {
  if (!input) return '';
  let trimmed = input.trim();
  if (!trimmed) return '';

  // Remove leading dots or invalid characters from copy-paste mistakes (e.g., ".milanote.com" or " . ")
  trimmed = trimmed.replace(/^[.\s/]+/, '');

  if (!trimmed) return '';

  // If missing protocol, prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    // Verify hostname has at least one valid domain segment and no invalid leading dots
    if (!parsed.hostname || parsed.hostname.startsWith('.') || !parsed.hostname.includes('.')) {
      // If no dot or invalid hostname, return as is or empty
      return parsed.href;
    }
    return parsed.href;
  } catch {
    return '';
  }
}

export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function extractYoutubePlaylistId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]list=([^#&?]+)/);
  return match ? match[1] : null;
}

export function getFaviconUrl(url: string, size: number = 128): string {
  if (!url) return '';
  try {
    const validUrl = normalizeUrl(url);
    if (!validUrl) return '';
    const hostname = new URL(validUrl).hostname.replace(/^[.]+/, '');
    if (!hostname || !hostname.includes('.')) return '';
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    return '';
  }
}

export function getDuckDuckGoFaviconUrl(url: string): string {
  if (!url) return '';
  try {
    const validUrl = normalizeUrl(url);
    if (!validUrl) return '';
    const hostname = new URL(validUrl).hostname.replace(/^[.]+/, '');
    if (!hostname || !hostname.includes('.')) return '';
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return '';
  }
}

export function getAutoThumbnail(url: string): string {
  if (!url) return '';
  
  try {
    const validUrl = normalizeUrl(url);
    if (!validUrl) return '';
    const parsed = new URL(validUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^[.]+/, '');
    if (!hostname || !hostname.includes('.')) return '';

    // 1. YouTube Video
    const ytId = extractYoutubeId(validUrl);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }

    // 2. Vimeo
    if (hostname.includes('vimeo.com')) {
      const vimeoMatch = validUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
      }
    }

    // 3. GitHub
    if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `https://opengraph.githubassets.com/1/${parts[0]}/${parts[1]}`;
      } else if (parts.length === 1) {
        return `https://avatars.githubusercontent.com/${parts[0]}`;
      }
    }

    // 4. Fallback screenshot via Microlink CDN
    return `https://api.microlink.io?url=${encodeURIComponent(validUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  } catch {
    return '';
  }
}

/**
 * Returns the appropriate image based on resource type:
 * - 'Website' -> Favicon
 * - 'Post' | 'Video' -> Thumbnail / Cover preview
 */
export function getResourceImage(type: string, url: string, customImage?: string): string {
  if (customImage && customImage.trim()) {
    return customImage.trim();
  }
  
  if (!url || !url.trim()) {
    return '';
  }
  
  if (type === 'Website') {
    return getFaviconUrl(url, 128);
  }
  
  return getAutoThumbnail(url);
}
