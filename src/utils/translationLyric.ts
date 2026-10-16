/**
 * 翻译歌词接口与解析工具模块
 * 负责获取独立翻译歌词（trlrc=only & dwrc=false）、时间轴解析与多源降级同步
 */

import { mainStore } from "@/store";
import i18n from "@/locales";

export interface TranslationLrcLine {
  time: number; // 毫秒 (ms)
  text: string; // 翻译歌词文本
}

/**
 * 将原始歌词 URL 转换为独立翻译歌词 URL
 *
 * @param rawLrcUrl 原始歌词 URL
 * @returns 带有 dwrc=false&trlrc=only 参数的翻译歌词 URL
 */
export function getTranslationLrcUrl(rawLrcUrl: string): string {
  if (!rawLrcUrl) return "";
  try {
    const url = new URL(rawLrcUrl);
    if (url.searchParams.has("dwrc")) {
      url.searchParams.set("dwrc", "false");
    }
    // 添加 trlrc=only 参数，只获取纯翻译歌词
    url.searchParams.set("trlrc", "only");
    return url.toString();
  } catch {
    // 兜底正则替换
    let targetUrl = rawLrcUrl;
    if (/([?&])dwrc=[^&]*/.test(targetUrl)) {
      targetUrl = targetUrl.replace(/([?&])dwrc=[^&]*/, "$1dwrc=false");
    }
    targetUrl = targetUrl.replace(/([?&])trlrc=[^&]*/g, "");
    const sep = targetUrl.includes("?") ? "&" : "?";
    return `${targetUrl}${sep}trlrc=only`;
  }
}

/**
 * 请求接口获取翻译歌词原始文本 (LRC 格式)
 * @param rawLrcUrl 原始歌词 URL 或已转换的翻译歌词 URL
 * @returns 带 LRC 时间轴的翻译歌词文本
 */
export async function fetchTranslationLrc(rawLrcUrl: string): Promise<string> {
  if (!rawLrcUrl) return "";
  const targetUrl = rawLrcUrl.includes("trlrc=only") ? rawLrcUrl : getTranslationLrcUrl(rawLrcUrl);

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return "";
    }
    const text = await res.text();
    return text.trim();
  } catch (error) {
    console.error(i18n.global.t("console.player.fetchTranslationLrcFailed"), error);
    return "";
  }
}

/**
 * 解析带时间轴的翻译歌词文本为结构化列表
 * 示例：[00:12.34]第一句翻译 -> { time: 12340, text: "第一句翻译" }
 *
 * @param lrcText 翻译歌词纯文本
 * @returns 按时间升序排序的翻译歌词数组
 */
export function parseTranslationLrc(lrcText: string): TranslationLrcLine[] {
  if (!lrcText || typeof lrcText !== "string") return [];
  const lines = lrcText.split("\n");
  const result: TranslationLrcLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  let hasValidText = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // 过滤元数据标签如 [ti:], [ar:], [al:], [by:] 等
    if (/^\[[a-z]+:[^\]]*\]$/i.test(trimmed)) continue;

    let match: RegExpExecArray | null;
    const times: number[] = [];
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        ms = parseInt(match[3].padEnd(3, "0").slice(0, 3), 10);
      }
      times.push(minutes * 60 * 1000 + seconds * 1000 + ms);
    }

    if (times.length === 0) continue;

    const pureText = trimmed.replace(timeRegex, "").trim();
    if (pureText) {
      hasValidText = true;
    }
    for (const t of times) {
      result.push({ time: t, text: pureText });
    }
  }

  // 若整首歌均无实质翻译歌词内容（如纯空时间戳），则视作无翻译歌词
  if (!hasValidText) {
    return [];
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * 获取翻译歌词（支持优先从“偷取源”获取，失败时回退到“本源”；AMLL 等其他源直接回本源）
 * @param originalLrcUrl 本源歌词 URL
 * @param pilferLrcUrl 偷取源歌词 URL（若歌词是从隔壁偷的）
 * @returns 解析好的翻译歌词行数组
 */
export async function loadTranslationLyrics(
  originalLrcUrl?: string | null,
  pilferLrcUrl?: string | null,
): Promise<TranslationLrcLine[]> {
  if (pilferLrcUrl) {
    try {
      const pilferTrLrc = await fetchTranslationLrc(pilferLrcUrl);
      const parsedPilfer = parseTranslationLrc(pilferTrLrc);
      if (parsedPilfer.length > 0) {
        return parsedPilfer;
      }
    } catch (e) {
      console.warn(i18n.global.t("console.player.pilferTranslationFailedFallback"), e);
    }
  }

  if (originalLrcUrl) {
    try {
      const originalTrLrc = await fetchTranslationLrc(originalLrcUrl);
      return parseTranslationLrc(originalTrLrc);
    } catch (e) {
      console.warn(i18n.global.t("console.player.fetchOriginalTranslationFailed"), e);
    }
  }

  return [];
}

/**
 * 根据当前播放时间（秒），匹配当前行对应的翻译歌词
 * @param lines 解析后的翻译歌词数组
 * @param currentTimeSec 当前播放时间 (秒)
 * @returns 当前时间点的翻译文本，未匹配到返回空字符串
 */
export function getTranslationLrcAtTime(
  lines: TranslationLrcLine[],
  currentTimeSec: number,
): string {
  if (!lines || lines.length === 0) return "";
  const currentMs = currentTimeSec * 1000;
  let activeText = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentMs) {
      activeText = lines[i].text;
    } else {
      break;
    }
  }
  return activeText;
}

