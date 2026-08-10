import { createI18n, useI18n } from "vue-i18n";
import zh_cn from "@/locales/zh-CN.json";
import en_us from "@/locales/en-US.json";
import ja_jp from "@/locales/ja-JP.json";

// 获取浏览器语言
export const getBrowserLanguage = () => {
  const navigatorLanguage = navigator.language;
  if (navigatorLanguage.includes("en")) {
    return "en-US";
  } else if (navigatorLanguage.includes("ja")) {
    return "ja-JP";
  } else if (navigatorLanguage.includes("zh")) {
    return "zh-CN";
  } else {
    return "zh-CN";
  }
};

const defaultLocale = () => {
  const lang = getBrowserLanguage() || "zh-CN";
  return lang;
};

const messages = {
  "zh-CN": zh_cn,
  "en-US": en_us,
  "ja-JP": ja_jp,
};

// 导出支持的语言列表，用于外部判断
export const supportedLocales = Object.keys(messages) as LocaleKey[];

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale(),
  fallbackLocale: "zh-CN",
  messages,
});

export type LocaleKey = keyof typeof messages;
export default i18n;
