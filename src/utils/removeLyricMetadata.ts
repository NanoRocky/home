import metadataKeywords from "@/assets/metadata_Keywords.json";
import { mainStore } from "@/store";
import { getLrcMetaDataWords } from "@/api";
import { devLog } from "@/utils/debugLog";

/**
 * 从 API 加载关键词列表,失败时使用本地备份
 * 每次打开网站只调用一次,后续使用缓存
 */
async function loadKeywords(): Promise<{ exact?: string[]; contains?: string[] } | string[]> {
  const store = mainStore();
  if (store.LrcMetaDataCache) {
    return store.LrcMetaDataCache;
  }
  if (store.LrcMetaDataLoading) {
    while (store.LrcMetaDataLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return store.LrcMetaDataCache || metadataKeywords;
  }
  if (!store.playerLyricMetadataByServer) {
    store.LrcMetaDataCache = metadataKeywords;
    return store.LrcMetaDataCache;
  }
  store.LrcMetaDataLoading = true;
  try {
    const SEMetadataKeywords = await getLrcMetaDataWords();
    if (SEMetadataKeywords) {
      store.LrcMetaDataCache = SEMetadataKeywords.data;
    } else {
      store.LrcMetaDataCache = metadataKeywords;
    }
  } catch (error) {
    store.LrcMetaDataCache = metadataKeywords;
  } finally {
    store.LrcMetaDataLoading = false;
  }
  return store.LrcMetaDataCache || metadataKeywords;
}

/**
 * 剔除歌词中的元数据信息
 * 支持 LRC 逐行、网易云 YRC 逐字、QQ QRC 逐字三种格式
 * @param lrcText 原始歌词文本
 * @returns 去除头部和尾部元数据后的歌词文本
 */
export async function removeLyricMetadata(lrcText: string, isPilfering = false): Promise<string> {
  if (!lrcText || typeof lrcText !== "string") {
    return "";
  }
  const rawKeywords = await loadKeywords();
  let exactKeywords: string[] = [];
  let containsKeywords: string[] = [];

  if (Array.isArray(rawKeywords)) {
    exactKeywords = rawKeywords;
  } else {
    exactKeywords = rawKeywords.exact || [];
    containsKeywords = rawKeywords.contains || [];
  }

  const lines = lrcText.split("\n");
  devLog(
    "DWRC-Metadata",
    "开始处理元数据, exact:",
    exactKeywords.length,
    "contains:",
    containsKeywords.length,
    "原歌词行数:",
    lines.length,
  );

  const store = mainStore();
  const title = store.playerTitle ? store.playerTitle.replace(/\s+/g, "").toLowerCase() : "";
  const artist = store.playerArtist ? store.playerArtist.replace(/\s+/g, "").toLowerCase() : "";

  const getLineType = (line: string): "STRICT_META" | "EMPTY" | "REAL" => {
    const temp = line.replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "");
    const pureText = temp.trim().normalize("NFKC");

    if (!/[a-zA-Z0-9\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(pureText)) {
      return "EMPTY";
    }

    if (/^[《「【〖『].+[》」】〗』]$/.test(pureText)) {
      devLog("DWRC-Metadata", `匹配到元数据: [全闭合括号包裹] => ${pureText}`);
      return "STRICT_META";
    }

    if (title && artist) {
      const pt = pureText.replace(/\s+/g, "").toLowerCase();
      if (pt === `${title}-${artist}` || pt === `${artist}-${title}`) {
        devLog("DWRC-Metadata", `匹配到元数据: [歌名-歌手名] => ${pureText}`);
        return "STRICT_META";
      }
    }

    for (const keyword of containsKeywords) {
      if (!keyword) continue;
      if (pureText.replace(/\s+/g, "").includes(keyword.replace(/\s+/g, ""))) {
        devLog("DWRC-Metadata", `匹配到元数据: [包含匹配 ${keyword}] => ${pureText}`);
        return "STRICT_META";
      }
    }

    for (const keyword of exactKeywords) {
      if (!keyword) continue;
      const escapedKeyword = Array.from(keyword)
        .map((c) => {
          if (c === ":" || c === "：" || c === "-") {
            return `(?:[a-zA-Z\\s]*)${c}`;
          }
          return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("\\s*");

      const isPureEnglish = /^[a-zA-Z]+$/.test(keyword);
      const needsSeparator = /^[a-zA-Z\u4e00-\u9fa5]+$/.test(keyword);

      let suffixPattern = ``;
      if (needsSeparator) {
        if (isPureEnglish) {
          suffixPattern = `(?:[:：\\-\\s\\/【《「〖『\\[，,。.]|$)`;
        } else {
          suffixPattern = `[a-zA-Z]*[^:：\\-\\s]{0,6}(?:[:：\\-\\s\\/【《「〖『\\[，,。.]|$)`;
        }
      }

      let prefixPattern = ``;
      if (isPureEnglish) {
        prefixPattern = `^[\\s\\-*•【\\[\\]】《》「」〖〗『』]*`;
      } else {
        prefixPattern = `^[\\s\\-*•【\\[\\]】《》「」〖〗『』]*(?:[【《「〖『\\[][^】》」〗』\\]]+[】》」〗』\\]]\\s*)*(?:[0-9十百千万亿]+)?`;
      }

      const regex = new RegExp(prefixPattern + escapedKeyword + suffixPattern, "i");
      if (regex.test(pureText)) {
        devLog("DWRC-Metadata", `匹配到元数据: [严格匹配 ${keyword}] => ${pureText}`);
        return "STRICT_META";
      }
    }

    return "REAL";
  };
  const scanLimit = Math.min(lines.length, 60); // 扫描前 60 行找元数据块
  let lastStrictMetaIndex = -1;
  const lineTypes: ("STRICT_META" | "EMPTY" | "REAL")[] = new Array(lines.length).fill("REAL");

  for (let i = 0; i < scanLimit; i++) {
    const type = getLineType(lines[i]);
    lineTypes[i] = type;
    if (type === "STRICT_META") {
      lastStrictMetaIndex = i;
    }
  }

  let endOfTopMetaIndex = lastStrictMetaIndex;
  // 如果在第一句真正的歌词前全是空行或标签，也将它们划入元数据块进行丢弃
  for (let i = 0; i < lines.length; i++) {
    const type = i < scanLimit ? lineTypes[i] : getLineType(lines[i]);
    if (type === "REAL") {
      endOfTopMetaIndex = Math.max(endOfTopMetaIndex, i - 1);
      break;
    }
  }

  // 寻找底部的元数据块
  let startOfBottomMetaIndex = lines.length;
  for (let i = lines.length - 1; i > endOfTopMetaIndex; i--) {
    const type = i < scanLimit ? lineTypes[i] : getLineType(lines[i]);
    // 底部如果遇到元数据、空行或特定标签，则全部纳入底部元数据块
    if (
      type === "STRICT_META" ||
      type === "EMPTY" ||
      /^\[(?:ti|ar|al|by|offset|ch):/i.test(lines[i].trim())
    ) {
      startOfBottomMetaIndex = i;
    } else {
      break;
    }
  }

  const finalLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const type = i < scanLimit ? lineTypes[i] : getLineType(lines[i]);

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

    // 过滤掉底部的元数据和空行
    if (i >= startOfBottomMetaIndex) {
      continue;
    }

    finalLines.push(lines[i]);
  }

  const strippedCount = lines.length - finalLines.length;
  if (strippedCount > 0) {
    devLog("DWRC-Metadata", `共剥离 ${strippedCount} 行元数据。剥离后剩余行数:`, finalLines.length);
    if (!isPilfering && finalLines.length > 0) {
      devLog("DWRC-Metadata", `独立剔除后的第一句起始歌词:`, finalLines[0]);
    }
    return finalLines.join("\n");
  }

  return lrcText;
}
