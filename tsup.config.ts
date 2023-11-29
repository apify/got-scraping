import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    external: [],
    noExternal: [],
    platform: 'node',
    format: ['esm'],
    target: 'es2021',
    skipNodeModulesBundle: true,
    clean: true,
    minify: false,
    terserOptions: {
        mangle: false,
        keep_classnames: true,
        keep_fnames: true,
    },
    splitting: false,
    keepNames: true,
    dts: true,
    sourcemap: true,
    treeshake: false,
    outDir: 'dist',
});
