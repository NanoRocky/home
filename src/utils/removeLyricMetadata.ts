import metadataKeywords from '@/assets/metadata_Keywords.json';

/**
 * 剔除歌词中的元数据信息
 * 支持 LRC 逐行、网易云 YRC 逐字、QQ QRC 逐字三种格式
 * @param lrcText 原始歌词文本
 * @returns 去除头部和尾部元数据后的歌词文本
 */
export function removeLyricMetadata(lrcText: string): string {
    if (!lrcText || typeof lrcText !== 'string') {
        return '';
    };
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
        for (const keyword of metadataKeywords) {
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