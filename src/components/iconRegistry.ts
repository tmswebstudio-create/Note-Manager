import React from 'react';
import {
  Code, Terminal, Cpu, Database, Server, GitBranch, Layers, Bug, Braces, Binary, Globe, FileCode, Wrench, Shield, Key, Webhook, Box, Cloud, Network, Workflow, Flame, Zap,
  Video, Play, Music, Headphones, Camera, Film, Radio, Tv, Mic, Volume2, Image as LucideImage, Clapperboard, Disc, Sliders,
  Palette, PenTool, Brush, Layout, Eye, Wand2, Compass, Crop, Scissors, Droplet, Sun, Sparkles, Feather, Shapes,
  BookOpen, Bookmark, FileText, CheckSquare, ClipboardList, Briefcase, Calendar, Clock, Inbox, Mail, StickyNote, Archive, Folder, BookMarked, ListTodo, Presentation,
  Users, User, MessageSquare, MessagesSquare, Share2, Heart, Star, ThumbsUp, Send, Bell, Award, Smile, Coffee, Gift,
  Search, Settings, Filter, Download, Upload, ExternalLink, Link2, MapPin, Gauge, ShieldCheck, HelpCircle, LifeBuoy, Hammer,
  DollarSign, CreditCard, ShoppingBag, ShoppingCart, TrendingUp, BarChart2, PieChart, LineChart, Wallet, Coins,
  Smartphone, Monitor, Tablet, Laptop, HardDrive, Wifi, Bluetooth, RadioTower, Rocket, Atom, Lightbulb, Target, Flag, Compass as CompassIcon, Anchor
} from 'lucide-react';

export interface IconItem {
  id: string; // e.g. "lucide:Code" or "brand:react"
  name: string; // "Code" or "React"
  category: string; // "Dev & Code", "Media", "Design", "Productivity", "Social", "Finance", "Brands & Logos"
  type: 'lucide' | 'url';
  iconComponent?: React.ComponentType<{ size?: number; className?: string }>;
  url?: string;
  keywords: string[];
}

export const LUCIDE_ICONS_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Code, Terminal, Cpu, Database, Server, GitBranch, Layers, Bug, Braces, Binary, Globe, FileCode, Wrench, Shield, Key, Webhook, Box, Cloud, Network, Workflow, Flame, Zap,
  Video, Play, Music, Headphones, Camera, Film, Radio, Tv, Mic, Volume2, Image: LucideImage, Clapperboard, Disc, Sliders,
  Palette, PenTool, Brush, Layout, Eye, Wand2, Compass, Crop, Scissors, Droplet, Sun, Sparkles, Feather, Shapes,
  BookOpen, Bookmark, FileText, CheckSquare, ClipboardList, Briefcase, Calendar, Clock, Inbox, Mail, StickyNote, Archive, Folder, BookMarked, ListTodo, Presentation,
  Users, User, MessageSquare, MessagesSquare, Share2, Heart, Star, ThumbsUp, Send, Bell, Award, Smile, Coffee, Gift,
  Search, Settings, Filter, Download, Upload, ExternalLink, Link2, MapPin, Gauge, ShieldCheck, HelpCircle, LifeBuoy, Hammer,
  DollarSign, CreditCard, ShoppingBag, ShoppingCart, TrendingUp, BarChart2, PieChart, LineChart, Wallet, Coins,
  Smartphone, Monitor, Tablet, Laptop, HardDrive, Wifi, Bluetooth, RadioTower, Rocket, Atom, Lightbulb, Target, Flag, Anchor
};

