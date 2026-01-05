import { removeLyricMetadata } from '@/utils/removeLyricMetadata';

/**
 * Decode QRC or YRC to text
 * Made by Pizero & NanoRocky
 * @param {string} i - yrc or qrc input
 * @returns {[number, number, [[number, number], string, number, number][]][]}
 */
export function decodeDWQYRC(i: string, rmmd: boolean = false): LineItem[] {
    if (rmmd) i = removeLyricMetadata(i);
    const lines = i.trim().split("\n").filter(line => !/^\[ch:\d+\]/.test(line.trim()));
    const output: LineItem[] = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const rawLine = lines[lineIndex].trim();
        if (/^\[[a-z]+:.+\]$/i.test(rawLine)) continue;
        if (/^\[[a-z]+:.*?\]$/i.test(rawLine)) continue;
        if (/^\[[a-z]\]$/i.test(rawLine)) continue;
        const match = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
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
                    const word = textPart.replace(' ', '&nbsp;');
                    stack.push([
                        [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
                        word,
                        lineIndex,
                        wordIndex
                    ]);
                    wordIndex += 1;
                };
            };
        } else {
            for (let i = 0; i < parts.length - 1; i += 2) {
                const textPart = parts[i];
                const timePart = parts[i + 1];
                const timeMatch = timePart.match(/^\((\d+),(\d+)(?:,\d+)?\)$/);
                if (timeMatch && textPart) {
                    const word = textPart.replace(' ', '&nbsp;');
                    stack.push([
                        [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
                        word,
                        lineIndex,
                        wordIndex
                    ]);
                    wordIndex += 1;
                };
            };
        };
        output.push([start, duration, stack]);
    };
    if (!output.some(o => o[2].length > 0)) {
        throw new Error("歌词文件非逐字歌词");
    };
    return output;
};

type WordItem = [
    position: [number, number],
    text: string,
    lineIndex: number,
    wordIndex: number
];

type LineItem = [
    start: number,
    duration: number,
    stack: WordItem[]
];