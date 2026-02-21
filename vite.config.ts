import { defineConfig } from 'npm:vite@6';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  resolve: {
    alias: {
      // Map Deno-native npm: specifiers used by @fresh/core to their
      // bare npm package names so Vite/Rollup can resolve them.
      'npm:preact@^10.27.2': 'preact',
      'npm:preact': 'preact',
    },
  },
});
