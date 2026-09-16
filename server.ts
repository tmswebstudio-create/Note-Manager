import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import cors from 'cors';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { syncUserData, getUserData } from './src/db/sync.ts';

function cleanAndNormalizeUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Clean leading dots or slashes
  trimmed = trimmed.replace(/^[.\s/]+/, '');
  if (!trimmed) return null;

  // If no protocol, add https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^[.]+/, '');
    if (!host || !host.includes('.')) {
      return null;
    }
    parsed.hostname = host;
    return parsed.href;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // API Data Endpoints
  app.get('/api/data', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) return res.status(401).json({ error: 'User not found in DB' });
      const data = await getUserData(req.dbUser.id);
      res.json(data);
    } catch (error) {
      console.error('Failed to get data:', error);
      res.status(500).json({ error: 'Failed to get data' });
    }
  });

  app.post('/api/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) return res.status(401).json({ error: 'User not found in DB' });
      await syncUserData(req.dbUser.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to sync data:', error);
      res.status(500).json({ error: 'Failed to sync data' });
    }
  });

  // API Route for URL metadata fetching
  app.post('/api/metadata', async (req, res) => {
    try {
      const { url: rawUrl } = req.body;
      const normalizedUrl = cleanAndNormalizeUrl(rawUrl);
      
      if (!normalizedUrl) {
        return res.status(400).json({ error: 'Valid URL is required' });
      }

      const url = normalizedUrl;

      // Special handling for Video / Post / Website URL
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
      let defaultTitle = isYoutube ? 'Video' : 'Website';
      let defaultType = isYoutube ? 'Video' : 'Website';
      let coverImage = '';

      if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
        defaultType = 'Video';
        let videoId = '';
        try {
          if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get('v') || '';
          } else if (url.includes('youtu.be')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
          }
          if (videoId) {
            coverImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        } catch {
          // ignore parsing errors
        }
      } else if (url.includes('youtube.com/playlist') || url.includes('vimeo.com')) {
        defaultType = 'Video';
      }

      // Try fetching the actual page for metadata with timeout & error handling
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          const title = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text() || defaultTitle;
          const description = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
          
          if (!coverImage) {
            coverImage = $('meta[property="og:image:secure_url"]').attr('content') ||
              $('meta[property="og:image"]').attr('content') ||
              $('meta[name="twitter:image:src"]').attr('content') ||
              $('meta[name="twitter:image"]').attr('content') ||
              $('meta[itemprop="image"]').attr('content') ||
              $('link[rel="image_src"]').attr('href') || '';

            // Handle relative URLs for og:image
            if (coverImage && !coverImage.startsWith('http')) {
              try {
                coverImage = new URL(coverImage, url).href;
              } catch {
                coverImage = '';
              }
            }
          }
          
          return res.json({
            title: title.trim() || defaultTitle,
            description: description.trim(),
            coverImage: coverImage.trim(),
            type: defaultType,
          });
        }
      } catch (fetchError) {
        // Log friendly message without crashing
        console.warn(`URL fetch skipped or failed gracefully for ${url}:`, (fetchError as Error)?.message);
      }

      return res.json({
        title: defaultTitle,
        description: '',
        coverImage: coverImage.trim(),
        type: defaultType,
      });

    } catch (error) {
      console.error('Metadata endpoint error:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
