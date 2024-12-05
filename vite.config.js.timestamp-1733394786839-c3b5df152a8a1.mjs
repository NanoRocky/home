// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/vite@5.4.11_sass@1.81.0_terser@5.36.0/node_modules/vite/dist/node/index.js";
import { ElementPlusResolver } from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/unplugin-vue-components@0.27.5_@babel+parser@7.26.2_@nuxt+kit@3.14.1592_rollup@2.79.2__rollup_4tgsokwl2sgft3wb4p4moma2xu/node_modules/unplugin-vue-components/dist/resolvers.js";
import { resolve } from "path";
import { VitePWA } from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/vite-plugin-pwa@0.20.5_vite@5.4.11_sass@1.81.0_terser@5.36.0__workbox-build@7.3.0_workbox-window@7.3.0/node_modules/vite-plugin-pwa/dist/index.js";
import vue from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/@vitejs+plugin-vue@5.2.1_vite@5.4.11_sass@1.81.0_terser@5.36.0__vue@3.5.13_typescript@5.6.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/unplugin-auto-import@0.18.6_@nuxt+kit@3.14.1592_rollup@2.79.2__@vueuse+core@11.2.0_vue@3.5.13_u4hs7yfdxsqzb3yponfysqf32q/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/unplugin-vue-components@0.27.5_@babel+parser@7.26.2_@nuxt+kit@3.14.1592_rollup@2.79.2__rollup_4tgsokwl2sgft3wb4p4moma2xu/node_modules/unplugin-vue-components/dist/vite.js";
import viteCompression from "file:///C:/Users/NanoRocky/MyWeb/home-dev-pro/public/node_modules/.pnpm/vite-plugin-compression@0.5.1_vite@5.4.11_sass@1.81.0_terser@5.36.0_/node_modules/vite-plugin-compression/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\NanoRocky\\MyWeb\\home-dev-pro\\github\\nanorocky\\home";
var vite_config_default = ({ mode }) => defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue"],
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/,
            // js / css 静态资源缓存
            handler: "CacheFirst",
            options: {
              cacheName: "js-css-cache"
            }
          },
          {
            urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/,
            // 图片缓存
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache"
            }
          }
        ]
      },
      manifest: {
        name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
        short_name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
        description: loadEnv(mode, process.cwd()).VITE_SITE_DES,
        display: "standalone",
        start_url: "/",
        theme_color: "#424242",
        background_color: "#424242",
        icons: [
          {
            src: "https://file.nanorocky.top/home/images/icon/48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/144.png",
            sizes: "144x144",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://file.nanorocky.top/home/images/icon/512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    }),
    viteCompression()
  ],
  server: {
    port: "3000",
    open: true
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__vite_injected_original_dirname, "src")
      }
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
        additionalData: `@use "./src/style/global.scss" as global;`
      }
    }
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        pure_funcs: ["console.log"]
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOYW5vUm9ja3lcXFxcTXlXZWJcXFxcaG9tZS1kZXYtcHJvXFxcXGdpdGh1YlxcXFxuYW5vcm9ja3lcXFxcaG9tZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTmFub1JvY2t5XFxcXE15V2ViXFxcXGhvbWUtZGV2LXByb1xcXFxnaXRodWJcXFxcbmFub3JvY2t5XFxcXGhvbWVcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL05hbm9Sb2NreS9NeVdlYi9ob21lLWRldi1wcm8vZ2l0aHViL25hbm9yb2NreS9ob21lL3ZpdGUuY29uZmlnLmpzXCI7LyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgRWxlbWVudFBsdXNSZXNvbHZlciB9IGZyb20gXCJ1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnNcIjtcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcbmltcG9ydCB2dWUgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiO1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tIFwidW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZVwiO1xyXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tIFwidW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZVwiO1xyXG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gXCJ2aXRlLXBsdWdpbi1jb21wcmVzc2lvblwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9KSA9PlxyXG4gIGRlZmluZUNvbmZpZyh7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHZ1ZSgpLFxyXG4gICAgICBBdXRvSW1wb3J0KHtcclxuICAgICAgICBpbXBvcnRzOiBbXCJ2dWVcIl0sXHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXSxcclxuICAgICAgfSksXHJcbiAgICAgIENvbXBvbmVudHMoe1xyXG4gICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXHJcbiAgICAgIH0pLFxyXG4gICAgICBWaXRlUFdBKHtcclxuICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxyXG4gICAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC8oLio/KVxcLihqc3xjc3N8d29mZjJ8d29mZnx0dGYpLywgLy8ganMgLyBjc3MgXHU5NzU5XHU2MDAxXHU4RDQ0XHU2RTkwXHU3RjEzXHU1QjU4XHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImpzLWNzcy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvKC4qPylcXC4ocG5nfGpwZT9nfHN2Z3xnaWZ8Ym1wfHBzZHx0aWZmfHRnYXxlcHMpLywgLy8gXHU1NkZFXHU3MjQ3XHU3RjEzXHU1QjU4XHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImltYWdlLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgICAgbmFtZTogbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKS5WSVRFX1NJVEVfTkFNRSxcclxuICAgICAgICAgIHNob3J0X25hbWU6IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSkuVklURV9TSVRFX05BTUUsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKS5WSVRFX1NJVEVfREVTLFxyXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXHJcbiAgICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxyXG4gICAgICAgICAgdGhlbWVfY29sb3I6IFwiIzQyNDI0MlwiLFxyXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjNDI0MjQyXCIsXHJcbiAgICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vNDgucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNDh4NDhcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vNzIucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNzJ4NzJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vOTYucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiOTZ4OTZcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vMTI4LnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjEyOHgxMjhcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vMTQ0LnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE0NHgxNDRcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vMTkyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImh0dHBzOi8vZmlsZS5uYW5vcm9ja3kudG9wL2hvbWUvaW1hZ2VzL2ljb24vNTEyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICAgdml0ZUNvbXByZXNzaW9uKCksXHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IFwiMzAwMFwiLFxyXG4gICAgICBvcGVuOiB0cnVlLFxyXG4gICAgfSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiBcIkBcIixcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiksXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGNoYXJzZXQ6IGZhbHNlLFxyXG4gICAgICAgICAgYWRkaXRpb25hbERhdGE6IGBAdXNlIFwiLi9zcmMvc3R5bGUvZ2xvYmFsLnNjc3NcIiBhcyBnbG9iYWw7YCxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG1pbmlmeTogXCJ0ZXJzZXJcIixcclxuICAgICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgICBwdXJlX2Z1bmNzOiBbXCJjb25zb2xlLmxvZ1wiXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYyxl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
