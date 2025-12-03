import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: false, // 你的应用目前是 CSR (Client Side Rendering)
    port: 3000, // 前后端共用一个端口
  },
  bff: {
    prefix: '/api', // 设置 API 前缀，这就对应了你之前的 http://localhost:3001/api
  },
  plugins: [
    appTools({
      bundler: 'rspack', // Set to 'webpack' to enable webpack
    }),
  ],
});
