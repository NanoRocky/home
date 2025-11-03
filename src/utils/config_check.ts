import exampleConfig from '@/assets/example_config.json';
type Env = ImportMetaEnv;

export const envConfig: Env = {
    ...import.meta.env,
    BASE_URL: import.meta.env.BASE_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    SSR: import.meta.env.SSR,
    VITE_SITE_NAME: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_NAME || exampleConfig.VITE_SITE_NAME : exampleConfig.VITE_SITE_NAME,
    VITE_SITE_AUTHOR: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_AUTHOR || exampleConfig.VITE_SITE_AUTHOR : exampleConfig.VITE_SITE_AUTHOR,
    VITE_SITE_KEYWORDS: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_KEYWORDS || exampleConfig.VITE_SITE_KEYWORDS : exampleConfig.VITE_SITE_KEYWORDS,
    VITE_SITE_DES: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_DES || exampleConfig.VITE_SITE_DES : exampleConfig.VITE_SITE_DES,
    VITE_SITE_URL: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_URL || exampleConfig.VITE_SITE_URL : exampleConfig.VITE_SITE_URL,
    VITE_SITE_MAIN_NAME: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_MAIN_NAME || exampleConfig.VITE_SITE_MAIN_NAME : exampleConfig.VITE_SITE_MAIN_NAME,
    VITE_SITE_LOGO: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_LOGO || exampleConfig.VITE_SITE_LOGO : exampleConfig.VITE_SITE_LOGO,
    VITE_SITE_MAIN_LOGO: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_MAIN_LOGO || exampleConfig.VITE_SITE_MAIN_LOGO : exampleConfig.VITE_SITE_MAIN_LOGO,
    VITE_SITE_APPLE_LOGO: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_APPLE_LOGO || exampleConfig.VITE_SITE_APPLE_LOGO : exampleConfig.VITE_SITE_APPLE_LOGO,
    VITE_DESC_HELLO: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_DESC_HELLO || exampleConfig.VITE_DESC_HELLO : exampleConfig.VITE_DESC_HELLO,
    VITE_DESC_TEXT: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_DESC_TEXT || exampleConfig.VITE_DESC_TEXT : exampleConfig.VITE_DESC_TEXT,
    VITE_DESC_HELLO_OTHER: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_DESC_HELLO_OTHER || exampleConfig.VITE_DESC_HELLO_OTHER : exampleConfig.VITE_DESC_HELLO_OTHER,
    VITE_DESC_TEXT_OTHER: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_DESC_TEXT_OTHER || exampleConfig.VITE_DESC_TEXT_OTHER : exampleConfig.VITE_DESC_TEXT_OTHER,
    VITE_TX_WEATHER_KEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TX_WEATHER_KEY || exampleConfig.VITE_TX_WEATHER_KEY : exampleConfig.VITE_TX_WEATHER_KEY,
    VITE_GD_WEATHER_KEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_GD_WEATHER_KEY || exampleConfig.VITE_GD_WEATHER_KEY : exampleConfig.VITE_GD_WEATHER_KEY,
    VITE_SITE_START: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_START || exampleConfig.VITE_SITE_START : exampleConfig.VITE_SITE_START,
    VITE_SITE_ICP: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_ICP || exampleConfig.VITE_SITE_ICP : exampleConfig.VITE_SITE_ICP,
    VITE_SITE_MPS: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_MPS || exampleConfig.VITE_SITE_MPS : exampleConfig.VITE_SITE_MPS,
    VITE_SITE_MICP: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SITE_MICP || exampleConfig.VITE_SITE_MICP : exampleConfig.VITE_SITE_MICP,
    VITE_SONG_API: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SONG_API || exampleConfig.VITE_SONG_API : exampleConfig.VITE_SONG_API,
    VITE_SONG_SERVER: (import.meta.env.VITE_CONFIG_TURN == 'true'
        ? (import.meta.env.VITE_SONG_SERVER || exampleConfig.VITE_SONG_SERVER) : exampleConfig.VITE_SONG_SERVER) as "netease" | "tencent",
    VITE_SONG_SERVER_SECOND: (import.meta.env.VITE_CONFIG_TURN == 'true'
        ? (import.meta.env.VITE_SONG_SERVER_SECOND || exampleConfig.VITE_SONG_SERVER_SECOND) : exampleConfig.VITE_SONG_SERVER_SECOND) as "netease" | "tencent",
    VITE_SONG_TYPE: (import.meta.env.VITE_CONFIG_TURN == 'true'
        ? (import.meta.env.VITE_SONG_TYPE || exampleConfig.VITE_SONG_TYPE) : exampleConfig.VITE_SONG_TYPE) as "playlist" | "song",
    VITE_SONG_ID: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SONG_ID || exampleConfig.VITE_SONG_ID : exampleConfig.VITE_SONG_ID,
    VITE_SONG_ID_SECOND: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SONG_ID_SECOND || exampleConfig.VITE_SONG_ID_SECOND : exampleConfig.VITE_SONG_ID_SECOND,
    VITE_TTS_API: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TTS_API || exampleConfig.VITE_TTS_API : exampleConfig.VITE_TTS_API,
    VITE_TTS_Voice: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TTS_Voice || exampleConfig.VITE_TTS_Voice : exampleConfig.VITE_TTS_Voice,
    VITE_TTS_Style: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TTS_Style || exampleConfig.VITE_TTS_Style : exampleConfig.VITE_TTS_Style,
    VITE_TTS_SKEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TTS_SKEY || exampleConfig.VITE_TTS_SKEY : exampleConfig.VITE_TTS_SKEY,
    VITE_TX_WEATHER_SKEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_TX_WEATHER_SKEY || exampleConfig.VITE_TX_WEATHER_SKEY : exampleConfig.VITE_TX_WEATHER_SKEY,
    VITE_METING_SKEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_METING_SKEY || exampleConfig.VITE_METING_SKEY : exampleConfig.VITE_METING_SKEY,
    VITE_SFILE_SKEY: import.meta.env.VITE_CONFIG_TURN == 'true'
        ? import.meta.env.VITE_SFILE_SKEY || exampleConfig.VITE_SFILE_SKEY : exampleConfig.VITE_SFILE_SKEY,
}