// import axios from "axios";
import fetchJsonp from "fetch-jsonp";
import { gwgt } from "@/utils/authServer";

/**
 * JSONP 请求模块
 */
// JSONP 请求函数，并返回 JSON 【关于为什么要有这个呢...请腾讯自觉扫一下（x）】
const loadJSONP = (url, callbackName) => {
  return new Promise((resolve, reject) => {
    // 定义 JSONP 回调函数
    (window as any)[callbackName] = (data: any) => {
      resolve(data); // 解析 JSON 数据
      delete (window as any)[callbackName]; // 清理全局变量，防止污染
    };
    // 创建 script 标签
    const script = document.createElement('script');
    script.src = url;
    script.onerror = () => {
      reject(new Error('JSONP 请求失败'));
      delete (window as any)[callbackName]; // 出错时也要清理
    };
    document.body.appendChild(script);
  });
};

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id, serverse, idse, playerTrLrc) => {
  let dataf: any[] = [], data3: any[] = [], data1: any[] = [], data2: any[] = [];
  if (serverse != null && idse != null) {
    try {
      const res1 = await fetch(
        `${envConfig.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
      );
      data1 = await res1.json();
    } catch (e) {
      data1 = [];
      console.error("音乐源 1 请求失败:", e);
    };
    try {
      const res2 = await fetch(
        `${envConfig.VITE_SONG_API}?server=${serverse}&type=${type}&id=${idse}`,
      );
      data2 = await res2.json();
    } catch (e) {
      data2 = [];
      console.error("音乐源 2 请求失败:", e);
    };
    dataf = [...data2 || [], ...data1 || []];
  } else {
    try {
      const res1 = await fetch(
        `${envConfig.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
      );
      data3 = await res1.json();
    } catch (e) {
      data3 = [];
      console.error("音乐源 1 请求失败:", e);
    };
    dataf = [...data3 || []];
  };
  const data = dataf;
  if (data.length > 0 && data[0]?.url?.startsWith("@")) {
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const sipList = jsonpData.req_0?.data?.sip || [];
    const domain = (sipList.find((i: string) => !i.startsWith("http://ws")) || sipList[0] || "").replace("http://", "https://");
    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      album: v.album || envConfig.VITE_SITE_NAME,
      url: domain + (jsonpData.req_0?.data?.midurlinfo[i]?.purl || ""),
      cover: v.cover || v.pic,
      lrc: playerTrLrc && v.lrc ? `${v.lrc}${v.lrc.includes("?") ? "&" : "?"}trlrc=true` : v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      album: v.album || envConfig.VITE_SITE_NAME,   // 没办法，Netease 的 SONG 接口压根不返回专辑名，搜索接口倒是有...
      url: v.url,
      cover: v.cover || v.pic,
      lrc: playerTrLrc && v.lrc ? `${v.lrc}${v.lrc.includes("?") ? "&" : "?"}trlrc=true` : v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */
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
  const res = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`);
  return await res.json();
};

// 补充的获取 IPV4 地址的 API
export const getIPV4Addr = async () => {
  const res = await fetch(`https://v4.yinghualuo.cn/bejson?format=json`);
  return await res.json();
};

// 补充的获取 IPV6 地址的 API
export const getIPV6Addr = async () => {
  const res = await fetch(`https://v6.yinghualuo.cn/bejson?format=json`);
  return await res.json();
};

// 免 KEY 区域
// 强烈建议自己注册腾讯或高德的 API
// 获取韩小韩天气 API
export const getHXHWeather = async () => {
  const res = await fetch("https://api.vvhan.com/api/weather");
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  return await res.json();
};

// ------
// 由于这些非公开接口没有 CORS 不允许跨域，必须使用中转。如果您希望使用这个接口，记得捐赠酪灰，帮助其承担服务器费用！
// 这些接口有着较为严格的速率限制，所以有时会出现不可用的问题。如果追求稳定性，请务必自行申请腾讯或高德的 KEY 使用他们的专业服务！

// 获取小米天气 API
export const getXMWeather = async (city) => {
  // const res = await fetch(`https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=0&longitude=0&isLocated=true&locationKey=weathercn%3A${city}&days=2&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&locale=zh_cn&alpha=false&isGlobal=false`);
  const res = await fetch(`https://api.nanorocky.top/xmw/?city=weathercn%3A${city}`);
  return await res.json();
};

// 获取 IPV4 地址的地理位置信息 API
export const getIPV4AddrLocation = async (ipv4) => {
  // const res = await fetch(`https://ip.taobao.com/outGetIpInfo?ip=${ipv4}&accessKey=alibaba-inc`);
  const res = await fetch(`https://api.nanorocky.top/tbipinfo/?ip=${ipv4}`);
  return await res.json();
};

// ------

/**
 * Github 测试
 */
export const testGitHubConnectivity = async (): Promise<number> => {
  const testUrl = 'https://raw.githubusercontent.com/NanoRocky/home/blob/EFU/public/images/icon/github.png';
  const timeout = 3000;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return 1;
    } else {
      return 0;
    }
  } catch (error) {
    return 0;
  }
};