import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import cors from 'cors';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { syncUserData, getUserData } from './src/db/sync.ts';

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
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Special handling for YouTube URL
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      let defaultTitle = isYoutube ? 'YouTube Video' : 'Website';
      let defaultType = 'Website';
      let coverImage = '';

      if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
        defaultType = 'YouTube Video';
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
          const urlParams = new URLSearchParams(new URL(url).search);
          videoId = urlParams.get('v') || '';
        } else if (url.includes('youtu.be')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) {
          coverImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      } else if (url.includes('youtube.com/playlist')) {
        defaultType = 'YouTube Playlist';
      }

      // Try fetching the actual page for metadata
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          const title = $('title').text() || $('meta[property="og:title"]').attr('content') || defaultTitle;
          const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
          
          if (!coverImage) {
            coverImage = $('meta[property="og:image"]').attr('content') || '';
          }
          
          return res.json({
            title: title.trim(),
            description: description.trim(),
            coverImage,
            type: defaultType,
          });
        }
      } catch (fetchError) {
        console.error('Error fetching URL:', fetchError);
        // Fallback to basic extraction
      }

      return res.json({
        title: defaultTitle,
        description: '',
        coverImage,
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
