export interface AdCode {
    city: string | null;
    adcode: string | null;
}

export interface WeatherInfo {
    weather: string | null;
    temperature: string | number | null;
    winddirection: string | null;
    windpower: string | null;
}

export interface TXAdCodeResponse {
    status: string;
    result: {
        ad_info: {
            district?: string;
            city?: string;
            province?: string;
            adcode: string;
        };
    };
}

interface TXWeatherResponse {
    status: string;
    result: {
        realtime: Array<{
            infos: {
                weather: string;
                temperature: string;
                wind_direction: string;
                wind_power: string;
            };
        }>;
    };
}

export interface GDAdCodeResponse {
    status: string;
    infocode: string;
    city?: string;
    province?: string;
    adcode?: string;
}

export interface GDAdcodeIResponse {
    status: string;
    infocode: string;
    city?: string;
    province?: string;
    adcode?: string;
}

export interface GDWeatherResponse {
    status: string;
    infocode: string;
    lives: Array<{
        weather: string;
        temperature: string;
        winddirection: string;
        windpower: string;
    }>;
}