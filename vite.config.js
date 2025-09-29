import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        strictPort: true,
        proxy: {
            '/ollama': {
                target: 'http://127.0.0.1:11434',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/ollama/, ''); }
            }
        }
    }
});
