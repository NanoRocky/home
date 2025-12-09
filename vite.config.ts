import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression2";
import UnoCSS from 'unocss/vite';
import type { UserConfig } from "vite";

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    return defineConfig({
        plugins: [
            vue(),
            UnoCSS(),
            AutoImport({
                imports: ["vue", { "@/utils/config_check.ts": ["envConfig"] }],
                resolvers: [ElementPlusResolver()],
                dts: "src/auto-imports.d.ts",
            }),
            Components({
                resolvers: [ElementPlusResolver()],
                dts: "src/components.d.ts",
            }),
            VitePWA({
                registerType: "autoUpdate",
                // 酪灰的小批注：如果遇到了子页面自动跳转主页等问题，或不需要客户端浏览器缓存，可尝试取消注释这两行代码，而不需要完全移除 PWA ~
                // selfDestroying: true,
                // injectRegister: false,
                workbox: {
                    skipWaiting: true,
                    clientsClaim: true,
                    runtimeCaching: [
                        {
                            urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/, // js / css 静态资源缓存
                            handler: "CacheFirst",
                            options: {
                                cacheName: "js-css-cache",
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
                    start_url: "/",
                    theme_color: "#424242",
                    background_color: "#424242",
                    icons: [
                        {
                            src: "/images/icon/48.png",
                            sizes: "48x48",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/72.png",
                            sizes: "72x72",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/96.png",
                            sizes: "96x96",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/128.png",
                            sizes: "128x128",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/144.png",
                            sizes: "144x144",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/192.png",
                            sizes: "192x192",
                            type: "image/png",
                        },
                        {
                            src: "/images/icon/512.png",
                            sizes: "512x512",
                            type: "image/png",
                        },
                    ],
                },
            }),
            viteCompression(),
        ],
        server: {
            port: 3000,
            open: true,
            proxy: {
                // 高德天气代理
                '/api-gd': {
                    target: 'https://restapi.amap.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api-gd/, ''),
                },
                // 腾讯天气代理
                '/api-tx': {
                    target: 'https://apis.map.qq.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api-tx/, ''),
                },
            }
        },
        resolve: {
            alias: [
                {
                    find: "@",
                    replacement: resolve(__dirname, "src")
                }
            ],
            extensions: [".ts", ".js", ".vue", ".json"],
        },
        css: {
            preprocessorOptions: {
                scss: {
                    charset: false,
                    additionalData: `@use "@/style/global.scss" as global;`,
                    silenceDeprecations: ["legacy-js-api"],
                },
            },
            postcss: {},
        },
        build: {
            minify: "terser",
            terserOptions: {
                compress: {
                    pure_funcs: ["console.debug"],
                },
            },
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        };
                        if (id.includes('xiaomi_weather_adcode.json') || id.includes('xiaomi_weather_status.json')) {
                            return 'xiaomi_weather_data';
                        };
                        if (id.includes('siteLinks.json') || id.includes('socialLinks.json')) {
                            return 'custom_data';
                        };
                    }
                }
            },
            chunkSizeWarningLimit: 1024,
        },
        publicDir: "public",
    });
};
