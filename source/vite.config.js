import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base:'/modu50m/',
  publicDir:false,
  plugins:[react()],
  define:{'import.meta.env.VITE_PUBLIC_PREVIEW':'"true"'},
  build:{outDir:'../.pages-build',emptyOutDir:true},
});
