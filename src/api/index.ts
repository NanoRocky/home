// import axios from "axios";
import fetchJsonp from "fetch-jsonp";
import { gwgt } from "@/utils/authServer";
import i18n from "@/locales";

/**
 * JSONP 请求模块
 */
// JSONP 请求函数，并返回 JSON 【关于为什么要有这个呢...请腾讯自觉扫一下（x）】
export const loadJSONP = (url, callbackName) => {
  return new Promise((resolve, reject) => {
    // 定义 JSONP 回调函数
    (window as any)[callbackName] = (data: any) => {
      resolve(data); // 解析 JSON 数据
      delete (window as any)[callbackName]; // 清理全局变量，防止污染
    };
    // 创建 script 标签
    const script = document.createElement("script");
    script.src = url;
    script.onerror = () => {
      reject(new Error(i18n.global.t('console.api.jsonpFailed')));
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
  let dataf: any[] = [],
    data3: any[] = [],
    data1: any[] = [],
    data2: any[] = [];
  if (serverse != null && idse != null) {
    try {
      const res1 = await fetch(`${envConfig.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`);
      data1 = await res1.json();
    } catch (e) {
      data1 = [];
      console.error(i18n.global.t('console.api.musicSource1Failed'), e);
    }
    try {
      const res2 = await fetch(
        `${envConfig.VITE_SONG_API}?server=${serverse}&type=${type}&id=${idse}`,
      );
      data2 = await res2.json();
    } catch (e) {
      data2 = [];
      console.error(i18n.global.t('console.api.musicSource2Failed'), e);
    }
    dataf = [...(data2 || []), ...(data1 || [])];
  } else {
    try {
      const res1 = await fetch(`${envConfig.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`);
      data3 = await res1.json();
    } catch (e) {
      data3 = [];
      console.error(i18n.global.t('console.api.musicSource1Failed'), e);
    }
    dataf = [...(data3 || [])];
  }
  const data = dataf;
  if (data.length > 0 && data[0]?.url?.startsWith("@")) {
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const sipList = jsonpData.req_0?.data?.sip || [];
    const domain = (
      sipList.find((i: string) => !i.startsWith("http://ws")) ||
      sipList[0] ||
      ""
    ).replace("http://", "https://");
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
      album: v.album || envConfig.VITE_SITE_NAME, // 没办法，Netease 的 SONG 接口压根不返回专辑名，搜索接口倒是有...
      url: v.url,
      cover: v.cover || v.pic,
      lrc: playerTrLrc && v.lrc ? `${v.lrc}${v.lrc.includes("?") ? "&" : "?"}trlrc=true` : v.lrc,
    }));
  }
};

export const getLrcMetaDataWords = async () => {
  const res = await fetch("https://api.nanorocky.top/lrcmdkw/");
  return await res.json();
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
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
  const testUrl =
    "https://raw.githubusercontent.com/NanoRocky/home/blob/EFU/public/images/icon/github.png";
  const timeout = 3000;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(testUrl, {
      method: "HEAD",
      signal: controller.signal,
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
