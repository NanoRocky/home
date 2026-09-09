import { removeLyricMetadata } from "@/utils/removeLyricMetadata";

type LyricEntry = {
  index: number;
  normalized: string;
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

const strictMatch = (sourceEntries: LyricEntry[], pilferEntries: LyricEntry[]): MatchResult | null => {
  const minRequired = Math.min(3, sourceEntries.length, pilferEntries.length);
  if (minRequired === 0) return null;

  for (let requiredMatchCount = minRequired; requiredMatchCount >= Math.min(2, minRequired); requiredMatchCount--) {
    for (let s = 0; s <= sourceEntries.length - requiredMatchCount; s++) {
      for (let p = 0; p <= pilferEntries.length - requiredMatchCount; p++) {
        let matched = true;
        for (let j = 0; j < requiredMatchCount; j++) {
          if (sourceEntries[s + j].normalized !== pilferEntries[p + j].normalized) {
            matched = false;
            break;
          }
        }
        if (matched) return { sourceIdx: s, pilferIdx: p };
      }
    }
  }
  return null;
};

const fuzzyMatch = (sourceEntries: LyricEntry[], pilferEntries: LyricEntry[]): MatchResult | null => {
  const minRequired = Math.min(3, sourceEntries.length, pilferEntries.length);
  if (minRequired === 0) return null;

  for (let requiredMatchCount = minRequired; requiredMatchCount >= Math.min(2, minRequired); requiredMatchCount--) {
    for (let s = 0; s <= sourceEntries.length - requiredMatchCount; s++) {
      for (let p = 0; p <= pilferEntries.length - requiredMatchCount; p++) {
        let matched = true;
        let latestHintLineNumber = p;

        for (let j = 0; j < requiredMatchCount; j++) {
          let needHint = sourceEntries[s + j].normalized;
          for (
            let currentLnNum = latestHintLineNumber;
            currentLnNum < pilferEntries.length && currentLnNum < latestHintLineNumber + 10;
            currentLnNum++
          ) {
            const currentLine = pilferEntries[currentLnNum].normalized;
            if (needHint.startsWith(currentLine)) {
              needHint = needHint.slice(currentLine.length);
              latestHintLineNumber = currentLnNum + 1;
            } else {
              break;
            }
            if (needHint === "") {
              break;
            }
          }
          if (needHint !== "") {
            matched = false;
            break;
          }
        }
        if (matched) {
          return { sourceIdx: s, pilferIdx: p };
        }
      }
    }
  }
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
  const cleanedSource = await removeLyricMetadata(originalLineLyric);
  if (!cleanedSource.trim()) {
    return pilferLyric;
  }
  const cleanedPilfer = await removeLyricMetadata(pilferLyric);
  const sourceEntries = buildEntries(cleanedSource);
  const pilferEntries = buildEntries(cleanedPilfer);
  if (!sourceEntries.length || !pilferEntries.length) {
    return pilferLyric;
  }
  let matchResult = strictMatch(sourceEntries, pilferEntries);
  if (!matchResult) {
    matchResult = fuzzyMatch(sourceEntries, pilferEntries);
  }
  if (!matchResult) {
    return null;
  }
  
  const sourceStart = sourceEntries[matchResult.sourceIdx].startMs ?? 0;
  const pilferStart = pilferEntries[matchResult.pilferIdx].startMs ?? 0;
  let offset = sourceStart - pilferStart;
  if (Math.abs(offset) < 1500 && Math.abs(offset) > -1500) {
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
