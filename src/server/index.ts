import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { api } from './api';
import { existsSync } from 'node:fs';

const app = new Hono();

// Mount API routes
app.route('/api', api);

// Serve cached audio and static assets from public
app.use('/audio/*', serveStatic({ root: './public' }));
app.use('/fonts/*', serveStatic({ root: './public' }));

// If dist exists (production build), serve static files from dist
if (existsSync('./dist')) {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
} else {
  app.get('/', (c) => c.text('Abjad Literary Reader API Server running. Start Vite dev server for frontend.'));
}

const PORT = parseInt(process.env.PORT || '4000', 10);

console.log(`🚀 Abjad Literary Reader Hono Server running at http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
