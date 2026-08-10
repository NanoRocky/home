import { getIPV4Addr } from "@/api/index";
import { mainStore } from "@/store";
import { stopSpeech, SpeechLocal } from "@/utils/speech";
import i18n from "@/locales";
import type { AdCode, WeatherInfo, GDAdCodeResponse, GDAdcodeIResponse, GDWeatherResponse } from "@/typings/weather";

// 获取高德地理位置信息
export const getGDAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理位置信息（带IP）
export const getGDAdcodeI = async (ipv4, key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?ip=${ipv4}&key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getGDWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

export const getAmapWeather = async () => {
    const store = mainStore();
    const t = i18n.global.t;
    const gdkey = envConfig.VITE_GD_WEATHER_KEY;

    let adCodeResult: AdCode = { city: null, adcode: null };
    let weatherResult: WeatherInfo = { weather: null, temperature: null, winddirection: null, windpower: null };

    // 获取 Adcode
    const adCode = (await getGDAdcode(gdkey)) as GDAdCodeResponse;
    let adCodei: GDAdcodeIResponse | null = null;
    
    if (String(adCode?.infocode) !== "10000" || String(adCode?.status) !== "1") {
        console.log(t('console.weather.weatherAMapLog'));
        const ipV4addr = await getIPV4Addr();
        adCodei = (await getGDAdcodeI(ipV4addr.ip, gdkey)) as GDAdcodeIResponse;
        if (String(adCodei?.infocode) !== "10000" || String(adCodei?.status) !== "1") {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("位置信息获取失败.mp3");
            };
            throw t("components.weather.failedToFetchLocation");
        };
    };

    if (!adCodei) {
        adCodeResult = {
            city: adCode.city || adCode.province || t("components.weather.unknownRegion"),
            adcode: adCode.adcode || null,
        };
    } else {
        adCodeResult = {
            city: adCodei.city || adCodei.province || t("components.weather.unknownRegion"),
            adcode: adCodei.adcode || null,
        };
    };

    // 获取天气信息
    if (adCodeResult.adcode == null) {
        if (store.webSpeech) {
            stopSpeech();
            SpeechLocal("天气加载失败.mp3");
        };
        throw t("components.weather.failedToLoadWeather");
    };

    const result = (await getGDWeather(gdkey, adCodeResult.adcode)) as GDWeatherResponse;
    if (String(result?.status) !== "1" || String(result?.infocode) !== "10000") {
        if (store.webSpeech) {
            stopSpeech();
            SpeechLocal("天气加载失败.mp3");
        };
        throw t("components.weather.failedToLoadWeather");
    };

    weatherResult = {
        weather: result.lives[0].weather,
        temperature: result.lives[0].temperature,
        winddirection: result.lives[0].winddirection,
        windpower: result.lives[0].windpower,
    };

    return { adCode: adCodeResult, weather: weatherResult };
};
