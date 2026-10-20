import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import devServer from '@hono/vite-dev-server';
import bunAdapter from '@hono/vite-dev-server/bun';

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    command === 'serve' &&
      devServer({
        adapter: bunAdapter,
        entry: 'src/server/api.ts',
        exclude: [/^\/(?!(api|audio)\/).*$/],
      }),
    solidPlugin(),
  ].filter(Boolean) as any,
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  build: {
    target: 'esnext',
  },
}));
