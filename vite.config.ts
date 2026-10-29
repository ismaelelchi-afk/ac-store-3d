import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona al servirse desde cualquier carpeta.
  base: './',
  // `host: true` permite abrir el servidor de desarrollo desde otro teléfono de la red.
  server: { host: true },
  build: { target: 'es2020' },
});