// 模块内部状态缓存
let activeTrLines: TranslationLrcLine[] = [];
let currentExpectedIndex = -1;
let currentOriginalUrl: string | null = null;
let currentPilferUrl: string | null = null;

/**
 * 歌曲开始加载或切换时初始化翻译歌词
 * @param originalUrl 本源歌词 URL
 * @param expectedIndex 歌曲索引（防切歌竞态）
 * @param store mainStore 实例（可选，默认自动获取）
 */
export async function initTranslationLrc(
  originalUrl: string,
  expectedIndex: number,
  store = mainStore(),
) {
  currentExpectedIndex = expectedIndex;
  currentOriginalUrl = originalUrl;
  currentPilferUrl = null;
  activeTrLines = [];

  if (!store.playerTrLrc) {
    store.playerTrLrcText = "";
    return;
  }

  store.playerTrLrcText = "";

  try {
    const lines = await loadTranslationLyrics(originalUrl, null);
    if (currentExpectedIndex !== expectedIndex) return;
    activeTrLines = lines;
    if (lines.length === 0) {
      store.playerTrLrcText = "";
    } else {
      syncTranslationLrc(store.playerCurrentTime || 0, store);
    }
  } catch (err) {
    if (currentExpectedIndex === expectedIndex) {
      activeTrLines = [];
      store.playerTrLrcText = "";
    }
  }
}

/**
 * 当偷歌词成功时调用：优先以偷取的 URL 尝试获取翻译，拿不到则保留本源
 * @param pilferUrl 偷取源的歌词 URL
 * @param expectedIndex 歌曲索引（防切歌竞态）
 * @param store mainStore 实例（可选，默认自动获取）
 */
export async function onPilferSuccess(
  pilferUrl: string,
  expectedIndex: number,
  store = mainStore(),
) {
  if (currentExpectedIndex !== expectedIndex) return;
  currentPilferUrl = pilferUrl;

  if (!store.playerTrLrc) return;

  try {
    const lines = await loadTranslationLyrics(currentOriginalUrl, pilferUrl);
    if (currentExpectedIndex !== expectedIndex) return;
    if (lines.length > 0) {
      activeTrLines = lines;
      syncTranslationLrc(store.playerCurrentTime || 0, store);
    }
  } catch (err) {
    console.warn(i18n.global.t("console.player.updatePilferTranslationFailed"), err);
  }
}

/**
 * 当丢弃偷取歌词时调用：清除偷取源，切换回本源翻译歌词
 * @param expectedIndex 歌曲索引（防切歌竞态，可选，默认当前索引）
 * @param store mainStore 实例（可选，默认自动获取）
 */
export async function onPilferDiscard(expectedIndex = currentExpectedIndex, store = mainStore()) {
  if (expectedIndex !== -1 && currentExpectedIndex !== expectedIndex) return;
  currentPilferUrl = null;

  if (!store.playerTrLrc) {
    store.playerTrLrcText = "";
    return;
  }

  try {
    const lines = await loadTranslationLyrics(currentOriginalUrl, null);
    if (expectedIndex !== -1 && currentExpectedIndex !== expectedIndex) return;
    activeTrLines = lines;
    if (lines.length === 0) {
      store.playerTrLrcText = "";
    } else {
      syncTranslationLrc(store.playerCurrentTime || 0, store);
    }
  } catch (err) {
    if (expectedIndex === -1 || currentExpectedIndex === expectedIndex) {
      activeTrLines = [];
      store.playerTrLrcText = "";
    }
  }
}

/**
 * 根据播放秒数同步当前歌词到 store
 * @param currentTimeSec 当前播放秒数
 * @param store mainStore 实例（可选，默认自动获取）
 */
export function syncTranslationLrc(currentTimeSec: number, store = mainStore()) {
  if (!store.playerTrLrc) {
    if (store.playerTrLrcText) store.playerTrLrcText = "";
    return;
  }
  if (!activeTrLines || activeTrLines.length === 0) {
    if (store.playerTrLrcText !== "") store.playerTrLrcText = "";
    return;
  }
  const text = getTranslationLrcAtTime(activeTrLines, currentTimeSec);
  if (store.playerTrLrcText !== text) {
    store.playerTrLrcText = text;
  }
}

/**
 * 清理当前翻译歌词状态
 */
export function clearTranslationLrc(store = mainStore()) {
  activeTrLines = [];
  currentOriginalUrl = null;
  currentPilferUrl = null;
  currentExpectedIndex = -1;
  store.playerTrLrcText = "";
}
