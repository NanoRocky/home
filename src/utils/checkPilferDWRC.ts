import { removeLyricMetadata } from "@/utils/removeLyricMetadata";
import { devLog } from "@/utils/debugLog";



type LyricEntry = {
  index: number;
  normalized: string;
  original: string;
  startMs: number | null;
};

const punctuationAndSpace =
  /[\s!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~·！？。，、；：“”‘’（）【】《》〈〉—…～]/g;

const normalizeLyricLine = (line: string): string => {
  const stripped = line
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\(\d+(?:,\d+)*\)/g, "")
    .normalize("NFKC")
    .toLowerCase();
  return stripped.replace(punctuationAndSpace, "");
};

const parseStartTimeMs = (line: string): number | null => {
  const lrcMatch = line.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
  if (lrcMatch) {
    const minutes = Number(lrcMatch[1]);
    const seconds = Number(lrcMatch[2]);
    const fraction = lrcMatch[3] ? Number(lrcMatch[3]) : 0;
    const fractionMs = lrcMatch[3] && lrcMatch[3].length === 3 ? fraction : fraction * 10;
    return minutes * 60000 + seconds * 1000 + fractionMs;
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
    entries.push({ index, normalized, original: line, startMs: parseStartTimeMs(line) });
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
  const centi = Math.round(clamped / 10);
  const minutes = Math.floor(centi / 6000);
  const seconds = Math.floor((centi % 6000) / 100);
  const centiseconds = centi % 100;
  return `[${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds
    .toString()
    .padStart(2, "0")}]`;
};

const adjustLineWithOffset = (line: string, offset: number): string | null => {
  if (offset === 0) return line;

  let updated = line;
  updated = updated.replace(
    /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g,
    (_match, mm, ss, ff = "0") => {
      const minutes = Number(mm);
      const seconds = Number(ss);
      const fraction = ff ? Number(ff) : 0;
      const fractionMs = ff && ff.length === 3 ? fraction : fraction * 10;
      const newMs = Math.max(0, minutes * 60_000 + seconds * 1_000 + fractionMs + offset);
      return formatLrcTimestamp(newMs);
    },
  );
  updated = updated.replace(/\[(\d+),\s*(\d+)\]/g, (_match, startStr, duration) => {
    const newStart = Math.max(0, Number(startStr) + offset);
    return `[${newStart},${duration}]`;
  });
  updated = updated.replace(/\[(\d+)\]/g, (_match, startStr) => {
    const newStart = Math.max(0, Number(startStr) + offset);
    return `[${newStart}]`;
  });
  updated = updated.replace(/\((\d+(?:,\d+)*)\)/g, (_match, body) => {
    const parts = body.split(",");
    const newStart = Math.max(0, Number(parts[0]) + offset);
    parts[0] = String(newStart);
    return `(${parts.join(",")})`;
  });
  return updated;
};

interface MatchResult {
  sourceIdx: number;
  pilferIdx: number;
}

const anchoredMatch = (sourceEntries: LyricEntry[], pilferEntries: LyricEntry[]): MatchResult | null => {
  if (!sourceEntries.length || !pilferEntries.length) return null;

  const maxSourceStartOffset = Math.min(5, sourceEntries.length);
  const maxPilferStartOffset = Math.min(5, pilferEntries.length);

  for (let s = 0; s < maxSourceStartOffset; s++) {
    const targetLinesCount = Math.min(5, sourceEntries.length - s);

    for (let p = 0; p < maxPilferStartOffset; p++) {
      let matched = true;
      let currentPilferIdx = p;
      let matches: { sourceIdx: number; pilferIdx: number }[] = [];

      for (let j = 0; j < targetLinesCount; j++) {
        const sourceIdx = s + j;
        if (currentPilferIdx >= pilferEntries.length) {
          matched = false;
          break;
        }

        if (sourceEntries[sourceIdx].normalized === pilferEntries[currentPilferIdx].normalized) {
          matches.push({ sourceIdx: sourceIdx, pilferIdx: currentPilferIdx });
          currentPilferIdx++;
          continue;
        }

        let needHint = sourceEntries[sourceIdx].normalized;
        let fuzzyMatched = false;
        let tempPilferIdx = currentPilferIdx;
        let skippedPilferCount = 0;
        let startPilferIdx = tempPilferIdx;
        let hasStartedMatching = false;

        while (tempPilferIdx < pilferEntries.length && tempPilferIdx < currentPilferIdx + 10) {
          const pilferLine = pilferEntries[tempPilferIdx].normalized;
          if (needHint.startsWith(pilferLine)) {
            if (!hasStartedMatching) {
              hasStartedMatching = true;
              startPilferIdx = tempPilferIdx;
            }
            needHint = needHint.slice(pilferLine.length);
            tempPilferIdx++;
            if (needHint === "") {
              fuzzyMatched = true;
              currentPilferIdx = tempPilferIdx;
              break;
            }
          } else if (j > 0 && needHint === sourceEntries[sourceIdx].normalized && skippedPilferCount < 3) {
            tempPilferIdx++;
            skippedPilferCount++;
          } else {
            break;
          }
        }

        if (!fuzzyMatched) {
          matched = false;
          break;
        } else {
          matches.push({ sourceIdx: sourceIdx, pilferIdx: startPilferIdx });
        }
      }

      if (matched) {
        devLog("DWRC-Match", `在 p=${p} s=${s} 成功建立匹配。目标行: `, matches.map(m => sourceEntries[m.sourceIdx].normalized).join(" | "));
        for (const m of matches) {
          const sourceOriginal = sourceEntries[m.sourceIdx].original
            .replace(/\[[^\]]*\]/g, "")
            .replace(/\([^)]*\)/g, "")
            .trim();
          if (!/[:：【】\[\]]/.test(sourceOriginal)) {
            return { sourceIdx: m.sourceIdx, pilferIdx: m.pilferIdx };
          }
        }
        return { sourceIdx: matches[0].sourceIdx, pilferIdx: matches[0].pilferIdx };
      }
    }
  }

  devLog("DWRC-Match", `未能在允许的最大偏移 ${maxSourceStartOffset}(源)/${maxPilferStartOffset}(偷) 内找到匹配项`);
  return null;
};

