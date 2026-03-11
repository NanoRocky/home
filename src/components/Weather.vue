<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower?.endsWith("级")
      ? weatherData.weather.windpower
      : weatherData.weather.windpower + $t("weather.windPowerUnit") }}&nbsp;</span>
  </div>
  <div class="weather" v-else>
    <span>{{ $t("weather.console.weatherFetchFailed").replace("：", "") }}</span>
  </div>
</template>

<script setup lang="ts">
import { getTXAdcode, getTXWeather, getTXAdcodeS, getTXWeatherS, getGDAdcode, getGDAdcodeI, getGDWeather, getIPV4Addr, getIPV6Addr, getOtherWeather, getHXHWeather, getXMWeather, getIPV4AddrLocation } from "@/api";
import { getXMWT } from "@/utils/xiaomiWeather";
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

// 取出天气平均值
const getTemperature = (min, max) => {
  try {
    const cleanMin = parseFloat(min.toString().replace(/[^\d.-]/g, ""));
    const cleanMax = parseFloat(max.toString().replace(/[^\d.-]/g, ""));
    if (isNaN(cleanMin) || isNaN(cleanMax)) {
      throw new Error(t('weather.failedToParseTemp'));
    };
    const average = (cleanMin + cleanMax) / 2;
    return Math.round(average);
  } catch (error) {
    console.error(t('weather.console.calcTempError'), error);
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("天气信息无法计算.mp3");
    };
    return "NaN";
  }
};


const getTXW = async () => {
  if (!txskey) {
    console.log(t("weather.console.weatherTencentLog1"));
    // 获取 Adcode
    const adCode = (await getTXAdcode(txkey)) as TXAdCodeResponse;
    if (String(adCode.status) !== "0") {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("位置信息获取失败.mp3");
      };
      throw t("weather.failedToFetchLocation");
    };
    weatherData.adCode = {
      city: adCode.result.ad_info.district || adCode.result.ad_info.city || adCode.result.ad_info.province || t("weather.unknownRegion"),
      adcode: adCode.result.ad_info.adcode,
    };
    // 获取天气信息
    if (weatherData.adCode.adcode == null) {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    const txWeather = (await getTXWeather(txkey, weatherData.adCode.adcode)) as TXWeatherResponse;
    if (String(txWeather.status) !== "0") {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    const realtimeData = txWeather.result.realtime?.[0];
    if (!realtimeData?.infos) {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    weatherData.weather = {
      weather: realtimeData.infos.weather,
      temperature: realtimeData.infos.temperature,
      winddirection: realtimeData.infos.wind_direction,
      windpower: realtimeData.infos.wind_power,
    };
  } else {
    console.log(t("weather.console.weatherTencentLog2"));
    // 获取 Adcode
    const adCode = (await getTXAdcodeS(txkey, txskey)) as TXAdCodeResponse;
    if (String(adCode?.status) !== "0") {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("位置信息获取失败.mp3");
      };
      throw t("weather.failedToFetchLocation");
    };
    weatherData.adCode = {
      city: adCode.result.ad_info.district || adCode.result.ad_info.city || adCode.result.ad_info.province || t("weather.unknownRegion"),
      adcode: adCode.result.ad_info.adcode,
    };
    // 获取天气信息
    if (weatherData.adCode.adcode == null) {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    const txWeather = (await getTXWeatherS(txkey, weatherData.adCode.adcode, txskey)) as TXWeatherResponse;
    if (String(txWeather.status) !== "0") {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    const realtimeData = txWeather.result.realtime?.[0];
    if (!realtimeData?.infos) {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("天气加载失败.mp3");
      };
      throw t("weather.failedToLoadWeather");
    };
    weatherData.weather = {
      weather: realtimeData.infos.weather,
      temperature: realtimeData.infos.temperature,
      winddirection: realtimeData.infos.wind_direction,
      windpower: realtimeData.infos.wind_power,
    };
  };
};

const getGDW = async () => {
  // 获取 Adcode
  const adCode = (await getGDAdcode(gdkey)) as GDAdCodeResponse;
  let adCodei: GDAdcodeIResponse | null = null;
  if (String(adCode?.infocode) !== "10000" || String(adCode?.status) !== "1") {
    console.log(t('weather.console.weatherAMapLog'));
    const ipV4addr = await getIPV4Addr();
    adCodei = (await getGDAdcodeI(ipV4addr.ip, gdkey)) as GDAdcodeIResponse;
    if (String(adCodei?.infocode) !== "10000" || String(adCodei?.status) !== "1") {
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("位置信息获取失败.mp3");
      };
      throw t("weather.failedToFetchLocation");
    };
  };
  if (!adCodei) {
    weatherData.adCode = {
      city: adCode.city || adCode.province || t("weather.unknownRegion"),
      adcode: adCode.adcode || null,
    };
  } else {
    weatherData.adCode = {
      city: adCodei.city || adCodei.province || t("weather.unknownRegion"),
      adcode: adCodei.adcode || null,
    };
  };
  // 获取天气信息
  if (weatherData.adCode.adcode == null) {
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("天气加载失败.mp3");
    };
    throw t("weather.failedToLoadWeather");
  };
  const result = (await getGDWeather(gdkey, weatherData.adCode.adcode)) as GDWeatherResponse;
  if (String(result?.status) !== "1" || String(result?.infocode) !== "10000") {
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("天气加载失败.mp3");
    };
    throw t("weather.failedToLoadWeather");
  };
  weatherData.weather = {
    weather: result.lives[0].weather,
    temperature: result.lives[0].temperature,
    winddirection: result.lives[0].winddirection,
    windpower: result.lives[0].windpower,
  };
};

