import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({command}) => {
    const isBuild = command === 'build';
    return {
        // depending on your application, base can also be "/"
        base: '',
        plugins: [
            react(),
            viteTsconfigPaths(),
            nodePolyfills({
                include: ['buffer', 'process', 'util', 'stream', 'events', 'http', 'https', 'crypto', 'fs', 'path', 'os', 'url'],
                globals: {
                    Buffer: true,
                    global: true,
                    process: true,
                },
            }),
        ],
        server: {
            // this ensures that the browser opens upon server start
            open: true,
            // this sets a default port to 3000
            port: 3000,
        },
        define: {
            global: 'globalThis',
        },
        build: {
            outDir: 'build',
            target: 'esnext',
            commonjsOptions: {
                transformMixedEsModules: true,
                defaultIsModuleExports: true,
            },
        },
        resolve: {
            alias: {
                // dedupe @airgap/beacon-sdk
                // I almost have no idea why it needs `cjs` on dev and `esm` on build, but this is how it works
                '@airgap/beacon-sdk': path.resolve(__dirname, `./node_modules/@airgap/beacon-sdk/dist/${isBuild ? 'esm' : 'cjs'}/index.js`),
                '@taqueria/toolkit': path.resolve(__dirname, './node_modules/@taqueria/toolkit/index.js'),
                '@taqueria/node-sdk': path.resolve(__dirname, './node_modules/@taqueria/node-sdk/index.mjs'),
                // polyfills
                'readable-stream': 'vite-compatible-readable-stream',
                stream: 'vite-compatible-readable-stream'
            },
        },
    }
})