export const ALL_ICONS: IconItem[] = [
  // --- TECH BRANDS & LOGOS ---
  { id: 'https://cdn.simpleicons.org/react/61DAFB', name: 'React', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/react/61DAFB', keywords: ['react', 'js', 'frontend', 'ui', 'library', 'web'] },
  { id: 'https://cdn.simpleicons.org/typescript/3178C6', name: 'TypeScript', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/typescript/3178C6', keywords: ['ts', 'typescript', 'javascript', 'code', 'types'] },
  { id: 'https://cdn.simpleicons.org/javascript/F7DF1E', name: 'JavaScript', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/javascript/F7DF1E', keywords: ['js', 'javascript', 'web', 'script', 'programming'] },
  { id: 'https://cdn.simpleicons.org/python/3776AB', name: 'Python', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/python/3776AB', keywords: ['python', 'ai', 'data', 'django', 'fastapi'] },
  { id: 'https://cdn.simpleicons.org/nextdotjs/000000', name: 'Next.js', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/nextdotjs/000000', keywords: ['next', 'nextjs', 'react', 'ssr', 'vercel'] },
  { id: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', name: 'Tailwind CSS', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', keywords: ['tailwind', 'css', 'style', 'design'] },
  { id: 'https://cdn.simpleicons.org/vuedotjs/4FC08D', name: 'Vue.js', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/vuedotjs/4FC08D', keywords: ['vue', 'vuejs', 'frontend', 'framework'] },
  { id: 'https://cdn.simpleicons.org/angular/DD0031', name: 'Angular', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/angular/DD0031', keywords: ['angular', 'google', 'framework'] },
  { id: 'https://cdn.simpleicons.org/nodedotjs/5FA04E', name: 'Node.js', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/nodedotjs/5FA04E', keywords: ['node', 'backend', 'server', 'javascript'] },
  { id: 'https://cdn.simpleicons.org/go/00ADD8', name: 'Go / Golang', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/go/00ADD8', keywords: ['go', 'golang', 'backend', 'concurrency'] },
  { id: 'https://cdn.simpleicons.org/rust/000000', name: 'Rust', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/rust/000000', keywords: ['rust', 'systems', 'memory', 'cargo'] },
  { id: 'https://cdn.simpleicons.org/docker/2496ED', name: 'Docker', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/docker/2496ED', keywords: ['docker', 'containers', 'devops'] },
  { id: 'https://cdn.simpleicons.org/kubernetes/326CE5', name: 'Kubernetes', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/kubernetes/326CE5', keywords: ['k8s', 'kubernetes', 'cloud', 'devops'] },
  { id: 'https://cdn.simpleicons.org/github/181717', name: 'GitHub', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/github/181717', keywords: ['github', 'git', 'repo', 'code', 'open source'] },
  { id: 'https://cdn.simpleicons.org/gitlab/FC6D26', name: 'GitLab', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/gitlab/FC6D26', keywords: ['gitlab', 'git', 'ci', 'cd', 'devops'] },
  { id: 'https://cdn.simpleicons.org/figma/F24E1E', name: 'Figma', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/figma/F24E1E', keywords: ['figma', 'design', 'ui', 'ux', 'prototype'] },
  { id: 'https://cdn.simpleicons.org/notion/000000', name: 'Notion', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/notion/000000', keywords: ['notion', 'notes', 'docs', 'wiki', 'organizer'] },
  { id: 'https://cdn.simpleicons.org/openai/412991', name: 'OpenAI', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/openai/412991', keywords: ['openai', 'chatgpt', 'ai', 'llm', 'gpt'] },
  { id: 'https://cdn.simpleicons.org/google/4285F4', name: 'Google', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/google/4285F4', keywords: ['google', 'search', 'workspace', 'cloud'] },
  { id: 'https://cdn.simpleicons.org/firebase/FFCA28', name: 'Firebase', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/firebase/FFCA28', keywords: ['firebase', 'database', 'auth', 'firestore'] },
  { id: 'https://cdn.simpleicons.org/supabase/3ECF8E', name: 'Supabase', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/supabase/3ECF8E', keywords: ['supabase', 'postgres', 'sql', 'backend'] },
  { id: 'https://cdn.simpleicons.org/postgresql/4169E1', name: 'PostgreSQL', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/postgresql/4169E1', keywords: ['postgres', 'sql', 'database', 'rdbms'] },
  { id: 'https://cdn.simpleicons.org/mongodb/47A248', name: 'MongoDB', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/mongodb/47A248', keywords: ['mongodb', 'nosql', 'database', 'json'] },
  { id: 'https://cdn.simpleicons.org/redis/DC382D', name: 'Redis', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/redis/DC382D', keywords: ['redis', 'cache', 'memory', 'kv'] },
  { id: 'https://cdn.simpleicons.org/graphql/E10098', name: 'GraphQL', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/graphql/E10098', keywords: ['graphql', 'api', 'query', 'schema'] },
  { id: 'https://cdn.simpleicons.org/youtube/FF0000', name: 'YouTube', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/youtube/FF0000', keywords: ['youtube', 'video', 'stream', 'media', 'tutorials'] },
  { id: 'https://cdn.simpleicons.org/x/000000', name: 'Twitter / X', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/x/000000', keywords: ['twitter', 'x', 'social', 'news', 'tweets'] },
  { id: 'https://cdn.simpleicons.org/discord/5865F2', name: 'Discord', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/discord/5865F2', keywords: ['discord', 'chat', 'gaming', 'community'] },
  { id: 'https://cdn.simpleicons.org/slack/4A154B', name: 'Slack', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/slack/4A154B', keywords: ['slack', 'chat', 'work', 'teams'] },
  { id: 'https://cdn.simpleicons.org/dribbble/EA4C89', name: 'Dribbble', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/dribbble/EA4C89', keywords: ['dribbble', 'design', 'inspiration', 'art'] },
  { id: 'https://cdn.simpleicons.org/medium/000000', name: 'Medium', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/medium/000000', keywords: ['medium', 'blog', 'articles', 'writing'] },
  { id: 'https://cdn.simpleicons.org/linkedin/0A66C2', name: 'LinkedIn', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/linkedin/0A66C2', keywords: ['linkedin', 'career', 'network', 'jobs'] },
  { id: 'https://cdn.simpleicons.org/spotify/1DB954', name: 'Spotify', category: 'Brands & Logos', type: 'url', url: 'https://cdn.simpleicons.org/spotify/1DB954', keywords: ['spotify', 'music', 'audio', 'podcast'] },

  // --- DEVELOPMENT & CODING ---
  { id: 'lucide:Code', name: 'Code', category: 'Dev & Coding', type: 'lucide', iconComponent: Code, keywords: ['code', 'programming', 'developer', 'syntax', 'brackets'] },
  { id: 'lucide:Terminal', name: 'Terminal', category: 'Dev & Coding', type: 'lucide', iconComponent: Terminal, keywords: ['terminal', 'cli', 'bash', 'shell', 'console'] },
  { id: 'lucide:Cpu', name: 'Processor', category: 'Dev & Coding', type: 'lucide', iconComponent: Cpu, keywords: ['cpu', 'chip', 'processor', 'hardware', 'hardware'] },
  { id: 'lucide:Database', name: 'Database', category: 'Dev & Coding', type: 'lucide', iconComponent: Database, keywords: ['database', 'db', 'storage', 'data', 'sql'] },
  { id: 'lucide:Server', name: 'Server', category: 'Dev & Coding', type: 'lucide', iconComponent: Server, keywords: ['server', 'backend', 'hosting', 'infrastructure'] },
  { id: 'lucide:GitBranch', name: 'Git Branch', category: 'Dev & Coding', type: 'lucide', iconComponent: GitBranch, keywords: ['git', 'branch', 'version', 'vcs', 'commit'] },
  { id: 'lucide:Layers', name: 'Layers', category: 'Dev & Coding', type: 'lucide', iconComponent: Layers, keywords: ['layers', 'stack', 'fullstack', 'architecture'] },
  { id: 'lucide:Bug', name: 'Bug / Debug', category: 'Dev & Coding', type: 'lucide', iconComponent: Bug, keywords: ['bug', 'debug', 'error', 'fix', 'testing'] },
  { id: 'lucide:Braces', name: 'Braces', category: 'Dev & Coding', type: 'lucide', iconComponent: Braces, keywords: ['braces', 'json', 'curly', 'code'] },
  { id: 'lucide:Binary', name: 'Binary', category: 'Dev & Coding', type: 'lucide', iconComponent: Binary, keywords: ['binary', 'bits', 'algorithms', 'math', 'bytes'] },
  { id: 'lucide:Globe', name: 'Web / Globe', category: 'Dev & Coding', type: 'lucide', iconComponent: Globe, keywords: ['globe', 'web', 'internet', 'network', 'url'] },
  { id: 'lucide:FileCode', name: 'Code File', category: 'Dev & Coding', type: 'lucide', iconComponent: FileCode, keywords: ['file', 'code', 'source', 'script'] },
  { id: 'lucide:Cloud', name: 'Cloud', category: 'Dev & Coding', type: 'lucide', iconComponent: Cloud, keywords: ['cloud', 'aws', 'gcp', 'azure', 'serverless'] },
  { id: 'lucide:Box', name: 'Package / Box', category: 'Dev & Coding', type: 'lucide', iconComponent: Box, keywords: ['box', 'package', 'module', 'npm', 'crate'] },
  { id: 'lucide:Network', name: 'Network', category: 'Dev & Coding', type: 'lucide', iconComponent: Network, keywords: ['network', 'nodes', 'graph', 'distributed'] },
  { id: 'lucide:Workflow', name: 'Workflow', category: 'Dev & Coding', type: 'lucide', iconComponent: Workflow, keywords: ['workflow', 'pipeline', 'ci', 'automation'] },
  { id: 'lucide:Flame', name: 'Popular / Hot', category: 'Dev & Coding', type: 'lucide', iconComponent: Flame, keywords: ['fire', 'flame', 'hot', 'popular', 'trending'] },
  { id: 'lucide:Zap', name: 'Fast / Lightning', category: 'Dev & Coding', type: 'lucide', iconComponent: Zap, keywords: ['zap', 'lightning', 'fast', 'speed', 'performance'] },
  { id: 'lucide:Key', name: 'Auth / Security Key', category: 'Dev & Coding', type: 'lucide', iconComponent: Key, keywords: ['key', 'auth', 'security', 'token', 'api key'] },
  { id: 'lucide:Shield', name: 'Security Shield', category: 'Dev & Coding', type: 'lucide', iconComponent: Shield, keywords: ['shield', 'security', 'protection', 'privacy'] },
  { id: 'lucide:Webhook', name: 'Webhook', category: 'Dev & Coding', type: 'lucide', iconComponent: Webhook, keywords: ['webhook', 'api', 'event', 'integration'] },

  // --- MEDIA & CONTENT ---
  { id: 'lucide:Video', name: 'Video', category: 'Media & Video', type: 'lucide', iconComponent: Video, keywords: ['video', 'movies', 'player', 'clip', 'stream'] },
  { id: 'lucide:Play', name: 'Play', category: 'Media & Video', type: 'lucide', iconComponent: Play, keywords: ['play', 'start', 'video', 'media', 'playback'] },
  { id: 'lucide:Music', name: 'Music', category: 'Media & Video', type: 'lucide', iconComponent: Music, keywords: ['music', 'audio', 'song', 'sound', 'melody'] },
  { id: 'lucide:Headphones', name: 'Headphones', category: 'Media & Video', type: 'lucide', iconComponent: Headphones, keywords: ['headphones', 'audio', 'listening', 'music', 'sound'] },
  { id: 'lucide:Camera', name: 'Camera / Photo', category: 'Media & Video', type: 'lucide', iconComponent: Camera, keywords: ['camera', 'photo', 'picture', 'photography'] },
  { id: 'lucide:Film', name: 'Film / Cinema', category: 'Media & Video', type: 'lucide', iconComponent: Film, keywords: ['film', 'cinema', 'movie', 'production'] },
  { id: 'lucide:Mic', name: 'Microphone', category: 'Media & Video', type: 'lucide', iconComponent: Mic, keywords: ['mic', 'microphone', 'podcast', 'recording', 'voice'] },
  { id: 'lucide:Volume2', name: 'Speaker / Audio', category: 'Media & Video', type: 'lucide', iconComponent: Volume2, keywords: ['volume', 'audio', 'sound', 'speaker'] },
  { id: 'lucide:Image', name: 'Image / Gallery', category: 'Media & Video', type: 'lucide', iconComponent: LucideImage, keywords: ['image', 'photo', 'picture', 'gallery', 'art'] },
  { id: 'lucide:Clapperboard', name: 'Clapperboard', category: 'Media & Video', type: 'lucide', iconComponent: Clapperboard, keywords: ['clapperboard', 'movie', 'scene', 'take', 'director'] },
  { id: 'lucide:Radio', name: 'Radio / Broadcast', category: 'Media & Video', type: 'lucide', iconComponent: Radio, keywords: ['radio', 'broadcast', 'frequency', 'stream'] },
  { id: 'lucide:Tv', name: 'Television', category: 'Media & Video', type: 'lucide', iconComponent: Tv, keywords: ['tv', 'television', 'screen', 'display'] },
  { id: 'lucide:Sliders', name: 'Sliders / Mixer', category: 'Media & Video', type: 'lucide', iconComponent: Sliders, keywords: ['sliders', 'mixer', 'equalizer', 'audio', 'settings'] },

  // --- DESIGN & CREATIVE ---
  { id: 'lucide:Palette', name: 'Color Palette', category: 'Design & Art', type: 'lucide', iconComponent: Palette, keywords: ['palette', 'color', 'art', 'design', 'paint'] },
  { id: 'lucide:PenTool', name: 'Vector Pen', category: 'Design & Art', type: 'lucide', iconComponent: PenTool, keywords: ['pen', 'vector', 'bezier', 'drawing', 'illustrator'] },
  { id: 'lucide:Brush', name: 'Paintbrush', category: 'Design & Art', type: 'lucide', iconComponent: Brush, keywords: ['brush', 'paint', 'art', 'canvas'] },
  { id: 'lucide:Layout', name: 'UI Layout', category: 'Design & Art', type: 'lucide', iconComponent: Layout, keywords: ['layout', 'ui', 'wireframe', 'grid', 'frontend'] },
  { id: 'lucide:Wand2', name: 'Magic Wand / AI', category: 'Design & Art', type: 'lucide', iconComponent: Wand2, keywords: ['magic', 'wand', 'ai', 'generate', 'creative'] },
  { id: 'lucide:Eye', name: 'Eye / Visual', category: 'Design & Art', type: 'lucide', iconComponent: Eye, keywords: ['eye', 'view', 'vision', 'watch', 'preview'] },
  { id: 'lucide:Compass', name: 'Compass', category: 'Design & Art', type: 'lucide', iconComponent: Compass, keywords: ['compass', 'geometry', 'measure', 'guide'] },
  { id: 'lucide:Crop', name: 'Crop', category: 'Design & Art', type: 'lucide', iconComponent: Crop, keywords: ['crop', 'photo', 'edit', 'aspect'] },
  { id: 'lucide:Sparkles', name: 'Sparkles / AI', category: 'Design & Art', type: 'lucide', iconComponent: Sparkles, keywords: ['sparkles', 'ai', 'magic', 'shine', 'glow', 'new'] },
  { id: 'lucide:Feather', name: 'Feather / Lightweight', category: 'Design & Art', type: 'lucide', iconComponent: Feather, keywords: ['feather', 'writing', 'blog', 'light'] },
  { id: 'lucide:Shapes', name: 'Shapes & Icons', category: 'Design & Art', type: 'lucide', iconComponent: Shapes, keywords: ['shapes', 'geometry', 'circle', 'square', 'triangle'] },
  { id: 'lucide:Sun', name: 'Sun / Lighting', category: 'Design & Art', type: 'lucide', iconComponent: Sun, keywords: ['sun', 'light', 'bright', 'day', 'warmth'] },
  { id: 'lucide:Droplet', name: 'Color Droplet', category: 'Design & Art', type: 'lucide', iconComponent: Droplet, keywords: ['droplet', 'water', 'color', 'picker'] },

  // --- PRODUCTIVITY & KNOWLEDGE ---
  { id: 'lucide:BookOpen', name: 'Open Book', category: 'Productivity & Docs', type: 'lucide', iconComponent: BookOpen, keywords: ['book', 'read', 'learn', 'knowledge', 'library', 'study'] },
  { id: 'lucide:Bookmark', name: 'Bookmark', category: 'Productivity & Docs', type: 'lucide', iconComponent: Bookmark, keywords: ['bookmark', 'save', 'favorite', 'read later'] },
  { id: 'lucide:FileText', name: 'Document / Notes', category: 'Productivity & Docs', type: 'lucide', iconComponent: FileText, keywords: ['doc', 'file', 'text', 'notes', 'article'] },
  { id: 'lucide:CheckSquare', name: 'Checklist', category: 'Productivity & Docs', type: 'lucide', iconComponent: CheckSquare, keywords: ['check', 'todo', 'task', 'done', 'list'] },
  { id: 'lucide:ListTodo', name: 'Todo List', category: 'Productivity & Docs', type: 'lucide', iconComponent: ListTodo, keywords: ['todo', 'tasks', 'items', 'list'] },
  { id: 'lucide:ClipboardList', name: 'Clipboard', category: 'Productivity & Docs', type: 'lucide', iconComponent: ClipboardList, keywords: ['clipboard', 'audit', 'plan', 'list'] },
  { id: 'lucide:Briefcase', name: 'Briefcase / Business', category: 'Productivity & Docs', type: 'lucide', iconComponent: Briefcase, keywords: ['briefcase', 'work', 'job', 'business', 'portfolio'] },
  { id: 'lucide:Calendar', name: 'Calendar / Schedule', category: 'Productivity & Docs', type: 'lucide', iconComponent: Calendar, keywords: ['calendar', 'date', 'schedule', 'event', 'plan'] },
  { id: 'lucide:Clock', name: 'Clock / Time', category: 'Productivity & Docs', type: 'lucide', iconComponent: Clock, keywords: ['clock', 'time', 'recent', 'history', 'timer'] },
  { id: 'lucide:Inbox', name: 'Inbox', category: 'Productivity & Docs', type: 'lucide', iconComponent: Inbox, keywords: ['inbox', 'incoming', 'messages', 'mail'] },
  { id: 'lucide:StickyNote', name: 'Sticky Note', category: 'Productivity & Docs', type: 'lucide', iconComponent: StickyNote, keywords: ['sticky', 'note', 'memo', 'reminder'] },
  { id: 'lucide:Archive', name: 'Archive / Vault', category: 'Productivity & Docs', type: 'lucide', iconComponent: Archive, keywords: ['archive', 'box', 'storage', 'backup'] },
  { id: 'lucide:Folder', name: 'Folder', category: 'Productivity & Docs', type: 'lucide', iconComponent: Folder, keywords: ['folder', 'directory', 'category', 'collection'] },
  { id: 'lucide:Presentation', name: 'Presentation / Pitch', category: 'Productivity & Docs', type: 'lucide', iconComponent: Presentation, keywords: ['presentation', 'slides', 'deck', 'pitch', 'keynote'] },
  { id: 'lucide:Lightbulb', name: 'Ideas & Innovation', category: 'Productivity & Docs', type: 'lucide', iconComponent: Lightbulb, keywords: ['lightbulb', 'idea', 'inspiration', 'creativity', 'brainstorm'] },
  { id: 'lucide:Target', name: 'Target & Goals', category: 'Productivity & Docs', type: 'lucide', iconComponent: Target, keywords: ['target', 'goals', 'okr', 'milestone', 'focus'] },

  // --- SOCIAL & COMMUNITY ---
  { id: 'lucide:Users', name: 'Community & Team', category: 'Social & Community', type: 'lucide', iconComponent: Users, keywords: ['users', 'people', 'team', 'community', 'group'] },
  { id: 'lucide:User', name: 'User / Profile', category: 'Social & Community', type: 'lucide', iconComponent: User, keywords: ['user', 'person', 'profile', 'account', 'author'] },
  { id: 'lucide:MessageSquare', name: 'Chat / Comments', category: 'Social & Community', type: 'lucide', iconComponent: MessageSquare, keywords: ['chat', 'message', 'comment', 'discussion'] },
  { id: 'lucide:Share2', name: 'Share', category: 'Social & Community', type: 'lucide', iconComponent: Share2, keywords: ['share', 'social', 'export', 'link'] },
  { id: 'lucide:Heart', name: 'Heart / Likes', category: 'Social & Community', type: 'lucide', iconComponent: Heart, keywords: ['heart', 'love', 'like', 'favorite'] },
  { id: 'lucide:Star', name: 'Star / Featured', category: 'Social & Community', type: 'lucide', iconComponent: Star, keywords: ['star', 'favorite', 'rating', 'badge', 'top'] },
  { id: 'lucide:ThumbsUp', name: 'Thumbs Up', category: 'Social & Community', type: 'lucide', iconComponent: ThumbsUp, keywords: ['like', 'thumbs', 'approve', 'upvote'] },
  { id: 'lucide:Award', name: 'Award / Trophy', category: 'Social & Community', type: 'lucide', iconComponent: Award, keywords: ['award', 'trophy', 'medal', 'achievement', 'badge'] },
  { id: 'lucide:Coffee', name: 'Coffee / Scratchpad', category: 'Social & Community', type: 'lucide', iconComponent: Coffee, keywords: ['coffee', 'cafe', 'break', 'chill', 'drink'] },
  { id: 'lucide:Gift', name: 'Gift / Rewards', category: 'Social & Community', type: 'lucide', iconComponent: Gift, keywords: ['gift', 'present', 'freebie', 'reward'] },

  // --- FINANCE & COMMERCE ---
  { id: 'lucide:DollarSign', name: 'Dollar / Finance', category: 'Finance & Growth', type: 'lucide', iconComponent: DollarSign, keywords: ['dollar', 'money', 'finance', 'cash', 'revenue'] },
  { id: 'lucide:TrendingUp', name: 'Growth / Analytics', category: 'Finance & Growth', type: 'lucide', iconComponent: TrendingUp, keywords: ['trending', 'growth', 'charts', 'analytics', 'scale'] },
  { id: 'lucide:BarChart2', name: 'Bar Chart', category: 'Finance & Growth', type: 'lucide', iconComponent: BarChart2, keywords: ['chart', 'bar', 'stats', 'data', 'metrics'] },
  { id: 'lucide:PieChart', name: 'Pie Chart', category: 'Finance & Growth', type: 'lucide', iconComponent: PieChart, keywords: ['pie', 'chart', 'analytics', 'breakdown'] },
  { id: 'lucide:CreditCard', name: 'Credit Card / Payments', category: 'Finance & Growth', type: 'lucide', iconComponent: CreditCard, keywords: ['card', 'payment', 'credit', 'billing'] },
  { id: 'lucide:ShoppingBag', name: 'Shopping / E-commerce', category: 'Finance & Growth', type: 'lucide', iconComponent: ShoppingBag, keywords: ['shop', 'store', 'cart', 'buy', 'product'] },
  { id: 'lucide:Wallet', name: 'Wallet / Crypto', category: 'Finance & Growth', type: 'lucide', iconComponent: Wallet, keywords: ['wallet', 'crypto', 'savings', 'account'] },
  { id: 'lucide:Coins', name: 'Coins / Tokens', category: 'Finance & Growth', type: 'lucide', iconComponent: Coins, keywords: ['coins', 'tokens', 'crypto', 'credits'] },

  // --- HARDWARE & DEVICES ---
  { id: 'lucide:Smartphone', name: 'Mobile / Phone', category: 'Hardware & Devices', type: 'lucide', iconComponent: Smartphone, keywords: ['mobile', 'phone', 'ios', 'android', 'app'] },
  { id: 'lucide:Laptop', name: 'Laptop / Computer', category: 'Hardware & Devices', type: 'lucide', iconComponent: Laptop, keywords: ['laptop', 'macbook', 'computer', 'device'] },
  { id: 'lucide:Monitor', name: 'Monitor / Desktop', category: 'Hardware & Devices', type: 'lucide', iconComponent: Monitor, keywords: ['monitor', 'screen', 'desktop', 'display'] },
  { id: 'lucide:Rocket', name: 'Rocket / Launch', category: 'Hardware & Devices', type: 'lucide', iconComponent: Rocket, keywords: ['rocket', 'launch', 'startup', 'fast', 'blast'] },
  { id: 'lucide:Atom', name: 'Science & Physics', category: 'Hardware & Devices', type: 'lucide', iconComponent: Atom, keywords: ['atom', 'science', 'research', 'physics', 'react'] },
  { id: 'lucide:Flag', name: 'Flag / Milestone', category: 'Hardware & Devices', type: 'lucide', iconComponent: Flag, keywords: ['flag', 'country', 'milestone', 'banner'] },
  { id: 'lucide:Wrench', name: 'Tools & Utilities', category: 'Hardware & Devices', type: 'lucide', iconComponent: Wrench, keywords: ['tool', 'wrench', 'settings', 'fix', 'utility'] },
];

export const ICON_CATEGORIES = [
  'All',
  'Brands & Logos',
  'Dev & Coding',
  'Media & Video',
  'Design & Art',
  'Productivity & Docs',
  'Social & Community',
  'Finance & Growth',
  'Hardware & Devices',
];
