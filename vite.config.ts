import { defineConfig } from 'npm:vite@^6';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
});
