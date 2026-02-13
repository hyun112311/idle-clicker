import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Use relative paths for flexible deployment (e.g. GitHub Pages)
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});
