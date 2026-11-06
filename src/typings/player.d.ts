import type { APlayer as APlayerType } from "@worstone/vue-aplayer";

export interface PlaylistItem {
  name: string;
  artist: string;
  album?: string;
  url: string;
  rawUrl?: string;
  _signedUrl?: string;
  _signTime?: number;
  _signingPromise?: Promise<string>;
  _rawLrc?: string;
  _rawLrcPromise?: Promise<string>;
  cover: string;
  lrc: string;
}

export type PlayerInstance = {
  aplayer: APlayerType;
  audioRef: HTMLAudioElement;
  audioStatus: {
    duration: number;
    playedTime: number;
    playStatus?: boolean;
  };
  skipForwardTimeout?: ReturnType<typeof setTimeout> | null;
  error?: () => void;
  toggle: () => void;
  setVolume: (volume: number, triggerEvent: boolean) => void;
  skipBack: () => void;
  skipForward: () => void;
  toggleList: () => void;
  play: () => void;
  pause: () => void;
  seek?: (time: number) => void;
  setAudio?: (audio: any) => void;
  loadLyric?: (defaultLyric: [number, string][], index: number) => Promise<void>;
  updateLyric?: () => void;
  setNotice?: (text: string, time?: number, opacity?: number) => void;
};

export interface SongMeta {
  title?: string | null;
  artist?: string | null;
}

export type WordItem = [
  position: [start: number, duration: number],
  text: string,
  lineIndex: number,
  wordIndex: number,
];

export type LineItem = [start: number, duration: number, stack: WordItem[]];

export type DWRCItem = LineItem;
export type DwrcItem = [number, number, any[]];

export interface TranslationLrcLine {
  time: number;
  text: string;
}

export interface LyricEntry {
  index: number;
  normalized: string;
  original: string;
  startMs: number | null;
  hasStrippedPrefix?: boolean;
}

export interface MatchResult {
  sourceIdx: number;
  pilferIdx: number;
}

export interface DwrcTimelinePoint {
  time: number;
  x: number;
}

export interface DwrcLineCache {
  wrapEl: Element;
  dwrcSourceRef: unknown;
  lineKey: string;
  proMode: boolean;
  spans: HTMLElement[];
  starts: Float64Array;
  durations: Float64Array;
  clipStates: Float64Array;
  timeline: DwrcTimelinePoint[];
  timelineCursor: number;
}
