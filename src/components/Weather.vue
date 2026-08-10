<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith($t("components.weather.wind"))
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + $t("components.weather.wind")
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower?.endsWith($t("components.weather.windPowerUnit") || "级")
      ? weatherData.weather.windpower
      : weatherData.weather.windpower + $t("components.weather.windPowerUnit") }}&nbsp;</span>
  </div>
  <div class="weather" v-else>
    <span>{{ $t("console.weather.weatherFetchFailed").replace("：", "") }}</span>
  </div>
</template>

<script setup lang="ts">
import { getIPV4Addr, getIPV6Addr, getIPV4AddrLocation } from "@/api";
import { getTencentWeather } from "@/api/weather/tencentWeather";
import { getAmapWeather } from "@/api/weather/amapWeather";
import { getOiowebWeather } from "@/api/weather/otherWeather";
import { getXMWT } from "@/api/weather/xiaomiWeather";
import { getGoogleWeather } from "@/api/weather/googleWeather";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { useI18n } from "vue-i18n";

import type {
  AdCode,
  WeatherInfo,
  TXAdCodeResponse,
  TXWeatherResponse,
  GDAdCodeResponse,
  GDAdcodeIResponse,
  GDWeatherResponse,
  XMAdcodeItem,
  XMWeatherStatusItem,
  XMWeatherStatusData
} from "@/typings/weather";

const store = mainStore();
const { t } = useI18n();

// 加载密钥
const txkey = envConfig.VITE_TX_WEATHER_KEY; // 腾讯天气密钥
const txskey = envConfig.VITE_TX_WEATHER_SKEY; // 选择性对腾讯天气接口加密
const gdkey = envConfig.VITE_GD_WEATHER_KEY; // 高德天气密钥

// 天气数据
const weatherData = reactive<{
  adCode: AdCode;
  weather: WeatherInfo;
}>({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

const getTXW = async () => {
  const res = await getTencentWeather();
  weatherData.adCode = res.adCode;
  weatherData.weather = res.weather;
};

const getGDW = async () => {
  const res = await getAmapWeather();
  weatherData.adCode = res.adCode;
  weatherData.weather = res.weather;
};

const getOW = async () => {
  const res = await getOiowebWeather();
  weatherData.adCode = res.adCode;
  weatherData.weather = res.weather;
};

const getGLW = async () => {
  const res = await getGoogleWeather();
  weatherData.adCode = res.adCode;
  weatherData.weather = res.weather;
};

const getXMW = async () => {
  const res = await getXMWT();
  if (!res) {
    throw t("components.weather.failedToLoadWeather");
  } else {
    weatherData.adCode = res.adCode;
    weatherData.weather = res.weather;
  }
};

const ZHFallback = async () => {
  if (!gdkey && !txkey) {
    console.log(t("console.weather.missingKeyUseBackup"));
    try {
      await getXMW();
    } catch (error) {
      await getOW();
    };
  } else if (!txkey) {
    // 调用高德天气 API
    console.log(t("console.weather.useAMap"));
    try {
      await getGDW();
    } catch (error) {
      console.error(t("console.weather.aMapFailedUseBackup"));
      try {
        await getXMW();
      } catch (error) {
        await getOW();
      };
    };
  } else {
    // 调用腾讯天气 API
    try {
      await getTXW();
    } catch (error) {
      console.error(t("console.weather.tencentFailedUseAMap"));
      try {
        await getGDW();
      } catch (error) {
        console.error(t("console.weather.aMapFailedUseBackup"));
        try {
          await getXMW();
        } catch (error) {
          await getOW();
        };
      };
    };
  };
};

const executeAutoRouting = async () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isDomesticTZ = ["Asia/Shanghai", "Asia/Chongqing", "Asia/Urumqi", "Asia/Hong_Kong", "Asia/Macau"].includes(tz);
  const isChineseLang = navigator.language.toLowerCase().includes("zh");

  if (isDomesticTZ && isChineseLang) {
    await ZHFallback();
    return;
  }

  try {
    const traceController = new AbortController();
    const traceTimeout = setTimeout(() => traceController.abort(), 2000);
    const traceRes = await fetch("https://1.1.1.1/cdn-cgi/trace", { signal: traceController.signal });
    clearTimeout(traceTimeout);
    const traceText = await traceRes.text();
    const locMatch = traceText.match(/loc=([A-Z]+)/);
    if (locMatch && locMatch[1] === 'CN') {
      await ZHFallback();
    } else {
      await getGLW();
    }
  } catch (e) {
    await ZHFallback();
  }
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    const provider = store.weatherProvider;
    if (provider === 'tencent') {
      await getTXW();
    } else if (provider === 'amap') {
      await getGDW();
    } else if (provider === 'xiaomi') {
      await getXMW();
    } else if (provider === 'oioweb') {
      await getOW();
    } else if (provider === 'google') {
      await getGLW();
    } else {
      await executeAutoRouting();
    }
  } catch (error) {
    console.error(t("console.weather.weatherFetchFailed") + error);
    onError(t("console.weather.weatherFetchFailed").replace("：", ""));
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("天气加载失败.mp3");
    };
  };
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "var(--el-message-icon-color)",
    }),
  });
  console.error(message);
};

let weatherInterval: number | undefined;

onMounted(() => {
  getWeatherData();
  weatherInterval = setInterval(() => {
    getWeatherData();
  }, 7200000) as unknown as number;
});

onUnmounted(() => {
  if (weatherInterval) clearInterval(weatherInterval);
});

// 设置界面变更天气供应商，立即刷新天气
watch(() => store.weatherProvider, () => {
  getWeatherData();
});
</script>
