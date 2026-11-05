import metadataKeywords from "@/assets/metadata_Keywords.json";
import { mainStore } from "@/store";
import { getLrcMetaDataWords } from "@/api";
import { devLog } from "@/utils/debugLog";
import i18n from "@/locales";

import type { MetadataConfig, MetadataRule } from "@/typings/store";
import type { SongMeta } from "@/typings/player";
export type { MetadataConfig, MetadataRule };

export const isInstrumentalLyric = (text?: string | null): boolean => {
  if (!text) return false;
  return /纯音乐[，,\s\-_*•]*(?:请您?欣赏|无歌词)?|此歌曲为(?:没有填词的)?(?:纯音乐|DJ(?:舞曲)?|伴奏|器乐)|Instrumental/i.test(
    text,
  );
};

let cachedCompiledRules: RegExp[] | null = null;
let lastRawConfigRef: any = null;

function compileRules(config: MetadataConfig): RegExp[] {
  if (config === lastRawConfigRef && cachedCompiledRules) {
    return cachedCompiledRules;
  }
  lastRawConfigRef = config;

  const compiled: RegExp[] = [];

  if (config && Array.isArray(config.rules)) {
    for (const rule of config.rules) {
      if (rule && typeof rule.pattern === "string") {
        try {
          compiled.push(new RegExp(rule.pattern, "i"));
        } catch (e) {
          console.error(`[DWRC-Metadata] 编译规则 [${rule.name}] 失败:`, e);
        }
      }
    }
  }

  cachedCompiledRules = compiled;
  return compiled;
}

