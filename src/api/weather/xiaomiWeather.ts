import { getIPV4Addr, getIPV4AddrLocation } from "@/api";
import { Error } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import xmAdcodeData from '@/assets/data/xiaomi_weather_adcode.json';
import xmStatusData from '@/assets/data/xiaomi_weather_status.json';
import { mainStore } from "@/store";
import i18n from '@/locales';

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

// 获取小米天气 API
export const getXMWeather = async (city) => {
    const res = await fetch(`https://api.nanorocky.top/xmw/?city=weathercn%3A${city}`);
    return await res.json();
};

export async function getXMWT() {
    console.log(i18n.global.t('console.weather.xiaomiIntf'));
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
        throw i18n.global.t('console.weather.weatherError');
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
        throw i18n.global.t('console.weather.weatherError');
    };
    // 加载 Adcode
    weatherData.adCode = {
        city: location.data.county || location.data.city || location.data.region || i18n.global.t('console.weather.areaUnknown'),
        adcode: findCityAdcode(location.data.region, location.data.city, location.data.county),
    };
    if (weatherData.adCode.adcode == null) {
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("天气加载失败.mp3");
        };
        throw i18n.global.t('console.weather.weatherError');
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
        throw i18n.global.t('console.weather.weatherError');
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
    return weatherInfo ? weatherInfo.wea : i18n.global.t('console.weather.weaUnknown');
};

const windDegreeToDirection = (degree: number): string => {
    const directions: string[] = i18n.global.tm('components.weather.windDirections') as string[];
    const index = Math.round(degree / 45) % 8;
    return directions[index] + i18n.global.t('components.weather.wind');
};

export const BEAUFORT_SCALE = (): XMBeaufortLevel[] => {
    const scaleDesc: string[] = i18n.global.tm('components.weather.beaufortScale') as string[];
    return [
        { level: 0, minSpeed: 0, maxSpeed: 0.2, description: scaleDesc[0] },
        { level: 1, minSpeed: 0.3, maxSpeed: 1.5, description: scaleDesc[1] },
        { level: 2, minSpeed: 1.6, maxSpeed: 3.3, description: scaleDesc[2] },
        { level: 3, minSpeed: 3.4, maxSpeed: 5.4, description: scaleDesc[3] },
        { level: 4, minSpeed: 5.5, maxSpeed: 7.9, description: scaleDesc[4] },
        { level: 5, minSpeed: 8.0, maxSpeed: 10.7, description: scaleDesc[5] },
        { level: 6, minSpeed: 10.8, maxSpeed: 13.8, description: scaleDesc[6] },
        { level: 7, minSpeed: 13.9, maxSpeed: 17.1, description: scaleDesc[7] },
        { level: 8, minSpeed: 17.2, maxSpeed: 20.7, description: scaleDesc[8] },
        { level: 9, minSpeed: 20.8, maxSpeed: 24.4, description: scaleDesc[9] },
        { level: 10, minSpeed: 24.5, maxSpeed: 28.4, description: scaleDesc[10] },
        { level: 11, minSpeed: 28.5, maxSpeed: 32.6, description: scaleDesc[11] },
        { level: 12, minSpeed: 32.7, maxSpeed: Infinity, description: scaleDesc[12] }
    ];
};

export interface WindConversionOptions {
    returnRange?: boolean;
    includeDescription?: boolean;
};

export function convertWindSpeed(
    speed: number,
    options: WindConversionOptions = {}
): string {
    const { returnRange = false, includeDescription = false } = options;
    const level = BEAUFORT_SCALE().find(
        l => speed >= l.minSpeed && speed <= l.maxSpeed
    );
    if (!level) {
        return i18n.global.t('console.weather.windUnknown');
    };
    if (returnRange) {
        if (speed > level.minSpeed + (level.maxSpeed - level.minSpeed) * 0.7) {
            const nextLevel = BEAUFORT_SCALE().find(l => l.level === level.level + 1);
            if (nextLevel) {
                return includeDescription && nextLevel
                ? `${level.level}-${nextLevel.level}${i18n.global.t('components.weather.windPowerUnit')} (${level.description})`
                : `${level.level}-${nextLevel.level}${i18n.global.t('components.weather.windPowerUnit')}`;
            };
        };
    };
    return includeDescription 
        ? `${level.level}${i18n.global.t('components.weather.windPowerUnit')} (${level.description})`
        : `${level.level}${i18n.global.t('components.weather.windPowerUnit')}`;
};