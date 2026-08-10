import { loadJSONP } from "@/api/index";
import { gwgt } from "@/utils/authServer";
import { mainStore } from "@/store";
import { stopSpeech, SpeechLocal } from "@/utils/speech";
import i18n from "@/locales";
import type { AdCode, WeatherInfo, TXAdCodeResponse, TXWeatherResponse } from "@/typings/weather";

// 获取腾讯地理位置信息（JSONP 方式）
export const getTXAdcode = async (key) => {
  const callback = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const url = `https://apis.map.qq.com/ws/location/v1/ip?key=${key}&output=jsonp&callback=${callback}`;
  return await loadJSONP(url, callback);
};

// 获取腾讯地理天气信息（JSONP 方式）
export const getTXWeather = async (key, adcode) => {
  const callback = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const url = `https://apis.map.qq.com/ws/weather/v1/?key=${key}&adcode=${adcode}&type=now&output=jsonp&callback=${callback}`;
  return await loadJSONP(url, callback);
};

// 获取腾讯地理位置信息（鉴权模式 JSONP 方式）
export const getTXAdcodeS = async (key, skey) => {
  const callback = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const url = `https://apis.map.qq.com/ws/location/v1/ip?key=${key}&output=jsonp&callback=${callback}`;
  const urls = await gwgt(url, skey);
  return await loadJSONP(urls, callback);
};

// 获取腾讯地理天气信息（鉴权模式 JSONP 方式）
export const getTXWeatherS = async (key, adcode, skey) => {
  const callback = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const url = `https://apis.map.qq.com/ws/weather/v1/?key=${key}&adcode=${adcode}&type=now&output=jsonp&callback=${callback}`;
  const urls = await gwgt(url, skey);
  return await loadJSONP(urls, callback);
};

export const getTencentWeather = async () => {
    const store = mainStore();
    const t = i18n.global.t;
    const txkey = envConfig.VITE_TX_WEATHER_KEY;
    const txskey = envConfig.VITE_TX_WEATHER_SKEY;
    
    let adCodeResult: AdCode = { city: null, adcode: null };
    let weatherResult: WeatherInfo = { weather: null, temperature: null, winddirection: null, windpower: null };

    if (!txskey) {
        console.log(t("console.weather.weatherTencentLog1"));
        const adCode = (await getTXAdcode(txkey)) as TXAdCodeResponse;
        if (String(adCode.status) !== "0") {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("位置信息获取失败.mp3");
            };
            throw t("components.weather.failedToFetchLocation");
        };
        adCodeResult = {
            city: adCode.result.ad_info.district || adCode.result.ad_info.city || adCode.result.ad_info.province || t("components.weather.unknownRegion"),
            adcode: adCode.result.ad_info.adcode,
        };

        if (adCodeResult.adcode == null) {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };

        const txWeather = (await getTXWeather(txkey, adCodeResult.adcode)) as TXWeatherResponse;
        if (String(txWeather.status) !== "0") {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };
        
        const realtimeData = txWeather.result.realtime?.[0];
        if (!realtimeData?.infos) {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };
        
        weatherResult = {
            weather: realtimeData.infos.weather,
            temperature: realtimeData.infos.temperature,
            winddirection: realtimeData.infos.wind_direction,
            windpower: realtimeData.infos.wind_power,
        };
    } else {
        console.log(t("console.weather.weatherTencentLog2"));
        const adCode = (await getTXAdcodeS(txkey, txskey)) as TXAdCodeResponse;
        if (String(adCode?.status) !== "0") {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("位置信息获取失败.mp3");
            };
            throw t("components.weather.failedToFetchLocation");
        };
        adCodeResult = {
            city: adCode.result.ad_info.district || adCode.result.ad_info.city || adCode.result.ad_info.province || t("components.weather.unknownRegion"),
            adcode: adCode.result.ad_info.adcode,
        };

        if (adCodeResult.adcode == null) {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };

        const txWeather = (await getTXWeatherS(txkey, adCodeResult.adcode, txskey)) as TXWeatherResponse;
        if (String(txWeather.status) !== "0") {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };
        
        const realtimeData = txWeather.result.realtime?.[0];
        if (!realtimeData?.infos) {
            if (store.webSpeech) {
                stopSpeech();
                SpeechLocal("天气加载失败.mp3");
            };
            throw t("components.weather.failedToLoadWeather");
        };
        
        weatherResult = {
            weather: realtimeData.infos.weather,
            temperature: realtimeData.infos.temperature,
            winddirection: realtimeData.infos.wind_direction,
            windpower: realtimeData.infos.wind_power,
        };
    };

    return { adCode: adCodeResult, weather: weatherResult };
};