async function loadKeywords(): Promise<MetadataConfig> {
  // return metadataKeywords as MetadataConfig;
  const store = mainStore();
  if (store.LrcMetaDataCache && Array.isArray(store.LrcMetaDataCache.rules)) {
    return store.LrcMetaDataCache;
  }
  if (store.LrcMetaDataLoading) {
    while (store.LrcMetaDataLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return store.LrcMetaDataCache && Array.isArray(store.LrcMetaDataCache.rules)
      ? store.LrcMetaDataCache
      : (metadataKeywords as MetadataConfig);
  }
  if (!store.playerLyricMetadataByServer) {
    store.LrcMetaDataCache = metadataKeywords as MetadataConfig;
    return store.LrcMetaDataCache;
  }
  store.LrcMetaDataLoading = true;
  try {
    const res = await getLrcMetaDataWords();
    const remoteConfig = res?.rules ? res : res?.data?.rules ? res.data : null;
    if (remoteConfig && Array.isArray(remoteConfig.rules)) {
      store.LrcMetaDataCache = remoteConfig;
    } else {
      store.LrcMetaDataCache = metadataKeywords as MetadataConfig;
    }
  } catch (error) {
    store.LrcMetaDataCache = metadataKeywords as MetadataConfig;
  } finally {
    store.LrcMetaDataLoading = false;
  }
  return store.LrcMetaDataCache || (metadataKeywords as MetadataConfig);
}

/**
 * 剔除歌词中的元数据信息
 * 支持 LRC 逐行、网易云 YRC 逐字、QQ QRC 逐字三种格式
 * @param lrcText 原始歌词文本
 * @param isPilfering 是否正在进行偷歌词比对
 * @param songMeta 当前曲目的标题与歌手信息（避免切歌加载时误读上一首缓存）
 * @returns 去除头部和尾部元数据后的歌词文本
 */
export async function removeLyricMetadata(
  lrcText: string,
  isPilfering = false,
  songMeta?: SongMeta,
): Promise<string> {
  if (!lrcText || typeof lrcText !== "string") {
    return "";
  }
  const rawConfig = await loadKeywords();
  const rules = compileRules(rawConfig);

  const normalizedText = lrcText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([^\n\[\]])\s*(\[\d+,\s*\d+\])/g, "$1\n$2")
    .replace(/([^\n\[\]])\s*(\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\])/g, "$1\n$2")
    .replace(/\[(\d):(\d{2}(?:[.:]\d{1,3})?)\]/g, "[0$1:$2]");

  const lines = normalizedText.split("\n");
  devLog("DWRC-Metadata", "开始处理元数据, 规则数:", rules.length, "原歌词行数:", lines.length);

  let lrcTitle = "";
  let lrcArtist = "";
  for (const line of lines) {
    const tiMatch = line.match(/^\[ti:\s*(.*?)\s*\]/i);
    if (tiMatch && tiMatch[1]) lrcTitle = tiMatch[1].trim();
    const arMatch = line.match(/^\[ar:\s*(.*?)\s*\]/i);
    if (arMatch && arMatch[1]) lrcArtist = arMatch[1].trim();
    if (lrcTitle && lrcArtist) break;
  }

  const store = mainStore();
  const rawTitle = songMeta?.title || lrcTitle || store.playerTitle;
  const rawArtist = songMeta?.artist || lrcArtist || store.playerArtist;
  const title = rawTitle ? rawTitle.replace(/\s+/g, "").toLowerCase() : "";
  const artist = rawArtist ? rawArtist.replace(/\s+/g, "").toLowerCase() : "";

  const getLineType = (line: string): "STRICT_META" | "EMPTY" | "REAL" => {
    const temp = line
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\(\d+,\d+(?:,\d+)?\)/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\{[^}]*\}/g, "");
    const pureText = temp.trim().normalize("NFKC");

    // 空行或纯符号
    if (!/[a-zA-Z0-9\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(pureText)) {
      return "EMPTY";
    }

    // 全闭合书名号/括号包裹，例如《晴天》、[制作名单]
    if (/^[《「【〖『].+[》」】〗』]$/.test(pureText)) {
      devLog("DWRC-Metadata", `匹配到元数据: [全闭合括号包裹] => ${pureText}`);
      return "STRICT_META";
    }

    // 匹配 歌名-歌手名 或 歌手名-歌名
    if (title && artist) {
      const pt = pureText.replace(/\s+/g, "").toLowerCase();
      if (pt === `${title}-${artist}` || pt === `${artist}-${title}`) {
        devLog("DWRC-Metadata", `匹配到元数据: [歌名-歌手名] => ${pureText}`);
        return "STRICT_META";
      }
    }

    const colonMatch = pureText.match(/^(.+?)[:：]\s*$/);
    if (colonMatch) {
      const prefix = colonMatch[1].replace(/^[（(\[{【]|[）)\]}】]$/g, "").trim();
      const cleanPrefix = prefix.replace(/\s+/g, "").toLowerCase();

      if (
        artist &&
        (cleanPrefix === artist || artist.includes(cleanPrefix) || cleanPrefix.includes(artist))
      ) {
        devLog("DWRC-Metadata", `匹配到元数据: [歌手提示行(匹配当前歌手)] => ${pureText}`);
        return "STRICT_META";
      }

      if (
        /^(?:男|女|合|[男女合]声|[男女合]唱|全员|众人|群星|独白|对白|旁白|念白|合奏)$/i.test(
          cleanPrefix,
        )
      ) {
        devLog("DWRC-Metadata", `匹配到元数据: [声部提示行] => ${pureText}`);
        return "STRICT_META";
      }

      if (cleanPrefix.length >= 1 && cleanPrefix.length <= 10) {
        devLog("DWRC-Metadata", `匹配到元数据: [独立人名/声部提示行] => ${pureText}`);
        return "STRICT_META";
      }
    }

    // 正则规则匹配
    for (const rule of rules) {
      if (rule.test(pureText)) {
        devLog("DWRC-Metadata", `匹配到元数据: [规则匹配] => ${pureText}`);
        return "STRICT_META";
      }
    }

    return "REAL";
  };

  const lineTypes: ("STRICT_META" | "EMPTY" | "REAL")[] = lines.map((line) => getLineType(line));

  let endOfTopMetaIndex = -1;
  let consecutiveRealCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const type = lineTypes[i];
    if (type === "STRICT_META") {
      if (consecutiveRealCount < 2) {
        endOfTopMetaIndex = i;
        consecutiveRealCount = 0;
      } else {
        break;
      }
    } else if (type === "REAL") {
      consecutiveRealCount++;
      if (consecutiveRealCount >= 2 && endOfTopMetaIndex !== -1) {
        break;
      }
      if (consecutiveRealCount >= 3 && endOfTopMetaIndex === -1) {
        break;
      }
    }
  }

  let startOfBottomMetaIndex = lines.length;
  let foundBottomMeta = false;
  let consecutiveRealInBottom = 0;

  for (let i = lines.length - 1; i > endOfTopMetaIndex; i--) {
    const type = lineTypes[i];
    const isTag = /^\[(?:ti|ar|al|by|offset|ch):/i.test(lines[i].trim());

    if (type === "STRICT_META" || isTag) {
      foundBottomMeta = true;
      startOfBottomMetaIndex = i;
      consecutiveRealInBottom = 0;
    } else if (type === "EMPTY") {
      if (foundBottomMeta) {
        startOfBottomMetaIndex = i;
      }
    } else {
      // type === "REAL"
      if (!foundBottomMeta) {
        const prev1 = i - 1 > endOfTopMetaIndex ? lineTypes[i - 1] : "REAL";
        const prev2 = i - 2 > endOfTopMetaIndex ? lineTypes[i - 2] : "REAL";
        if (prev1 === "STRICT_META" || prev2 === "STRICT_META") {
          consecutiveRealInBottom++;
          if (consecutiveRealInBottom > 1) {
            break;
          }
        } else {
          break;
        }
      } else {
        const prev1 = i - 1 > endOfTopMetaIndex ? lineTypes[i - 1] : "REAL";
        const prev2 = i - 2 > endOfTopMetaIndex ? lineTypes[i - 2] : "REAL";
        if (prev1 === "STRICT_META" || prev2 === "STRICT_META") {
          startOfBottomMetaIndex = i;
        } else {
          break;
        }
      }
    }
  }

  const finalLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const type = lineTypes[i];

    // 过滤掉顶部的元数据和空行
    if (i <= endOfTopMetaIndex) {
      if (
        type === "STRICT_META" ||
        type === "EMPTY" ||
        /^\[(?:ti|ar|al|by|offset|ch):/i.test(lines[i].trim())
      ) {
        continue;
      }
    }

    if (i >= startOfBottomMetaIndex) {
      continue;
    }

    finalLines.push(lines[i]);
  }

  const isVerbatimFormat = /\[\d+,\s*\d+\]/.test(normalizedText);
  const buildInstrumentalFallback = () => {
    const instText = i18n.global.t("components.music.instrumental") || "纯音乐，请欣赏";
    return isVerbatimFormat ? `[0,5000](0,5000)${instText}` : `[00:00.00]${instText}`;
  };

  const strippedCount = lines.length - finalLines.length;
  if (strippedCount > 0) {
    devLog("DWRC-Metadata", `共剥离 ${strippedCount} 行元数据。剥离后剩余行数:`, finalLines.length);
    if (!isPilfering && finalLines.length > 0) {
      devLog("DWRC-Metadata", `独立剔除后的第一句起始歌词:`, finalLines[0]);
    }
    if (finalLines.length === 0) {
      if (!isPilfering) {
        devLog("DWRC-Metadata", "元数据剔除后无歌词剩余，作为纯音乐处理，保留纯音乐提示");
        return buildInstrumentalFallback();
      }
      return "";
    }
    return finalLines.join("\n");
  }

  if (finalLines.length === 0) {
    if (!isPilfering) {
      devLog("DWRC-Metadata", "元数据剔除后无歌词剩余，作为纯音乐处理，保留纯音乐提示");
      return buildInstrumentalFallback();
    }
    return "";
  }

  return lrcText;
}
