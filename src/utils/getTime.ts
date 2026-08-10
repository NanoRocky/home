import { h } from "vue";
import { SpaCandle } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import dayjs from "dayjs";
import i18n from "@/locales";

// 时钟
export const getCurrentTime = () => {
  let time = new Date();
  let year = time.getFullYear();
  let month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1;
  let day = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
  let hour = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
  let minute = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  let second = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
  let weekday = [
    i18n.global.t('utils.time.weekdays.sun'),
    i18n.global.t('utils.time.weekdays.mon'),
    i18n.global.t('utils.time.weekdays.tue'),
    i18n.global.t('utils.time.weekdays.wed'),
    i18n.global.t('utils.time.weekdays.thu'),
    i18n.global.t('utils.time.weekdays.fri'),
    i18n.global.t('utils.time.weekdays.sat')
  ];
  let currentTime = {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: weekday[time.getDay()],
  };
  return currentTime;
};

// 时光胶囊
export const getTimeCapsule = () => {
  const now = dayjs();
  const dayText = {
    day: i18n.global.t('utils.time.today'),
    week: i18n.global.t('utils.time.thisWeek'),
    month: i18n.global.t('utils.time.thisMonth'),
    year: i18n.global.t('utils.time.thisYear'),
  };
  /**
   * 计算时间差的函数
   * @param {String} unit 时间单位，可以是 'day', 'week', 'month', 'year'
   */
  const getDifference = (unit) => {
    // 获取当前时间单位的开始时间
    const start = now.startOf(unit);
    // 获取当前时间单位的结束时间
    const end = now.endOf(unit);
    // 计算总的天数或小时数
    const total = end.diff(start, unit === "day" ? "hour" : "day") + 1;
    // 计算已经过去的天数或小时数
    let passed = now.diff(start, unit === "day" ? "hour" : "day");
    if (unit === "week") {
      passed = (passed + 6) % 7;
    }
    const remaining = total - passed;
    const percentage = (passed / total) * 100;
    // 返回数据
    return {
      name: dayText[unit],
      total: total,
      passed: passed,
      remaining: remaining,
      percentage: percentage.toFixed(2),
    };
  };
  return {
    day: getDifference("day"),
    week: getDifference("week"),
    month: getDifference("month"),
    year: getDifference("year"),
  };
};

// 欢迎提示
export const helloInit = (store) => {
  const hour = new Date().getHours();
  let hello: string | null = null;
  let hellosound: string | null = null;
  stopSpeech();
  if (hour < 5) {
    hello = i18n.global.t('utils.time.greetings.lateNight1');
    hellosound = "欢迎1.mp3";
  } else if (hour < 7) {
    hello = i18n.global.t('utils.time.greetings.morning1');
    hellosound = "欢迎2.mp3";
  } else if (hour < 9) {
    hello = i18n.global.t('utils.time.greetings.morning2');
    hellosound = "欢迎3.mp3";
  } else if (hour < 11) {
    hello = i18n.global.t('utils.time.greetings.forenoon');
    hellosound = "欢迎4.mp3";
  } else if (hour < 14) {
    hello = i18n.global.t('utils.time.greetings.noon');
    hellosound = "欢迎5.mp3";
  } else if (hour < 17) {
    hello = i18n.global.t('utils.time.greetings.afternoon');
    hellosound = "欢迎6.mp3";
  } else if (hour < 18) {
    hello = i18n.global.t('utils.time.greetings.dusk');
    hellosound = "欢迎7.mp3";
  } else if (hour < 22) {
    hello = i18n.global.t('utils.time.greetings.evening');
    hellosound = "欢迎8.mp3";
  } else if (hour < 23) {
    hello = i18n.global.t('utils.time.greetings.lateNight2');
    hellosound = "欢迎9.mp3";
  } else {
    hello = i18n.global.t('utils.time.greetings.lateNight3');
    hellosound = "欢迎10.mp3";
  };
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: `<strong>${hello}</strong> ${i18n.global.t('utils.time.welcome')}`,
  });
  if (store.webSpeech) {
    SpeechLocal(hellosound);
  };
};

// 建站日期统计
export const siteDateStatistics = (startDate) => {
  const currentDate = new Date();
  let years = currentDate.getFullYear() - startDate.getFullYear();
  let months = currentDate.getMonth() - startDate.getMonth();
  let days = currentDate.getDate() - startDate.getDate();

  // 如果天数或月份为负数，则调整天数和月份
  if (days < 0) {
    months--;
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return [years, months, days];
};
