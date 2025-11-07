
type LrcLine = { time: number; text: string; raw: string; isMeta: boolean };
type PilferWord = { start: number; dur: number; flag?: number; text: string };
type PilferLine = { start: number; dur: number; words: PilferWord[]; raw: string; isMeta: boolean };
type LyricFormat = 'YRC' | 'QRC' | 'UNKNOWN';

function parseLrcTimeToMs(mmssxx: string): number | null {
    const m = mmssxx.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60000 + parseInt(m[2], 10) * 1000 + (m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0);
}

function isMetaLineRaw(line: string): boolean {
    const s = line.trim();
    return /^\[(ti|ar|al|by|offset|ch)\s*:/i.test(s) ||
        (/^\[(\d{1,2}:\d{2})/.test(s) && /作词|作曲|编曲|吉他|配唱|混音|出品人|监制/i.test(s));
}

function parseLrcLines(lrc: string): LrcLine[] {
    return lrc.split(/\r?\n/).map(raw => {
        const timeMatch = raw.match(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/);
        const isMeta = isMetaLineRaw(raw);
        const text = raw.replace(/\[.+?\]/g, '').trim();
        const time = timeMatch ? parseLrcTimeToMs(`[${timeMatch[1]}]`) ?? -1 : -1;
        return { time, text, raw, isMeta };
    });
}

function normalizeForMatch(text: string): string {
    return text.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function parseQRCContent(content: string): PilferWord[] {
    const words: PilferWord[] = [];
    const re = /([^()]*)(\(\d+,\d+\))/g;
    let lastIndex = 0;
    let match;
    while ((match = re.exec(content)) !== null) {
        if (match.index > lastIndex) {
            words.push({ text: content.substring(lastIndex, match.index), start: -1, dur: -1 });
        }
        const timeMatch = match[2].match(/\((\d+),(\d+)\)/);
        if (timeMatch) {
            words.push({ text: match[1], start: parseInt(timeMatch[1]), dur: parseInt(timeMatch[2]) });
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        words.push({ text: content.substring(lastIndex), start: -1, dur: -1 });
    }
    return words;
}

function parsePilferedRaw(raw: string): { lines: PilferLine[], format: LyricFormat } {
    const lines = raw.split(/\r?\n/);
    let format: LyricFormat = 'UNKNOWN';

    const pilferLines = lines.map(rawLine => {
        const trimmed = rawLine.trim();
        if (!trimmed || isMetaLineRaw(trimmed)) {
            return { start: -1, dur: -1, words: [], raw: rawLine, isMeta: true };
        }

        const lineMatch = trimmed.match(/^\[(\d+),(\d+)\](.*)$/);
        if (!lineMatch) return { start: -1, dur: -1, words: [], raw: rawLine, isMeta: true };

        const [, start, dur, content] = lineMatch;
        let words: PilferWord[] = [];

        if (format === 'UNKNOWN' && content) {
            if (/\([^)]+\)[^()]+/.test(content)) format = 'YRC';
            else if (/[^()]+\([^)]+\)/.test(content) || /\(\d+,\d+\)/.test(content)) format = 'QRC';
        }

        if (format === 'QRC') {
            words = parseQRCContent(content);
        } else { // YRC or fallback
            const wordRe = /\((\d+),(\d+)(,(\d+))?\)([^()]+)/g;
            let match;
            while ((match = wordRe.exec(content)) !== null) {
                words.push({ start: parseInt(match[1]), dur: parseInt(match[2]), flag: match[4] ? parseInt(match[4]) : 0, text: match[5] });
            }
        }
        return { start: parseInt(start), dur: parseInt(dur), words, raw: rawLine, isMeta: false };
    }).filter((l): l is PilferLine => l !== null);

    return { lines: pilferLines, format };
}

function buildPilferedRaw(lines: PilferLine[], format: LyricFormat): string {
    return lines.map(line => {
        if (line.isMeta) return line.raw;
        const wordsStr = line.words.map(w => {
            if (w.start === -1) return w.text;
            const timeTuple = w.flag !== undefined ? `(${w.start},${w.dur},${w.flag})` : `(${w.start},${w.dur})`;
            return format === 'QRC' ? `${w.text}${timeTuple}` : `${timeTuple}${w.text}`;
        }).join('');
        return `[${line.start},${line.dur}]${wordsStr}`;
    }).join('\n');
}

export function alignPilferedLyrics(originalLrc: string, pilferedRaw: string, minConsecutiveMatch = 3): string {
    const origLyricLines = parseLrcLines(originalLrc).filter(l => !l.isMeta && l.text);
    const { lines: pilferedLines, format } = parsePilferedRaw(pilferedRaw);
    const pilferedLyricLines = pilferedLines.filter(l => !l.isMeta && l.words.length > 0);

    if (origLyricLines.length < minConsecutiveMatch || pilferedLyricLines.length < minConsecutiveMatch) {
        return pilferedRaw;
    }

    const normOrig = origLyricLines.map(l => normalizeForMatch(l.text));
    const normPilfered = pilferedLyricLines.map(l => normalizeForMatch(l.words.map(w => w.text).join('')));

    let bestAnchor: { origIndex: number; pilferIndex: number } | null = null;
    for (let i = 0; i <= normOrig.length - minConsecutiveMatch; i++) {
        for (let j = 0; j <= normPilfered.length - minConsecutiveMatch; j++) {
            let match = true;
            for (let k = 0; k < minConsecutiveMatch; k++) {
                if (normOrig[i + k] !== normPilfered[j + k]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                bestAnchor = { origIndex: i, pilferIndex: j };
                break;
            }
        }
        if (bestAnchor) break;
    }

    if (!bestAnchor) return pilferedRaw;

    const offset = origLyricLines[bestAnchor.origIndex].time - pilferedLyricLines[bestAnchor.pilferIndex].start;

    const adjustedLines = pilferedLines.map(line => {
        if (line.isMeta) return line;
        const newLineStart = line.start + offset;
        const newWords = line.words.map(w => ({ ...w, start: w.start !== -1 ? w.start + offset : -1 }));
        return { ...line, start: newLineStart, words: newWords };
    });

    const firstLyricTime = adjustedLines.find(l => !l.isMeta)?.start;
    const finalLines = (firstLyricTime !== undefined && firstLyricTime < 0)
        ? adjustedLines.filter(l => !l.isMeta || (l.raw && l.raw.includes('[ti:')))
        : adjustedLines;

    return buildPilferedRaw(finalLines, format);
}
