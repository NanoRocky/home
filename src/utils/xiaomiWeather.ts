import { getTXAdcode, getTXWeather, getTXAdcodeS, getTXWeatherS, getGDAdcode, getGDAdcodeI, getGDWeather, getIPV4Addr, getIPV6Addr, getOtherWeather, getHXHWeather, getXMWeather, getIPV4AddrLocation } from "@/api";
import { Error } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import xmAdcodeData from '@/assets/data/xiaomi_weather_adcode.json';
import xmStatusData from '@/assets/data/xiaomi_weather_status.json';
import { mainStore } from "@/store";

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
    XMWeatherStatusData,
    XMBeaufortLevel
} from "@/typings/weather";

const xmAdcodeDataTyped = xmAdcodeData as XMAdcodeItem[];
const xmStatusDataTyped = xmStatusData as XMWeatherStatusData;

const weatherData = reactive<{
    adCode: AdCode;
    weather: WeatherInfo;
}>({
    adCode: {
        city: null,
        adcode: null,
    },
    weather: {
        weather: null,
        temperature: null,
        winddirection: null,
        windpower: null,
    },
});

export async function getXMWT() {
    console.log("正在使用小米天气接口");
    const store = mainStore();
    // 获取 IP
    const ipv4addr = await getIPV4Addr();
    if (ipv4addr.ip == null || !ipv4addr) {
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("位置信息获取失败.mp3");
        };
        throw "天气信息获取失败";
    };
    // 获取位置信息
    const location = await getIPV4AddrLocation(ipv4addr.ip);
    if (String(location?.code) !== "0" || !location?.data.region || !location?.data.city) {
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("位置信息获取失败.mp3");
        };
        throw "天气信息获取失败";
    };
    // 加载 Adcode
    weatherData.adCode = {
        city: location.data.county || location.data.city || location.data.region || "未知地区",
        adcode: findCityAdcode(location.data.region, location.data.city, location.data.county),
    };
    if (weatherData.adCode.adcode == null) {
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("天气加载失败.mp3");
        };
        throw "天气信息获取失败";
    };
    // 获取天气信息
    const xmWeather = await getXMWeather(weatherData.adCode.adcode);
    try {
        const currentWeather = xmWeather.current;
        const weatherCode = parseInt(currentWeather.weather);
        const temperature = currentWeather.temperature.value;
        const windDirection = windDegreeToDirection(parseFloat(currentWeather.wind.direction.value));
        const windPower = currentWeather.wind.speed.value + currentWeather.wind.speed.unit;
        const weatherDescription = getWeatherDescription(weatherCode);
        weatherData.weather = {
            weather: weatherDescription,
            temperature: temperature,
            winddirection: windDirection,
            windpower: convertWindSpeed(currentWeather.wind.speed.value, { returnRange: true, includeDescription: false }),
        };
        return weatherData;
    } catch (e) {
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("天气加载失败.mp3");
        };
        throw "天气信息获取失败";
    };
};

const findCityAdcode = (region: string, city: string, county: string): string | null => {
    if (county) {
        const fullCountyName = `${city}.${county}`;
        const countyMatch = xmAdcodeDataTyped.filter(item => item.name === fullCountyName);
        if (countyMatch.length === 1) {
            return countyMatch[0].city_num;
        };
    };
    const cityMatch = xmAdcodeDataTyped.filter(item => item.name === city);
    if (cityMatch.length === 1) {
        return cityMatch[0].city_num;
    };
    const regionCityMatch = xmAdcodeDataTyped.filter(item => item.name === `${region}.${city}`);
    if (regionCityMatch.length === 1) {
        return regionCityMatch[0].city_num;
    };
    const regionMatch = xmAdcodeDataTyped.filter(item => item.name === region);
    if (regionMatch.length === 1) {
        return regionMatch[0].city_num;
    };
    return null;
};

const getWeatherDescription = (weatherCode: number): string => {
    const weatherInfo = xmStatusDataTyped.weatherinfo.find(item => item.code === weatherCode);
    return weatherInfo ? weatherInfo.wea : "未知天气";
};

const windDegreeToDirection = (degree: number): string => {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(degree / 45) % 8;
    return directions[index] + '风';
};

export const BEAUFORT_SCALE: XMBeaufortLevel[] = [
    { level: 0, minSpeed: 0, maxSpeed: 0.2, description: "无风" },
    { level: 1, minSpeed: 0.3, maxSpeed: 1.5, description: "软风" },
    { level: 2, minSpeed: 1.6, maxSpeed: 3.3, description: "轻风" },
    { level: 3, minSpeed: 3.4, maxSpeed: 5.4, description: "微风" },
    { level: 4, minSpeed: 5.5, maxSpeed: 7.9, description: "和风" },
    { level: 5, minSpeed: 8.0, maxSpeed: 10.7, description: "清风" },
    { level: 6, minSpeed: 10.8, maxSpeed: 13.8, description: "强风" },
    { level: 7, minSpeed: 13.9, maxSpeed: 17.1, description: "疾风" },
    { level: 8, minSpeed: 17.2, maxSpeed: 20.7, description: "大风" },
    { level: 9, minSpeed: 20.8, maxSpeed: 24.4, description: "烈风" },
    { level: 10, minSpeed: 24.5, maxSpeed: 28.4, description: "狂风" },
    { level: 11, minSpeed: 28.5, maxSpeed: 32.6, description: "暴风" },
    { level: 12, minSpeed: 32.7, maxSpeed: Infinity, description: "飓风" }
];

export interface WindConversionOptions {
    returnRange?: boolean;
    includeDescription?: boolean;
};

export function convertWindSpeed(
    speed: number,
    options: WindConversionOptions = {}
): string {
    const { returnRange = false, includeDescription = false } = options;
    const level = BEAUFORT_SCALE.find(
        l => speed >= l.minSpeed && speed <= l.maxSpeed
    );
    if (!level) {
        return "未知风级";
    };
    if (returnRange) {
        if (speed > level.minSpeed + (level.maxSpeed - level.minSpeed) * 0.7) {
            const nextLevel = BEAUFORT_SCALE.find(l => l.level === level.level + 1);
            if (nextLevel) {
                return includeDescription
                    ? `${level.level}-${nextLevel.level}级 (${level.description})`
                    : `${level.level}-${nextLevel.level}级`;
            };
        };
    };
    return includeDescription
        ? `${level.level}级 (${level.description})`
        : `${level.level}级`;
};