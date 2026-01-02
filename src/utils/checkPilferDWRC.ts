import { removeLyricMetadata } from '@/utils/removeLyricMetadata';

type LyricEntry = {
    index: number;
    normalized: string;
    startMs: number | null;
};

const punctuationAndSpace = /[\s!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~·！？。，、；：“”‘’（）【】《》〈〉—…～]/g;

const normalizeLyricLine = (line: string): string => {
    const stripped = line
        .replace(/\[[^\]]*\]/g, '') // 去除方括号内的标签与时间
        .replace(/\(\d+(?:,\d+)*\)/g, '') // 去除逐字时间戳
        .normalize('NFKC')
        .toLowerCase();
    return stripped.replace(punctuationAndSpace, '');
};

const parseStartTimeMs = (line: string): number | null => {
    const lrcMatch = line.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
    if (lrcMatch) {
        const minutes = Number(lrcMatch[1]);
        const seconds = Number(lrcMatch[2]);
        const fraction = lrcMatch[3] ? Number(lrcMatch[3]) : 0;
        const fractionMs = lrcMatch[3] && lrcMatch[3].length === 3 ? fraction : fraction * 10;
        return minutes * 60_000 + seconds * 1_000 + fractionMs;
    }

    const bracketMatch = line.match(/\[(\d+),\s*(\d+)\]/);
    if (bracketMatch) {
        return Number(bracketMatch[1]);
    }

    const singleNumMatch = line.match(/\[(\d+)\]/);
    if (singleNumMatch) {
        return Number(singleNumMatch[1]);
    }

    const parenMatch = line.match(/\((\d+)(?:,\d+)*\)/);
    if (parenMatch) {
        return Number(parenMatch[1]);
    }

    return null;
};

const buildEntries = (cleanedText: string): LyricEntry[] => {
    const lines = cleanedText.split(/\r?\n/);
    const entries: LyricEntry[] = [];

    lines.forEach((line, index) => {
        const normalized = normalizeLyricLine(line);
        if (!normalized) return;
        entries.push({ index, normalized, startMs: parseStartTimeMs(line) });
    });

    return entries;
};

const findCleanStartIndex = (originalLines: string[], cleanedLines: string[]): number => {
    if (!cleanedLines.length) return 0;
    const first = cleanedLines[0];
    for (let i = 0; i < originalLines.length; i++) {
        if (originalLines[i] === first) {
            return i;
        }
    }
    return 0;
};

const formatLrcTimestamp = (ms: number): string => {
    const clamped = Math.max(0, Math.round(ms));
    const centi = Math.round(clamped / 10); // 转为百分秒
    const minutes = Math.floor(centi / 6000);
    const seconds = Math.floor((centi % 6000) / 100);
    const centiseconds = centi % 100;
    return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
        .toString()
        .padStart(2, '0')}]`;
};

const adjustLineWithOffset = (line: string, offset: number): string | null => {
    if (offset === 0) return line;

    const start = parseStartTimeMs(line);
    if (start !== null && start + offset < 0) {
        return null; // 整行时间轴为负，直接丢弃
    }

    let updated = line;

    // 调整 LRC 时间戳
    updated = updated.replace(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g, (_match, mm, ss, ff = '0') => {
        const minutes = Number(mm);
        const seconds = Number(ss);
        const fraction = ff ? Number(ff) : 0;
        const fractionMs = ff && ff.length === 3 ? fraction : fraction * 10;
        const newMs = minutes * 60_000 + seconds * 1_000 + fractionMs + offset;
        return newMs < 0 ? '' : formatLrcTimestamp(newMs);
    });

    // 调整 YRC/QRC 行首时间戳
    updated = updated.replace(/\[(\d+),\s*(\d+)\]/g, (_match, startStr, duration) => {
        const newStart = Number(startStr) + offset;
        return newStart < 0 ? '' : `[${newStart},${duration}]`;
    });

    // 调整单一毫秒时间戳
    updated = updated.replace(/\[(\d+)\]/g, (_match, startStr) => {
        const newStart = Number(startStr) + offset;
        return newStart < 0 ? '' : `[${newStart}]`;
    });

    // 调整逐字的小括号时间戳（仅调整第一个值）
    updated = updated.replace(/\((\d+(?:,\d+)*)\)/g, (_match, body) => {
        const parts = body.split(',');
        const newStart = Number(parts[0]) + offset;
        if (newStart < 0) return '';
        parts[0] = String(newStart);
        return `(${parts.join(',')})`;
    });

    return updated;
};

export function alignPilferedLyrics(pilferLyric: string, originalLineLyric?: string): string | null {
    if (!pilferLyric || typeof pilferLyric !== 'string') {
        return null;
    }

    if (!originalLineLyric || !originalLineLyric.trim()) {
        return pilferLyric; // 原歌词为空，直接使用偷来的逐字
    }

    const cleanedSource = removeLyricMetadata(originalLineLyric);
    if (!cleanedSource.trim()) {
        return pilferLyric; // 原歌词只有元数据，直接使用偷来的逐字
    }

    const cleanedPilfer = removeLyricMetadata(pilferLyric);

    const sourceEntries = buildEntries(cleanedSource);
    const pilferEntries = buildEntries(cleanedPilfer);

    if (!sourceEntries.length || !pilferEntries.length) {
        return pilferLyric;
    }

    const requiredMatchCount = Math.min(4, sourceEntries.length);
    let matchedIndex = -1;

    for (let i = 0; i <= pilferEntries.length - requiredMatchCount; i++) {
        let matched = true;
        for (let j = 0; j < requiredMatchCount; j++) {
            if (sourceEntries[j].normalized !== pilferEntries[i + j].normalized) {
                matched = false;
                break;
            }
        }
        if (matched) {
            matchedIndex = i;
            break;
        }
    }

    if (matchedIndex === -1) {
        return null; // 找不到匹配，直接丢弃偷来的歌词
    }

    const sourceStart = sourceEntries[0].startMs ?? 0;
    const pilferStart = pilferEntries[matchedIndex].startMs ?? 0;
    let offset = sourceStart - pilferStart;

    // 小于 1.5s 的偏移忽略
    if (Math.abs(offset) < 1500) {
        offset = 0;
    }

    const originalPilferLines = pilferLyric.split(/\r?\n/);
    const cleanedPilferLines = cleanedPilfer.split(/\r?\n/);
    const cleanStartIndex = findCleanStartIndex(originalPilferLines, cleanedPilferLines);
    const linesToRemove = pilferEntries[matchedIndex].index; // 需要移除的前置有效歌词行数

    const trimmedLines = [
        ...originalPilferLines.slice(0, cleanStartIndex),
        ...originalPilferLines.slice(cleanStartIndex + linesToRemove),
    ];

    if (offset === 0) {
        return trimmedLines.join('\n');
    }

    const adjustedLines: string[] = [];
    for (const line of trimmedLines) {
        const updated = adjustLineWithOffset(line, offset);
        if (updated !== null) {
            adjustedLines.push(updated);
        }
    }

    return adjustedLines.join('\n');
}

