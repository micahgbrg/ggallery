import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
// Optional: import viteCompression from 'vite-plugin-compression'

function serveOptimizedGlb() {
  return {
    name: 'serve-optimized-glb',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.split('?')[0].endsWith('.glb')) {
          const urlPath = req.url.split('?')[0].replace(/^\//, '');
          const optimizedPath = path.resolve('.cache/optimized/gallery', urlPath);
          if (fs.existsSync(optimizedPath)) {
            console.log(`\n[Vite] Serving optimized model: ${urlPath}`);
            const content = fs.readFileSync(optimizedPath);
            res.setHeader('Content-Type', 'model/gltf-binary');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(content);
            return;
          }
        }
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/react') || id.includes('node_modules/@react-three')) {
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    serveOptimizedGlb(),
    viteStaticCopy({
      targets: [
        {
          src: '.cache/optimized/gallery/sculptures/*',
          dest: 'sculptures'
        },
        {
          src: 'gallery/sculptures/*',
          dest: 'sculptures',
          overwrite: false
        },
        {
          src: 'gallery/media/*',
          dest: 'media'
        }
      ]
    }),
    // viteCompression({ algorithm: 'gzip', algorithm: 'brotliCompress' }) // Optional: add vite-plugin-compression for gzip/brotli precompression
  ],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
})
