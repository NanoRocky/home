import {
  getGoogleGeolocationAPI,
  getGoogleCityNameAPI,
  getGoogleWeatherFetchAPI,
  getGoogleGeolocationAPIS,
} from "@/api/index";
import { mainStore } from "@/store";
import { stopSpeech, SpeechLocal } from "@/utils/speech";
import i18n from "@/locales";
import type { AdCode, WeatherInfo } from "@/typings/weather";

// 获取 Google 定位坐标 (根据请求 IP 自动解析)
const getGoogleGeolocation = async (key: string) => {
  const res = await getGoogleGeolocationAPIS(key);
  if (!res.ok) {
    throw new Error(`Google Geolocation API Error: ${res.status}`);
  }
  return await res.json();
};

// 获取 Google 逆地理编码 (将坐标转换为城市名称)
const getGoogleCityName = async (lat: number, lng: number, key: string, languageCode: string) => {
  const res = await getGoogleCityNameAPI(lat, lng, key, languageCode);
  const data = await res.json();

  if (
    !res.ok ||
    data.error ||
    (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS")
  ) {
    throw new Error(
      `Google Geocoding API Error: ${data.error?.message || data.status || res.status}`,
    );
  }

  const results = data.destinations || data.results || [data];
  if (results && results.length > 0) {
    if (results[0].primary) {
      const primary = results[0].primary;
      return primary.displayName?.text || primary.formattedAddress?.split(",")[0];
    }
    const components = results[0].addressComponents || results[0].address_components;
    if (components) {
      let city = "";
      let adminArea = "";
      for (const comp of components) {
        if (comp.types.includes("locality")) {
          city = comp.longName || comp.longText || comp.long_name;
        }
        if (comp.types.includes("administrative_area_level_2")) {
          adminArea = comp.longName || comp.longText || comp.long_name;
        }
      }
      return (
        city ||
        adminArea ||
        results[0].formattedAddress ||
        results[0].formatted_address?.split(",")[0]
      );
    }
  }
  return null;
};

// 获取 Google 天气数据
const getGoogleWeatherAPI = async (lat: number, lng: number, key: string, languageCode: string) => {
  const res = await getGoogleWeatherFetchAPI(lat, lng, key, languageCode);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Google Weather API Error: ${data.error?.message || data.error?.status || res.status}`,
    );
  }
  return data;
};

// Google 气象代码映射到本项目的通用天气描述符
const mapGoogleWeatherCode = (code: string | number, t: any): string => {
  if (typeof code !== "string") return t("console.weather.weaUnknown");

  const key = `components.weather.googleConditions.${code.toUpperCase()}`;
  const mapped = t(key);
  return mapped !== key ? mapped : code;
};

// 风向映射
const mapWindDirection = (cardinal: string, t: any) => {
  if (!cardinal) return t("common.status.unknown");
  const key = `components.weather.googleWindDirections.${cardinal.toUpperCase()}`;
  const mapped = t(key);
  return mapped !== key ? mapped : cardinal;
};

// 风速转风力等级 (Beaufort scale)
const kmhToBeaufort = (kmh: number): number => {
  if (kmh < 2) return 0;
  if (kmh < 6) return 1;
  if (kmh < 12) return 2;
  if (kmh < 20) return 3;
  if (kmh < 29) return 4;
  if (kmh < 39) return 5;
  if (kmh < 50) return 6;
  if (kmh < 62) return 7;
  if (kmh < 75) return 8;
  if (kmh < 89) return 9;
  if (kmh < 103) return 10;
  if (kmh < 118) return 11;
  return 12;
};

export const getGoogleWeather = async () => {
  const store = mainStore();
  const t = i18n.global.t;
  const googleKey = envConfig.VITE_GOOGLE_WEATHER_KEY;

  if (!googleKey) {
    console.error(t("console.weather.googleKeyMissing"));
    if (store.webSpeech) {
      stopSpeech();
      SpeechLocal("天气加载失败.mp3");
    }
    throw t("components.weather.failedToLoadWeather");
  }

  let adCodeResult: AdCode = { city: null, adcode: null };
  let weatherResult: WeatherInfo = {
    weather: null,
    temperature: null,
    winddirection: null,
    windpower: null,
  };

  try {
    console.log(t("console.weather.googleGeolocationStart"));
    const geoData = await getGoogleGeolocation(googleKey);
    const { lat, lng } = geoData.location;
    const currentLang = store.language === "auto" ? navigator.language : store.language;
    let cityName = t("components.weather.internationalRegion");
    try {
      const geocodeCity = await getGoogleCityName(lat, lng, googleKey, currentLang);
      if (geocodeCity) cityName = geocodeCity;
    } catch (e: any) {
      console.warn("Geocoding failed, using fallback name", e);
    }

    adCodeResult = {
      city: cityName,
      adcode: null,
    };

    console.log(t("console.weather.googleWeatherStart"));
    const weatherData = await getGoogleWeatherAPI(lat, lng, googleKey, currentLang);
    const current = weatherData;

    weatherResult = {
      weather:
        current.weatherCondition?.description?.text ||
        mapGoogleWeatherCode(current.weatherCondition?.type, t),
      temperature: Math.round(current.temperature?.degrees || 0),
      winddirection: current.wind?.direction?.cardinal
        ? mapWindDirection(current.wind.direction.cardinal, t)
        : t("common.status.unknown"),
      windpower:
        current.wind?.speed?.value != null
          ? `${kmhToBeaufort(current.wind.speed.value)}`
          : t("common.status.unknown"),
    };
  } catch (error) {
    console.error("Google API failed: ", error);
    if (store.webSpeech) {
      stopSpeech();
      SpeechLocal("天气加载失败.mp3");
    }
    throw t("components.weather.failedToLoadWeather");
  }

  return { adCode: adCodeResult, weather: weatherResult };
};
