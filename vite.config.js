/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue"],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        selfDestroying: true,
        injectRegister: false,
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /\/index\.html$/, // 针对主页面（index.html）
              handler: "NetworkFirst", // 优先从网络获取，如果失败则使用缓存
              options: {
                cacheName: "index-html-cache",
              },
            },
            {
              urlPattern: /(.*?)\.html$/, // 针对其他 HTML 页面
              handler: "NetworkOnly", // 强制从网络获取，不使用缓存
              options: {
                cacheName: "other-html-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(js|css)/, // js / css 静态资源缓存
              handler: "NetworkFirst",
              options: {
                cacheName: "js-css-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(woff2|woff|ttf)/, // 字体资源缓存
              handler: "CacheFirst",
              options: {
                cacheName: "ttf-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/, // 图片缓存
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
              },
            },
          ],
        },
        manifest: {
          name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          short_name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          description: loadEnv(mode, process.cwd()).VITE_SITE_DES,
          display: "standalone",
          start_url: "/index.html",
          theme_color: "#424242",
          background_color: "#424242",
          icons: [
            {
              src: "https://file.nanorocky.top/home/images/icon/48.png",
              sizes: "48x48",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "https://file.nanorocky.top/home/images/icon/512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      viteCompression(),
    ],
    server: {
      port: "3000",
      open: true,
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          charset: false,
          additionalData: `@use "@/style/global.scss" as global;`,
        },
      },
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          pure_funcs: ["console.log"],
        },
      },
    },
    publicPath:'/',
  });
