import metadataKeywords from '@/assets/metadata_Keywords.json';
import { gasC } from "@/utils/authServer";

// 缓存变量
let cachedKeywords: string[] | null = null;
let isLoading = false;
let serverOpen = true;

/**
 * 从 API 加载关键词列表,失败时使用本地备份
 * 每次打开网站只调用一次,后续使用缓存
 */
async function loadKeywords(): Promise<string[]> {
    if (cachedKeywords) {
        return cachedKeywords;
    };
    if (isLoading) {
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 50));
        };
        return cachedKeywords || metadataKeywords;
    };
    if (!serverOpen) {
        cachedKeywords = metadataKeywords;
        return cachedKeywords;
    };
    isLoading = true;
    try {
        const response = await fetch('https://api.nanorocky.top/lrcmdkw/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.code === 200 && Array.isArray(result.data) && result.data.every(item => typeof item === 'string')) {
                cachedKeywords = result.data;
                console.log(`Successfully loaded ${result.count} keywords from API`);
            } else {
                console.warn('Invalid API response format, using local fallback');
                cachedKeywords = metadataKeywords;
            };
        } else {
            console.warn(`API returned status ${response.status}, using local fallback`);
            cachedKeywords = metadataKeywords;
        };
    } catch (error) {
        console.warn('Failed to load keywords from API, using local fallback:', error);
        cachedKeywords = metadataKeywords;
    } finally {
        isLoading = false;
    };
    return cachedKeywords || metadataKeywords;
}

/**
 * 剔除歌词中的元数据信息
 * 支持 LRC 逐行、网易云 YRC 逐字、QQ QRC 逐字三种格式
 * @param lrcText 原始歌词文本
 * @returns 去除头部和尾部元数据后的歌词文本
 */
export async function removeLyricMetadata(lrcText: string): Promise<string> {
    if (!lrcText || typeof lrcText !== 'string') {
        return '';
    };
    const keywords = await loadKeywords();
    const lines = lrcText.split('\n');

    /**
     * 判断一行是否是元数据行
     * 创建临时变量，移除所有括号内的内容，保留纯字符进行判断
     */
    const isMetadataLine = (line: string): boolean => {
        if (/^\[(?:ti|ar|al|by|offset|ch):/i.test(line.trim())) {
            return false;
        };
        const temp = line.replace(/[\[\{]\w+[:\d,]*[\]\}]/g, '').replace(/\(\d+(?:,\d+)*\)/g, '');
        const pureText = temp.trim();
        for (const keyword of keywords) {
            if (pureText.includes(keyword)) {
                return true;
            };
        };
        return false;
    };

    let startIndex = 0;
    let firstLyricLineIndex = -1;
    let isFirstLyricLine = true;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || /^\[(?:ti|ar|al|by|offset|ch):/i.test(line) || !/^\[[\d,:.\s]+\]/.test(line)) {
            continue;
        };
        const pureContent = line.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();
        if (!pureContent) {
            continue;
        };
        if (isFirstLyricLine) {
            isFirstLyricLine = false;
            if (!isMetadataLine(line)) {
                firstLyricLineIndex = i;
                continue;
            };
        };
        const isMetadata = isMetadataLine(line);
        if (isMetadata) {
            if (firstLyricLineIndex !== -1) {
                firstLyricLineIndex = -1;
            };
            continue;
        };
        if (firstLyricLineIndex !== -1) {
            startIndex = firstLyricLineIndex;
        } else {
            startIndex = i;
        };
        break;
    };
    let endIndex = lines.length - 1;
    for (let i = lines.length - 1; i >= startIndex; i--) {
        const line = lines[i].trim();
        if (!line || /^\[(?:ti|ar|al|by|offset|ch):/i.test(line) || !/^\[[\d,:.\s]+\]/.test(line)) {
            endIndex = i;
            continue;
        };
        const pureContent = line.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();
        if (!pureContent || isMetadataLine(line)) {
            endIndex = i;
            continue;
        };
        endIndex = i;
        break;
    };
    return lines.slice(startIndex, endIndex + 1).join('\n');
};