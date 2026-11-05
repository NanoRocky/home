import { removeLyricMetadata } from "@/utils/removeLyricMetadata";
import { devLog } from "@/utils/debugLog";
import type { LyricEntry, MatchResult, SongMeta } from "@/typings/player";

const punctuationAndSpace =
  /[\s!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~·！？。，、；：“”‘’（）【】《》〈〉—…～]/g;

const stripTimeTags = (line: string): string =>
  line.replace(/\[[^\]]*\]/g, "").replace(/\(\d+(?:,\d+)*\)/g, "");

const colonPrefixRegex = /^.*?[:：]/;

const normalizeLyricLine = (
  line: string,
): { normalized: string; hasStrippedPrefix: boolean } => {
  const withoutTags = stripTimeTags(line);
  const hasStrippedPrefix = colonPrefixRegex.test(withoutTags);
  const stripped = withoutTags
    .replace(colonPrefixRegex, "")
    .normalize("NFKC")
    .toLowerCase();
  return {
    normalized: stripped.replace(punctuationAndSpace, ""),
    hasStrippedPrefix,
  };
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
    const { normalized, hasStrippedPrefix } = normalizeLyricLine(line);
    if (!normalized) return;
    entries.push({
      index,
      normalized,
      original: line,
      startMs: parseStartTimeMs(line),
      hasStrippedPrefix,
    });
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

const anchoredMatch = (
  sourceEntries: LyricEntry[],
  pilferEntries: LyricEntry[],
): MatchResult | null => {
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
          } else if (
            j > 0 &&
            needHint === sourceEntries[sourceIdx].normalized &&
            skippedPilferCount < 3
          ) {
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
        devLog(
          "DWRC-Match",
          `在 p=${p} s=${s} 成功建立匹配。目标行: `,
          matches.map((m) => sourceEntries[m.sourceIdx].normalized).join(" | "),
        );
        const isCleanForCalibration = (sEntry: LyricEntry, pEntry: LyricEntry): boolean => {
          if (sEntry.hasStrippedPrefix || pEntry.hasStrippedPrefix) {
            return false;
          }
          const sClean = stripTimeTags(sEntry.original).trim();
          const pClean = stripTimeTags(pEntry.original).trim();
          return !/[:：【】\[\]]/.test(sClean) && !/[:：【】\[\]]/.test(pClean);
        };

        for (const m of matches) {
          if (isCleanForCalibration(sourceEntries[m.sourceIdx], pilferEntries[m.pilferIdx])) {
            return { sourceIdx: m.sourceIdx, pilferIdx: m.pilferIdx };
          }
        }

        let nextS = s + targetLinesCount;
        let nextP = currentPilferIdx;
        while (nextS < sourceEntries.length && nextP < pilferEntries.length) {
          const sEntry = sourceEntries[nextS];
          const pEntry = pilferEntries[nextP];
          if (sEntry.normalized !== pEntry.normalized) {
            break;
          }
          if (isCleanForCalibration(sEntry, pEntry)) {
            return { sourceIdx: nextS, pilferIdx: nextP };
          }
          nextS++;
          nextP++;
        }

        return { sourceIdx: matches[0].sourceIdx, pilferIdx: matches[0].pilferIdx };
      }
    }
  }

  devLog(
    "DWRC-Match",
    `未能在允许的最大偏移 ${maxSourceStartOffset}(源)/${maxPilferStartOffset}(偷) 内找到匹配项`,
  );
  return null;
};

export const isLrcContentEmpty = (lrcText?: string | null): boolean => {
  if (!lrcText || !lrcText.trim()) return true;
  const stripped = lrcText.replace(/\[[^\]]*\]/g, "").trim();
  if (
    !stripped ||
    /Not avail[ia]ble|暂无歌词|纯音乐[，,\s\-_*•]*(?:请欣赏|无歌词)?|此歌曲为(?:没有填词的)?纯音乐|没有填词|无歌词/i.test(
      stripped,
    )
  ) {
    return true;
  }
  const timeRegex = /\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]|\[\d+,\s*\d+\]/;
  const lines = lrcText.split(/\r?\n/);
  for (const line of lines) {
    if (timeRegex.test(line)) {
      const textOnly = line.replace(/\[[^\]]*\]/g, "").trim();
      if (
        textOnly &&
        !/^(作[词曲]|编曲|监制|歌手|制作人|录音|混音|和声|合声|OP|SP|UP|发行|出品|统筹|企划|推广|封面)[:：]/.test(
          textOnly,
        ) &&
        !/^(纯音乐[，,\s\-_*•]*(?:请欣赏|无歌词)?|此歌曲为(?:没有填词的)?纯音乐|暂无歌词)$/.test(
          textOnly,
        )
      ) {
        return false;
      }
    }
  }
  return true;
};

export async function alignPilferedLyrics(
  pilferLyric: string,
  originalLineLyric?: string,
  songMeta?: SongMeta,
): Promise<string | null> {
  if (!pilferLyric || typeof pilferLyric !== "string") {
    return null;
  }
  if (isLrcContentEmpty(pilferLyric)) {
    devLog("DWRC-Match", "偷取歌词为空或仅包含纯音乐/占位符，放弃偷取");
    return null;
  }
  if (isLrcContentEmpty(originalLineLyric)) {
    devLog("DWRC-Match", "源歌词为空或占位符状态，跳过对齐，直接使用偷取歌词");
    return pilferLyric;
  }
  const cleanedSource = await removeLyricMetadata(originalLineLyric!, true, songMeta);
  const cleanedPilfer = await removeLyricMetadata(pilferLyric, true, songMeta);
  if (!cleanedPilfer.trim()) {
    devLog("DWRC-Match", "偷取歌词剔除元数据后无有效词条，放弃偷取");
    return null;
  }
  if (!cleanedSource.trim()) {
    devLog("DWRC-Match", "源歌词剔除元数据后无有效词条而偷取歌词有效，直接采用偷取歌词");
    return pilferLyric;
  }
  const sourceEntries = buildEntries(cleanedSource);
  const pilferEntries = buildEntries(cleanedPilfer);
  devLog(
    "DWRC-Match",
    "源文件有效词条数:",
    sourceEntries.length,
    "替换文件有效词条数:",
    pilferEntries.length,
  );
  if (sourceEntries.length > 0)
    devLog("DWRC-Match", "剔除后的源文本第一句起始歌词:", sourceEntries[0].original);
  if (pilferEntries.length > 0)
    devLog("DWRC-Match", "剔除后的偷取文本第一句起始歌词:", pilferEntries[0].original);
  if (!pilferEntries.length) {
    devLog("DWRC-Match", "放弃匹配: 偷取歌词有效词条不足");
    return null;
  }
  if (!sourceEntries.length) {
    devLog("DWRC-Match", "源文件无有效词条，直接采用偷取歌词");
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
  devLog(
    "DWRC-Match",
    `对齐时间后的偏移量: 源=${sourceStart} 替换=${pilferStart} 偏移=${offset}ms`,
  );
  if (Math.abs(offset) < 1000) {
    devLog("DWRC-Match", "偏移量小于 1000ms, 忽略微小偏移");
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
