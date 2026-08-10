import { mainStore } from "@/store";
import { stopSpeech, SpeechLocal } from "@/utils/speech";
import i18n from "@/locales";
import type { AdCode, WeatherInfo } from "@/typings/weather";

// 取出天气平均值
export const getTemperature = (min, max) => {
    const t = i18n.global.t;
    const store = mainStore();
    try {
        const cleanMin = parseFloat(min.toString().replace(/[^\d.-]/g, ""));
        const cleanMax = parseFloat(max.toString().replace(/[^\d.-]/g, ""));
        if (isNaN(cleanMin) || isNaN(cleanMax)) {
            throw new Error(t('components.weather.failedToParseTemp'));
        };
        const average = (cleanMin + cleanMax) / 2;
        return Math.round(average);
    } catch (error) {
        console.error(t('console.weather.calcTempError'), error);
        if (store.webSpeech) {
            stopSpeech();
            SpeechLocal("天气信息无法计算.mp3");
        };
        return "NaN";
    }
};

// 获取韩小韩天气 API
export const getHXHWeatherAPI = async () => {
    const res = await fetch("https://api.vvhan.com/api/weather");
    return await res.json();
};

// 获取教书先生天气 API
export const getOtherWeatherAPI = async () => {
    const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
    return await res.json();
};

export const getHxhWeather = async () => {
    const store = mainStore();
    const t = i18n.global.t;
    
    const result = await getHXHWeatherAPI();
    if (String(result?.success) !== "true") {
        if (store.webSpeech) {
            stopSpeech();
            SpeechLocal("天气加载失败.mp3");
        };
        throw t("components.weather.failedToLoadWeather");
    };

    const adCodeResult: AdCode = {
        city: result.city || t("components.weather.unknownRegion"),
        adcode: null
    };

    const weatherResult: WeatherInfo = {
        weather: result.data.type || result.data.night.type,
        temperature: getTemperature(result.data.low || result.data.night.low, result.data.high || result.data.night.high),
        winddirection: result.data.fengxiang || result.data.night.fengxiang,
        windpower: (!result.data.fengli || (result.data.fengli.trim() === t("components.weather.windPowerUnit") || result.data.fengli.trim() === "级")) ? result.data.night?.fengli || t("common.status.unknown") : result.data.fengli,
    };

    return { adCode: adCodeResult, weather: weatherResult };
};

export const getOiowebWeather = async () => {
    const t = i18n.global.t;
    
    const result = await getOtherWeatherAPI();
    const data = result.result;
    
    const adCodeResult: AdCode = {
        city: data.city.City || t("components.weather.unknownRegion"),
        adcode: null
    };

    const weatherResult: WeatherInfo = {
        weather: data.condition.day_weather,
        temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
        winddirection: data.condition.day_wind_direction,
        windpower: data.condition.day_wind_power,
    };

    return { adCode: adCodeResult, weather: weatherResult };
};
