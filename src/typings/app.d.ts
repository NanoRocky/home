export type LocaleKey = "zh-CN" | "en-US" | "ja-JP";

export interface CurrentTime {
  year: number;
  month: number | string;
  day: number | string;
  weekday: string;
  hour: number | string;
  minute: number | string;
  second: number | string;
}

export interface TimeCapsuleItem {
  name: string;
  total: number;
  passed: number;
  remaining: number;
  percentage: string;
}

export interface TimeCapsuleData {
  day: TimeCapsuleItem;
  week: TimeCapsuleItem;
  month: TimeCapsuleItem;
  year: TimeCapsuleItem;
}

export interface SearchEngine {
  name: string;
  key: string;
  url: string;
  icon: string;
}

export interface SiteLink<TIcon = string> {
  icon: TIcon;
  name: string;
  link: string;
}