export async function alignPilferedLyrics(
  pilferLyric: string,
  originalLineLyric?: string,
): Promise<string | null> {
  if (!pilferLyric || typeof pilferLyric !== "string") {
    return null;
  }
  if (!originalLineLyric || !originalLineLyric.trim()) {
    return pilferLyric;
  }
  const cleanedSource = await removeLyricMetadata(originalLineLyric, true);
  if (!cleanedSource.trim()) {
    return pilferLyric;
  }
  const cleanedPilfer = await removeLyricMetadata(pilferLyric, true);
  const sourceEntries = buildEntries(cleanedSource);
  const pilferEntries = buildEntries(cleanedPilfer);
  devLog("DWRC-Match", "源文件有效词条数:", sourceEntries.length, "替换文件有效词条数:", pilferEntries.length);
  if (sourceEntries.length > 0) devLog("DWRC-Match", "剔除后的源文本第一句起始歌词:", sourceEntries[0].original);
  if (pilferEntries.length > 0) devLog("DWRC-Match", "剔除后的偷取文本第一句起始歌词:", pilferEntries[0].original);
  if (!sourceEntries.length || !pilferEntries.length) {
    devLog("DWRC-Match", "放弃匹配: 有效词条不足");
    return pilferLyric;
  }

  const matchResult = anchoredMatch(sourceEntries, pilferEntries);
  if (!matchResult) {
    devLog("DWRC-Match", "匹配失败, 返回 null");
    return null;
  }

  const sourceStart = sourceEntries[matchResult.sourceIdx].startMs ?? 0;
  const pilferStart = pilferEntries[matchResult.pilferIdx].startMs ?? 0;
  let offset = sourceStart - pilferStart;
  devLog("DWRC-Match", `对齐时间后的偏移量: 源=${sourceStart} 替换=${pilferStart} 偏移=${offset}ms`);
  if (Math.abs(offset) < 1500 && Math.abs(offset) > -1500) {
    devLog("DWRC-Match", "偏移量小于 1500ms, 忽略微小偏移");
    offset = 0;
  }
  const originalPilferLines = pilferLyric.split(/\r?\n/);
  const cleanedPilferLines = cleanedPilfer.split(/\r?\n/);
  const timeTagRegex = /^\[\d+/;
  let metadataPrefixCount = 0;
  for (let i = 0; i < originalPilferLines.length; i++) {
    const line = originalPilferLines[i].trim();
    if (!line) {
      metadataPrefixCount++;
      continue;
    }
    if (timeTagRegex.test(line)) {
      break;
    }
    metadataPrefixCount++;
  }
  const trimmedLines = originalPilferLines;
  if (offset === 0) {
    return trimmedLines.join("\n");
  }
  const adjustedLines: string[] = [];
  let removedCount = 0;
  for (const line of trimmedLines) {
    const updated = adjustLineWithOffset(line, offset);
    if (updated !== null) {
      adjustedLines.push(updated);
    } else {
      removedCount++;
    }
  }
  return adjustedLines.join("\n");
}
