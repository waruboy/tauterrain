export default {
  test: {
    environment: 'jsdom',
  },
  server: {
    open: true,
    port: 5200
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  }
};
