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
      const lowerUrl = url.toLowerCase();

      // Special handling for Video / Post / Website URL
      const isYoutube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
      const isVimeo = lowerUrl.includes('vimeo.com');
      const isTwitter = lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com');
      
      let defaultType = (isYoutube || isVimeo) ? 'Video' : 'Website';
      let title = '';
      let description = '';
      let coverImage = '';
      let authorName = '';

      // 1. YouTube oEmbed (fast, accurate, no bot blocks, returns official video title & thumbnail)
      if (isYoutube) {
        try {
          const ytOembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
          const ytRes = await fetch(ytOembedUrl, { signal: AbortSignal.timeout(3500) });
          if (ytRes.ok) {
            const ytData = await ytRes.json();
            if (ytData.title) title = ytData.title;
            if (ytData.author_name) authorName = ytData.author_name;
            if (ytData.thumbnail_url) coverImage = ytData.thumbnail_url;
            defaultType = 'Video';
          }
        } catch (ytErr) {
          console.warn('YouTube oEmbed fallback:', (ytErr as Error)?.message);
        }

        // Fallback YouTube thumbnail if not provided
        if (!coverImage) {
          let videoId = '';
          try {
            if (url.includes('youtube.com/watch')) {
              const urlParams = new URLSearchParams(new URL(url).search);
              videoId = urlParams.get('v') || '';
            } else if (url.includes('youtu.be/')) {
              videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
            }
            if (videoId) {
              coverImage = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          } catch {
            // ignore
          }
        }
      }

      // 2. Vimeo oEmbed
      if (isVimeo && !title) {
        try {
          const vimeoOembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
          const vimeoRes = await fetch(vimeoOembedUrl, { signal: AbortSignal.timeout(3500) });
          if (vimeoRes.ok) {
            const vimeoData = await vimeoRes.json();
            if (vimeoData.title) title = vimeoData.title;
            if (vimeoData.author_name) authorName = vimeoData.author_name;
            if (vimeoData.thumbnail_url) coverImage = vimeoData.thumbnail_url;
            defaultType = 'Video';
          }
        } catch {
          // ignore
        }
      }

      // 3. Twitter / X oEmbed
      if (isTwitter && !title) {
        try {
          const twOembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
          const twRes = await fetch(twOembedUrl, { signal: AbortSignal.timeout(3500) });
          if (twRes.ok) {
            const twData = await twRes.json();
            if (twData.author_name) authorName = twData.author_name;
            if (twData.html) {
              const $tw = cheerio.load(twData.html);
              const tweetText = $tw('p').text();
              if (tweetText) {
                title = tweetText.length > 100 ? `${tweetText.substring(0, 97)}...` : tweetText;
              }
            }
            if (!title && twData.author_name) {
              title = `Post by ${twData.author_name} on X`;
            }
            defaultType = 'Post';
          }
        } catch {
          // ignore
        }
      }

      // 4. General OpenGraph & HTML scraping for articles, blogs, posts, websites
      if (!title || !coverImage) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          });
          clearTimeout(timeout);
          
          if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            
            if (!title) {
              title = $('meta[property="og:title"]').attr('content') || 
                      $('meta[name="twitter:title"]').attr('content') || 
                      $('meta[name="title"]').attr('content') || 
                      $('title').first().text() || 
                      $('h1').first().text() || '';
            }

            if (!description) {
              description = $('meta[property="og:description"]').attr('content') || 
                            $('meta[name="twitter:description"]').attr('content') || 
                            $('meta[name="description"]').attr('content') || '';
            }

            if (!authorName) {
              authorName = $('meta[name="author"]').attr('content') || 
                           $('meta[property="article:author"]').attr('content') || '';
            }
            
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
          }
        } catch (fetchError) {
          console.warn(`HTML fetch skipped for ${url}:`, (fetchError as Error)?.message);
        }
      }

      // 5. Fallback to noembed.com if still no title
      if (!title) {
        try {
          const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
          const noRes = await fetch(noembedUrl, { signal: AbortSignal.timeout(3000) });
          if (noRes.ok) {
            const noData = await noRes.json();
            if (noData.title) title = noData.title;
            if (!coverImage && noData.thumbnail_url) coverImage = noData.thumbnail_url;
            if (!authorName && noData.author_name) authorName = noData.author_name;
          }
        } catch {
          // ignore
        }
      }

      // Final cleanup
      let cleanTitle = title.trim();
      // Remove trailing website suffixes if overly noisy
      cleanTitle = cleanTitle.replace(/\s*[-–|]\s*(YouTube|Twitter|X|Medium|GitHub)$/i, '').trim() || cleanTitle;

      if (!cleanTitle) {
        try {
          const hostname = new URL(url).hostname.replace(/^www\./, '');
          cleanTitle = hostname;
        } catch {
          cleanTitle = defaultType;
        }
      }

      return res.json({
        title: cleanTitle,
        description: description.trim(),
        coverImage: coverImage.trim(),
        author: authorName.trim(),
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
