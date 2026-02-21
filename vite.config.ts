import { defineConfig } from 'npm:vite@6';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  environments: {
    client: {
      resolve: {
        // Allow npm: specifiers (Deno-native) to be treated as externals
        // so Vite doesn't attempt to bundle them via CommonJS resolution.
        noExternal: false,
      },
    },
  },
});
