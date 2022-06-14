import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    dts: false,
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    minify: false,
    skipNodeModulesBundle: true,
    sourcemap: true,
    target: 'es2021',
    tsconfig: './tsconfig.json',
    keepNames: true,
    esbuildOptions: (options, context) => {
        if (context.format === 'cjs') {
            options.banner = {
                js: '"use strict";',
            };
        }
    },
});
