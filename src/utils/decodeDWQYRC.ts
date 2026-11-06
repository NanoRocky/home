import { removeLyricMetadata } from "@/utils/removeLyricMetadata";
import i18n from "@/locales";
import type { WordItem, LineItem, SongMeta } from "@/typings/player";

/**
 * Decode QRC or YRC to text
 * Made by Pizero & NanoRocky
 *
 * @param {string} i - 原始 YRC 或 QRC 逐字歌词文本
 * @param {boolean} [rmmd=false] - 是否剔除歌词元数据
 * @param {SongMeta} [songMeta] - 当前歌曲信息（用于匹配歌手/歌名）
 * @returns {Promise<LineItem[]>} 逐字歌词行数组 LineItem[]：
 *   - LineItem: `[start: number, duration: number, stack: WordItem[]]`
 *   - WordItem: `[position: [start: number, duration: number], text: string, lineIndex: number, wordIndex: number]`
 */
export async function decodeDWQYRC(
  i: string,
  rmmd: boolean = false,
  songMeta?: SongMeta,
): Promise<LineItem[]> {
  try {
    if (rmmd) i = await removeLyricMetadata(i, false, songMeta);
    const lines = i
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/([^\n\[\]])\s*(\[\d+,\s*\d+\])/g, "$1\n$2")
      .trim()
      .split("\n")
      .filter((line) => !/^\[ch:\d+\]/.test(line.trim()));
    const output: LineItem[] = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const rawLine = lines[lineIndex].trim();
      if (/^\[[a-z]+:.+\]$/i.test(rawLine)) continue;
      if (/^\[[a-z]+:.*?\]$/i.test(rawLine)) continue;
      if (/^\[[a-z]\]$/i.test(rawLine)) continue;
      const match = rawLine.match(/^\[(\d+),\s*(\d+)\](.*)$/);
      if (!match) continue;
      const start = parseInt(match[1]);
      const duration = parseInt(match[2]);
      const content = match[3].trim();
      if (!/(\(\d+,\d+(?:,\d+)?\))/.test(content)) continue;
      const timeBeforeText = /^\(\d+,\d+(?:,\d+)?\)/.test(content);
      const parts = content.split(/(\(\d+,\d+(?:,\d+)?\))/).filter(Boolean);
      const stack: WordItem[] = [];
      let wordIndex = 1;
      if (timeBeforeText) {
        for (let i = 0; i < parts.length - 1; i += 2) {
          const timePart = parts[i];
          const textPart = parts[i + 1];
          const timeMatch = timePart.match(/^\((\d+),(\d+)(?:,\d+)?\)$/);
          if (timeMatch && textPart) {
            const word = textPart.replace(/ /g, "\u00A0");
            stack.push([
              [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
              word,
              lineIndex,
              wordIndex,
            ]);
            wordIndex += 1;
          }
        }
      } else {
        for (let i = 0; i < parts.length - 1; i += 2) {
          const textPart = parts[i];
          const timePart = parts[i + 1];
          const timeMatch = timePart.match(/^\((\d+),(\d+)(?:,\d+)?\)$/);
          if (timeMatch && textPart) {
            const word = textPart.replace(/ /g, "\u00A0");
            stack.push([
              [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
              word,
              lineIndex,
              wordIndex,
            ]);
            wordIndex += 1;
          }
        }
      }
      output.push([start, duration, stack]);
    }
    if (!output.some((o) => o[2].length > 0)) {
      throw new Error(i18n.global.t("utils.decodeDWQYRC.notVerbatimLyric"));
    }
    return output;
  } catch (error) {
    throw new Error(
      `${i18n.global.t("utils.decodeDWQYRC.parseError")}${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export type { WordItem, LineItem };
