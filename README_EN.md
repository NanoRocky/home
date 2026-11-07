<div align="center">

# imsyy's Homepage (EFU)

**English** | [简体中文](./README.md)

<p>
  <a title="Vue" target="_blank" href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue"></a>
  <a title="Vite" target="_blank" href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite"></a>
  <a title="TypeScript" target="_blank" href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a title="Copyright" target="_blank" href="https://nanorocky.top/"><img src="https://img.shields.io/badge/Copyright%20%C2%A9%202023--2026-NanoRocky-red" alt="Copyright"></a>
</p>

</div>

---

> [!IMPORTANT]
> ### To Everyone
> - Hey! Glad you found your way here~ This is the **Extension Function Updates (EFU)** edition maintained by **NanoRocky**, based on the original homepage by [imsyy](https://github.com/imsyy/)! This edition adds word-by-word (verbatim) lyrics, multi-language internationalization, a quick search bar, local notes, seasonal ambient effects, and continuous dependency & security updates *(note: enabling verbatim lyrics and seasonal effects comes with moderately higher performance overhead)*.
> - As a Vue beginner driven by passion, NanoRocky teamed up with classmate [Pizero](https://github.com/pizeroLOL/) to refine this project—so the code may not be perfect and might still have undiscovered bugs. Bug reports, feedback, pointers, and PR contributions are always warmly welcome!
> - **Feedback & Support**: Please open a GitHub **Issue** for bug reports or start a GitHub **Discussion** for usage questions—we will reply once we see them. Except in special circumstances, **please do NOT DM NanoRocky directly via other social channels**! NanoRocky is not customer support, does not provide one-on-one after-sales service, and simply does not have the bandwidth to reply to private messages individually. Thank you for your understanding!
> - **Finally, if you enjoy this project, please light up the ⭐ Star in the top-right corner to show your support! Arigato~**

---

> [!WARNING]
> ### Browser Compatibility Warning
> - Visiting the site in `Xiaomi Browser` (Mi Browser) is known to cause severe frame drops, rendering glitches in the lyrics component, and even music loading failures; the exact cause is currently unknown.
> - Aside from `Xiaomi Browser`, everything works smoothly as tested in `Microsoft Edge` / `Google Chrome` / `Firefox` / `Samsung Browser` / `QQ Browser` / `Vivo Browser`.
> - This project is **not** compatible with `Internet Explorer`.

---

## 📸 Screenshots

![Screenshot 1](/screenshots/main.png)
![Screenshot 2](/screenshots/main1.png)
![Screenshot 3](/screenshots/main2.png)

## 👀 Live Demo

**Demo**:
- [NanoRocky's Homepage](https://nanorocky.top/) *(Note: NanoRocky's personal homepage runs the private branch configuration, so certain wallpapers and details differ slightly from the public edition—either private settings or upcoming improvements not yet pushed.)*
- [imsyy's Homepage by EFU](https://imhmpv.main.nanorocky.top/) *(This preview page stays automatically synced with the `EFU` branch at all times.)*
- [imsyy's Homepage](https://imsyy.top/) *(Original author's homepage; no longer serves as a reference for this edition.)*

> [!TIP]
> - Because Workbox (PWA) local caching is enabled, you may need to press `Ctrl + F5` to hard-refresh after a site update to see the latest changes immediately.

---

## 🎉 Features

- [x] **Smooth Loading Animations & Frosted-Glass Card UI**: Responsive adaptation across desktop and mobile devices
- [x] **Multi-Language Internationalization (i18n)**: Built-in **简体中文 / English / 日本語**, with automatic browser language detection and customizable English site/link translations
- [x] **Multiple Theme Modes**: System, Schedule (time-based), Adaptive (extracted automatically from wallpaper), Light, and Dark modes
- [x] **Seasonal Ambient Effects & Memorial Mourning Mode**: Built-in Winter Snow, Autumn Fireflies, and Spring Festival Lanterns effects
- [x] **Quick Search Bar (`Alt + Q`)**: Instant multi-engine search switching and direct URL navigation
- [x] **Local Multi-Tab Notes (`Alt + N`)**: Create multiple notes with automatic local persistence, JSON import/export, draggable resizing, and automatic footer lyric avoidance
- [x] **Clock & Time Capsule**: Real-time clock, Hitokoto quotes, day/week/month/year progress bars, and site uptime counter
- [x] **Multi-Provider Live Weather**: Supports Tencent Location Service, AMap (AutoNavi) Open Platform, Google Weather (international), and automatic fallback to keyless backup APIs
- [x] **Enhanced Music Player & Verbatim Lyrics**:
  - Dual-playlist merging (NetEase Cloud Music / QQ Music) and draggable footer progress bar
  - YRC / QRC word-by-word lyric parsing, enhanced animations, and interlude progress dots
  - **AMLL TTML Database** integration (with mirror acceleration) and cross-platform lyric matching
  - Synchronized translated lyrics, smart stripping of header/footer lyric metadata, and middle-double-click / long-press to restore original lyrics
- [x] **Web Voice Interaction**: Pre-generated local notification voice playback + real-time TTS song title announcements

### ⌨️ Common Shortcuts

| Action / Shortcut | Description |
| :--- | :--- |
| `Alt + Q` | Open / close quick search bar (`Esc` to close) |
| `Alt + N` | Open / close local Notes panel (`PgUp / PgDn` flips pages when music is paused) |
| `Middle-Click` (blank area) | Enter / exit wallpaper showcase preview mode |
| `Double Middle-Click` / `Mobile Long-Press` (footer lyrics) | Discard external-source lyrics and restore original lyrics |

---

## ⚙️ Deployment Guide

> [!TIP]
> - If your deployment environment does not need Workbox local caching (e.g., when CDN caching is already configured), or if visiting subpaths unexpectedly redirects back to the homepage, uncomment the following two lines in `vite.config.ts`:
>   ```ts
>   selfDestroying: true,
>   injectRegister: false,
>   ```

### 1. Configuration Files (Important)

The repository root includes a default configuration template `/.env` (do **not** delete it, or file-integrity protection will be triggered).  
When customizing your site, **make a copy of `/.env` named `/.env.local`**, and edit your custom settings inside `/.env.local`.

### 2. Local / Manual Build & Deployment

1. **Prerequisites** (see `engines` constraints in `package.json`):
   - [Git](https://git-scm.com/)
   - [Node.js](https://nodejs.org/en): `>= 24.22.2 < 25` or `>= 26.13.0`
   - `pnpm`: `>= 12.14.0`

2. **Clone, Install Dependencies & Build**:

```bash
# Clone only the EFU branch and enter the directory
git clone -b EFU --single-branch https://github.com/NanoRocky/home.git
cd home

# Enable and activate pnpm globally via Corepack
corepack enable
corepack prepare pnpm@latest --activate

# Create your local user config file and edit as needed
cp .env .env.local

# Install project dependencies
pnpm install

# Start local development preview
pnpm dev

# Build for production
pnpm build
```

> Once the build finishes, static assets will be generated in the **`dist`** directory. Upload all files inside `dist` to Nginx or any static web server.

### 3. Automated Build via GitHub Actions

If your local environment cannot run the build, you can use the built-in `GitHub Actions` workflow for automated packaging:

1. Click **Fork** in the top-right corner, navigate to the `Actions` tab of your forked repository, and enable workflows:
   ![Step 1](/screenshots/step1.jpg)
2. Commit your configuration changes to automatically trigger the build workflow. Once finished, download the generated static bundle archive at the bottom of the workflow summary page and upload it to your server:
   ![Step 2](/screenshots/step2.jpg)

### 4. Docker Deployment

The container listens on port `12445` by default (if you want custom settings included, prepare `.env.local` in the build context directory beforehand):

```bash
# Build image
docker build -t home .

# Start container
docker run -p 12445:12445 -d --name home home
```

### 5. One-Click Deployment (Vercel, etc.)

1. Click `Fork` in the top-right corner to copy this repository to your `GitHub` account.
2. Before importing and deploying, you can either add `.env.local` in your private repository (adjust `.gitignore` accordingly) or configure the required parameters directly in the platform's Environment Variables settings.
3. Import the repository into Vercel and click `Deploy` to finish deployment.

---

## 🛠️ Customization Guide

### Website Links (`siteLinks.json`)

Customize the right-panel navigation cards in `src/assets/siteLinks.json` (optionally provide `name_en` so titles automatically switch to English in non-Chinese locales):

```json
[
  {
    "icon": "Blog",
    "name": "博客",
    "name_en": "Blog",
    "link": "https://blog.your.domain/"
  }
]
```

To add more icons, pick them from [xicons](https://www.xicons.org/), import them on demand in `src/components/Links.vue`, and register them in `siteIcon`:

```ts
import Blog from "@vicons/fa/es/Blog.js";
import Cloud from "@vicons/fa/es/Cloud.js";

const siteIcon: Record<string, Component> = {
  Blog,
  Cloud,
  // Register newly imported icon components here
};
```

### Social Links (`socialLinks.json`)

Customize the bottom-left social icons, target URLs, and hover tooltips in `src/assets/socialLinks.json` (optional `name_en` and `tip_en` fields are also supported):

```json
[
  {
    "name": "Github",
    "name_en": "GitHub",
    "icon": "/images/icon/github.png",
    "tip": "去 Github 看看",
    "tip_en": "Visit my GitHub",
    "url": "https://github.com/imsyy"
  }
]
```

### Live Weather

Multiple weather data sources are supported. Registering a free `Web Service API Key` on one of the platforms below and setting it in `.env.local` is recommended:

- **Tencent Location Service (Recommended)**: Create an application in the [Tencent Location Service Console](https://lbs.qq.com/), enable WebServiceAPI, and set `VITE_TX_WEATHER_KEY` (supports both IPv4 and IPv6).
- **AMap (AutoNavi) Open Platform**: Create a `Web Service` key in the [AMap Console](https://console.amap.com/dev/index) and set `VITE_GD_WEATHER_KEY` *(Note: AMap's free IP geolocation endpoint does not currently support IPv6; on IPv6-preferred networks it will attempt to fall back to IPv4).*
- **Google Weather**: Designed for international visitors; set your key in `VITE_GOOGLE_WEATHER_KEY`.

> [!WARNING]
> **Registering and configuring your own weather API key is strongly recommended!**  
> When no key is configured, the app falls back to built-in keyless backup endpoints.<br>
> Because certain non-public endpoints do not support CORS, requests are routed through a relay proxy with strict rate limits and may experience throttling or downtime.<br>
> If you rely on the built-in relay endpoints long-term, please consider sponsoring NanoRocky to help share server costs!

### Music Player & Lyrics

Powered by `APlayer` and `Meting-API` for playlist parsing *(default music sources primarily target **Mainland China** network environments)*.<br>
Configure music parameters in `.env.local`:

```ini
# Song API endpoint (self-hosting Meting-API is strongly recommended)
VITE_SONG_API = "https://metingapi.nanorocky.top/"
# Music platform ( netease: NetEase Cloud Music, tencent: QQ Music )
VITE_SONG_SERVER = "netease"
VITE_SONG_SERVER_SECOND = "tencent"
# Playback type ( song, playlist, album, search, artist )
VITE_SONG_TYPE = "playlist"
# Resource ID (supports merging two playlists; leave empty if no secondary playlist or player is needed)
VITE_SONG_ID = "9379831714"
VITE_SONG_ID_SECOND = "9518088898"
```

> [!WARNING]
> - To enable **word-by-word (verbatim) lyrics** and **server-side lyric metadata rules**, please self-host the [Modified Meting-API](https://github.com/NanoRocky/meting-api/)!
> - The public API in the example enforces strict rate limits and is intended for demo purposes only—self-hosting is strongly recommended (or consider sponsoring NanoRocky to help cover server expenses, arigato!).
> - **Note**: Receiving a `401` or `418` response when requesting QQ Music via the public API is not a server outage; you must deploy the compiled frontend to a production domain served over `HTTPS` on standard port `443`.

### Wallpapers & Icons

#### 1. Local Default Wallpapers

Local wallpapers are stored under `public/images/` (named `background1.avif`, `background2.avif`... for desktop landscape, and `backgroundp1.avif`, `backgroundp2.avif`... for mobile portrait):

1. First edit the fallback counts in `src/components/Background.vue` (make sure the actual number of image files is not less than these values):
   ```ts
   let bgImageCount = 10; // Fallback desktop wallpaper count
   let bgImageCountP = 3; // Fallback mobile wallpaper count
   ```
2. Next edit `public/images/config.json`:
   ```json
   {
     "bgImageCount": 10,
     "bgImageCountP": 3
   }
   ```
   From then on, whenever you add or remove wallpaper images, simply update the counts in `public/images/config.json`—changes take effect on the fly without rebuilding the project!<br>
- Warning: Always make sure the actual number of wallpaper images is never lower than the built-in fallback count.

#### 2. Site Icons

Replace your site Favicon, Logo, Apple Touch Icon, and social platform icons inside `public/images/icon/`, or modify their paths in `.env.local`.

### Web Voice Interaction

- **Pre-generated Local Audio**: Stored under `public/speechlocal/` for fixed notification prompts with ultra-low latency. You can replace audio files of the same filename directly (pairing with CDN or browser caching is recommended).
- **Real-time TTS Audio**: Announces the artist and song title dynamically when switching tracks. Self-host a TTS service and fill its endpoint into `VITE_TTS_API` in `.env.local`. If you use Azure Speech Service, you can deploy [AzureSpeechAPI-by-PHP](https://github.com/NanoRocky/AzureSpeechAPI-by-PHP) directly.

### More Default Switches

Inside `storeState` in `src/store/index.ts`, all fields marked with `【开关】` can be customized as default settings, for example:

```ts
coverType: 0 as number,            // Default wallpaper category (0: Local Default, 1: Bing Daily, 2: Random Scenery, 3: Random Anime)
autoBGSwitchInterval: 2 as number, // Auto wallpaper switch interval (0: Off, 1: 15s, 2: 30s, 3: 45s)
seasonalEffects: true,             // Seasonal ambient effects
mourningMode: true,                // Memorial day grayscale mourning mode
playerAutoplay: true,              // Music autoplay
playerDWRCShow: true,              // Verbatim lyric parsing master switch
webSpeech: true,                   // Web voice interaction master switch
socialTipPosition: "right",        // Social link tooltip position ("right" | "down")
```

> Note: User preferences persisted in `localStorage` apply updated defaults only to **first-time** visitors. Clients that have previously visited the site must click **Reset All** in Settings, visit `?set=reset`, or clear browser site data for modified defaults to take effect immediately.

### Fonts

Uses an online subsetted web font solution (`MiSans` and `HarmonyOS Sans`), balancing clean typography with fast first-paint performance:

- `https://cdn-font.hyperos.mi.com/font/css?family=MiSans_VF:VF:Chinese_Simplify,Latin&display=swap`
- `https://s1.hdslb.com/bfs/static/jinkela/long/font/regular.css`

---

## 🧰 Tech Stack & Data Services

### Tech Stack

- [Vue 3](https://vuejs.org/) · [Vite](https://vite.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Pinia](https://pinia.vuejs.org/)
- [Element Plus](https://element-plus.org/) · [UnoCSS](https://unocss.dev/) · [Vue I18n](https://vue-i18n.intlify.dev/) · [Swiper](https://swiperjs.com/)
- [APlayer](https://aplayer.js.org/) · [AppleMusic-like Lyrics](https://github.com/Steve-xmh/applemusic-like-lyrics) · [IconPark](https://iconpark.oceanengine.com/official) · [xicons](https://xicons.org/)

### Related APIs & Services

- [Tencent Location Service](https://lbs.qq.com/) · [AMap Open Platform](https://lbs.amap.com/) · [Google Maps Platform](https://developers.google.com/maps/documentation/weather)
- [Oioweb API](https://api.oioweb.cn/) · [UAPIs](https://uapis.cn/) · [Moehu API](https://img.moehu.org/)
- [Hitokoto](https://hitokoto.cn/) · [Meting API](https://github.com/injahow/meting-api/) · [Meting API (NanoRocky Modified)](https://github.com/NanoRocky/meting-api/)

---

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=imsyy/home&type=Date)](https://star-history.com/#imsyy/home&Date)

## 💖 Special Thanks

- [AMLL TTML Database](https://github.com/Steve-xmh/amll-ttml-db)
- [Meting API](https://github.com/injahow/meting-api)

### Thanks to the Original Author & Everyone Who Helped!

- [imsyy](https://github.com/imsyy/) (Original Project Author)
- [Pizero](https://github.com/pizeroLOL/) (Partner in Crime)

---

<div align="center">
  <a title="CDN" target="_blank" href="https://www.cloudflare.com/"><img src="https://img.shields.io/badge/CDN-Cloudflare-blue" alt="Cloudflare"></a>&nbsp;
  <a title="CDN2" target="_blank" href="https://edgeone.ai/"><img src="https://img.shields.io/badge/CDN-Tencent%20EdgeOne-blue" alt="Tencent EdgeOne"></a>&nbsp;
  <a title="Copyright" target="_blank" href="https://nanorocky.top/"><img src="https://img.shields.io/badge/Copyright%20%C2%A9%202023--2026-NanoRocky-red" alt="Copyright"></a>
</div>
