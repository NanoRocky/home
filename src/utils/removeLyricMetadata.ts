import metadataKeywords from "@/assets/metadata_Keywords.json";
import { mainStore } from "@/store";
import { getLrcMetaDataWords } from "@/api";

/**
 * 从 API 加载关键词列表,失败时使用本地备份
 * 每次打开网站只调用一次,后续使用缓存
 */
async function loadKeywords(): Promise<string[]> {
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
export async function removeLyricMetadata(lrcText: string): Promise<string> {
  if (!lrcText || typeof lrcText !== "string") {
    return "";
  }
  const keywords = await loadKeywords();
  const lines = lrcText.split("\n");

  /**
   * 判断一行是否是元数据行
   * 创建临时变量，移除所有括号内的内容，保留纯字符进行判断
   */
  const isMetadataLine = (line: string): boolean => {
    if (/^\[(?:ti|ar|al|by|offset|ch):/i.test(line.trim())) {
      return true;
    }
    const temp = line.replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "");
    const pureText = temp.trim();
    if (!pureText) return false;

    for (const keyword of keywords) {
      if (!keyword) continue;
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const isPureEnglish = /^[a-zA-Z]+$/.test(keyword);
      const needsSeparator = /^[a-zA-Z\u4e00-\u9fa5]+$/.test(keyword);

      let suffixPattern = ``;
      if (needsSeparator) {
        if (isPureEnglish) {
          suffixPattern = `(?:[:：\\-\\s\\/]|$)`;
        } else {
          suffixPattern = `[^:：\\-\\s]{0,6}(?:[:：\\-\\s\\/]|$)`;
        }
      }

      const regex = new RegExp(`^[\\s\\-*•【\\[\\]】《》]*${escapedKeyword}${suffixPattern}`, "i");
      if (regex.test(pureText)) {
        return true;
      }
    }
    return false;
  };

  let startIndex = 0;
  let firstLyricLineIndex = -1;
  let isFirstLyricLine = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^\[(?:ti|ar|al|by|offset|ch):/i.test(line) || !/^\[[\d,:.\s]+\]/.test(line)) {
      continue;
    }
    const pureContent = line
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\([^)]*\)/g, "")
      .trim();
    if (!pureContent) {
      continue;
    }
    if (isFirstLyricLine) {
      isFirstLyricLine = false;
      if (!isMetadataLine(line)) {
        firstLyricLineIndex = i;
        continue;
      }
    }
    const isMetadata = isMetadataLine(line);
    if (isMetadata) {
      if (firstLyricLineIndex !== -1) {
        firstLyricLineIndex = -1;
      }
      continue;
    }
    if (firstLyricLineIndex !== -1) {
      startIndex = firstLyricLineIndex;
    } else {
      startIndex = i;
    }
    break;
  }
  let endIndex = lines.length - 1;
  for (let i = lines.length - 1; i >= startIndex; i--) {
    const line = lines[i].trim();
    if (!line || /^\[(?:ti|ar|al|by|offset|ch):/i.test(line) || !/^\[[\d,:.\s]+\]/.test(line)) {
      endIndex = i;
      continue;
    }
    const pureContent = line
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\([^)]*\)/g, "")
      .trim();
    if (!pureContent || isMetadataLine(line)) {
      endIndex = i;
      continue;
    }
    endIndex = i;
    break;
  }
  return lines.slice(startIndex, endIndex + 1).join("\n");
}