const getOW = async () => {
  const result = await getOtherWeather();
  const data = result.result;
  weatherData.adCode = {
    city: data.city.City || t("weather.unknownRegion"),
    adcode: null
  };
  weatherData.weather = {
    weather: data.condition.day_weather,
    temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
    winddirection: data.condition.day_wind_direction,
    windpower: data.condition.day_wind_power,
  };
};

const getHXHW = async () => {
  const result = await getHXHWeather();
  if (String(result?.success) !== "true") {
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("天气加载失败.mp3");
    };
    throw t("weather.failedToLoadWeather");
  };
  weatherData.adCode = {
    city: result.city || t("weather.unknownRegion"),
    adcode: null
  };
  weatherData.weather = {
    weather: result.data.type || result.data.night.type,
    temperature: getTemperature(result.data.low || result.data.night.low, result.data.high || result.data.night.high),
    winddirection: result.data.fengxiang || result.data.night.fengxiang,
    windpower: (!result.data.fengli || result.data.fengli.trim() === '级') ? result.data.night?.fengli || t("common.unknown") : result.data.fengli,
  };
};

const getXMW = async () => {
  const xmw = await getXMWT();
  if (!xmw) {
    throw t("weather.failedToLoadWeather");
  } else {
    weatherData.adCode = xmw.adCode;
    weatherData.weather = xmw.weather;
  };
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 获取地理位置信息
    if (!gdkey && !txkey) {
      console.log(t("weather.console.missingKeyUseBackup"));
      try {
        await getXMW();
      } catch (error) {
        try {
          await getHXHW();
        } catch (error) {
          await getOW();
        };
      };
    } else if (!txkey) {
      // 调用高德天气 API
      console.log(t("weather.console.useAMap"));
      try {
        await getGDW();
      } catch (error) {
        console.error(t("weather.console.aMapFailedUseBackup"));
        try {
          await getXMW();
        } catch (error) {
          try {
            await getHXHW();
          } catch (error) {
            await getOW();
          };
        };
      };
    } else {
      // 调用腾讯天气 API
      try {
        await getTXW();
      } catch (error) {
        console.error(t("weather.console.tencentFailedUseAMap"));
        try {
          await getGDW();
        } catch (error) {
          console.error(t("weather.console.aMapFailedUseBackup"));
          try {
            await getXMW();
          } catch (error) {
            try {
              await getHXHW();
            } catch (error) {
              await getOW();
            };
          };
        };
      };
    };
  } catch (error) {
    console.error(t("weather.console.weatherFetchFailed") + error);
    onError(t("weather.console.weatherFetchFailed").replace("：", ""));
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

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
