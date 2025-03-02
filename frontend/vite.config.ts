import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({command}) => {
    if (command === 'serve') {
        // Development specific configuration
        return {
            plugins: [react()],
            server: {
                port: 3000,
                open: true,
                proxy: {
                    '/api': 'http://localhost:8000'
                }
            }
        }
    } else {
        // Build specific configuration
        return {
            plugins: [react()],
            build: {
                outDir: 'static/src/js', // Odoo expects assets in the static directory
                emptyOutDir: true, // Clean the output directory before building
                minify: process.env.NODE_ENV === 'production',
                rollupOptions: {
                    input: './src/main.tsx',
                    output: {
                        dir: path.resolve(__dirname, '../static/src/js'),
                        entryFileNames: 'package.js',
                        chunkFileNames: '[name].js',
                    }
                }
            },
            resolve: {
                extensions: ['.ts', '.js'], // Resolve TypeScript and JavaScript files
            },
        }
    }
})