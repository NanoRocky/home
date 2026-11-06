import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { existsSync } from "fs";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression2";
import UnoCSS from 'unocss/vite';
import type { UserConfig } from "vite";
import postcssPresetEnv from 'postcss-preset-env';
import JavaScriptObfuscator from 'javascript-obfuscator';
import cssnano from 'cssnano';

const originalLog = console.log;
console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('[javascript-obfuscator]')) {
        return;
    }
    originalLog(...args);
};
// https://vitejs.dev/config/
export default ({ mode }: { mode: string }): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    const hasEnvFile = existsSync(resolve(import.meta.dirname, ".env"));
    const hasEnvLocal = existsSync(resolve(import.meta.dirname, ".env.local"));
    return defineConfig({
        define: {
            "import.meta.env.VITE_HAS_ENV_FILE": hasEnvFile,
            "import.meta.env.VITE_HAS_ENV_LOCAL": hasEnvLocal,
        },
        plugins: [
            vue(),
            UnoCSS(),
            AutoImport({
                imports: ["vue"],
                resolvers: [ElementPlusResolver()],
                dts: "src/typings/auto-imports.d.ts",
            }),
            Components({
                resolvers: [ElementPlusResolver()],
                dts: "src/typings/components.d.ts",
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
                    start_url: "/index.html",
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
            {
                name: 'custom-obfuscator',
                apply: 'build',
                enforce: 'post',
                renderChunk(code, chunk) {
                    const targetChunks = ['index'];
                    const isTarget = targetChunks.some((name) => chunk.name === name || chunk.fileName.includes(`${name}-`));
                    if (!isTarget) {
                        return null;
                    }
                    const result = JavaScriptObfuscator.obfuscate(code, {
                        compact: true,
                        controlFlowFlattening: true,
                        controlFlowFlatteningThreshold: 1,
                        debugProtection: false,
                        identifierNamesGenerator: 'hexadecimal',
                        ignoreImports: true,
                        numbersToExpressions: true,
                        renameGlobals: false,
                        renameProperties: false,
                        selfDefending: true,
                        simplify: true,
                        splitStrings: true,
                        splitStringsChunkLength: 5,
                        stringArray: true,
                        stringArrayCallsTransform: true,
                        stringArrayCallsTransformThreshold: 1,
                        stringArrayEncoding: ['base64', 'rc4'],
                        stringArrayIndexesType: ['hexadecimal-number'],
                        stringArrayIndexShift: true,
                        stringArrayRotate: true,
                        stringArrayShuffle: true,
                        stringArrayThreshold: 1,
                        stringArrayWrappersChainedCalls: true,
                        stringArrayWrappersCount: 5,
                        stringArrayWrappersParametersMaxCount: 5,
                        stringArrayWrappersType: 'function',
                        transformObjectKeys: false,
                    });
                    return {
                        code: result.getObfuscatedCode()
                    };
                }
            },
        ],
        server: {
            port: 3001,
            open: true,
        },
        resolve: {
            alias: [
                {
                    find: "@",
                    replacement: resolve(import.meta.dirname, "src")
                }
            ],
            extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".vue"],
        },
        css: {
            postcss: {
                plugins: [
                    postcssPresetEnv({
                        stage: 3,
                        features: { 'nesting-rules': true }
                    }),
                    cssnano()
                ]
            },
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
                    pure_funcs: ["console.debug"],
                },
            },
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('element-plus')) {
                                return 'vendor_element-plus';
                            };
                            if (id.includes('swiper')) {
                                return 'vendor_swiper';
                            };
                            return 'vendor';
                        };
                        if (/src[/\\]locales/.test(id)) {
                            return 'locale';
                        };
                        if (/src[/\\]assets/.test(id)) {
                            return 'assets';
                        };
                        if (
                            /src[/\\]components[/\\](DwrcDot|Footer|Music|Player|ProgressBar)\.vue/.test(id) ||
                            /src[/\\]utils[/\\](checkPilferDWRC|decodeDWQYRC|removeLyricMetadata|translationLyric)\.ts/.test(id)
                        ) {
                            return 'player';
                        };
                        if (
                            /src[/\\]components[/\\]Background\.vue/.test(id) ||
                            /src[/\\]utils[/\\](season|cursor|debounce|getColor)/.test(id)
                        ) {
                            return 'style';
                        };
                        if (/src[/\\]components[/\\](SearchInput|Notes)\.vue/.test(id)) {
                            return 'appx';
                        };
                        if (
                            /src[/\\]components[/\\]Weather\.vue/.test(id) ||
                            /src[/\\]api[/\\]weather/.test(id)
                        ) {
                            return 'weather';
                        };
                    }
                }
            },
            chunkSizeWarningLimit: 1024,
        },
        publicDir: "public",
    });
};