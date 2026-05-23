import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 4000,
        open: true,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        },
    },
    build: {
        outDir: 'build',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks for better caching
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['react-bootstrap', 'framer-motion'],
                },
            },
        },
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'firebase'],
    },
});
