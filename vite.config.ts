import { defineConfig } from 'npm:vite@7';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
});
