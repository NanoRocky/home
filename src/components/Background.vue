<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <!-- 当前壁纸层 -->
    <img v-show="store.imgLoadStatus" :src="currentBgUrl" :class="['bg', 'current', { 'blur-out': isTransitioning }]"
      alt="cover" @load="imgLoadComplete" @error.once="imgLoadError" @animationend="imgAnimationEnd" />
    <!-- 新壁纸层 -->
    <img v-if="isTransitioning" :src="nextBgUrl" :class="['bg', 'next', { 'blur-in': isBlurringIn }]" alt="cover" />
    <div :class="store.backgroundShow ? 'gray o-hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a v-if="store.backgroundShow" class="down" target="_blank">
        已禁用
      </a>
    </Transition>
  </div>
</template>

<script setup lang="js">
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { initSnowfall, closeSnowfall } from "@/utils/season/snow";
import { initFirefly, closeFirefly } from "@/utils/season/firefly";
import { initLantern, closeLantern } from "@/utils/season/lantern";
import { ref, h, nextTick } from 'vue';
import { gasC } from "@/utils/authServer";

const store = mainStore();
const currentBgUrl = ref(null);
const nextBgUrl = ref(null);
const isTransitioning = ref(false);
const isBlurringIn = ref(false);
const imgTimeout = ref(null);
const autoBGSwitchTimer = ref(null); // 定时切换定时器
const emit = defineEmits(["loadComplete", "imageLoaded"]);
const key = envConfig.VITE_SFILE_SKEY;
const isLoading = ref(false);

// 自定义壁纸
// 酪灰的小批注：这里增加了从配置文件读取壁纸数的功能，使得在增加壁纸时不需要重新编译项目，只需修改这个 json 文件内的值
// 设置一个默认值，防止在无法加载 JSON 文件时壁纸失效。应该尽量保证壁纸数始终不小于这个默认值
let bgImageCount = 24; // PC 版壁纸
let bgImageCountP = 24; // 移动版壁纸
let bgRandom = 0;
let bgRandomp = 0;
let confUrlS = null;
let sest = 0;
let sBGCountN = null;

// 加载 config.json
async function loadConfig() {
  try {
    if (key) {
      const confUrl = "https://filep.nanorocky.top/home/images/config.json";
      confUrlS = await gasC(confUrl, key);
    } else {
      confUrlS = "https://filep.nanorocky.top/home/images/config.json";
    };
    const response = await fetch(confUrlS);
    const data = await response.json();
    bgImageCount = Math.max(data.bgImageCount, 1);
    bgImageCountP = Math.max(data.bgImageCountP, 1);
    if (sBGCountN != null && sBGCountN <= bgImageCount && sBGCountN > 0) {
      bgRandom = sBGCountN;
      bgRandomp = sBGCountN;
      sBGCountN = null;
      return true;
    } else {
      bgRandom = Math.floor(Math.random() * bgImageCount + 1);
      bgRandomp = Math.floor(Math.random() * bgImageCountP + 1);
      sBGCountN = null;
      return true;
    };
  } catch (error) {
    console.error('无法加载壁纸配置文件:', error);
    bgRandom = Math.floor(Math.random() * bgImageCount + 1);
    bgRandomp = Math.floor(Math.random() * bgImageCountP + 1);
    sBGCountN = null;
    return true;
  };
};

// 检测设备类型
const detectDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|windows phone/.test(userAgent)) {
    if (/ipad|tablet|playbook|silk|kindle/.test(userAgent)) {
      return 'tablet'; // 平板
    } else {
      return 'mobile'; // 手机
    };
  } else {
    return 'pc'; // PC
  };
};

const getLocalBgUrl = async (deviceType) => {
  // 这里指定了所有自定义背景的文件格式,必须统一。可以自定义修改,比如 webp 或 png
  // 酪灰的小批注:这里添加了设备类型识别以加载不同分辨率的壁纸
  if (deviceType === 'mobile') {
    if (key) {
      const bgUrlS = `https://filep.nanorocky.top/home/images/phone/backgroundphone${bgRandomp}.webp`;
      return await gasC(bgUrlS, key);
    } else {
      return `https://filep.nanorocky.top/home/images/phone/backgroundphone${bgRandomp}.webp`;
    };
  } else if (deviceType === 'tablet' || deviceType === 'pc') {
    if (key) {
      const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
      return await gasC(bgUrlS, key);
    } else {
      return `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
    };
  } else {
    if (key) {
      const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
      return await gasC(bgUrlS, key);
    } else {
      return `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
    };
  };
};

// 更换壁纸链接
const changeBg = async (type) => {
  if (isLoading.value) return;
  isLoading.value = true;
  (async () => {
    try {
      const configLoaded = await loadConfig();
      const deviceType = await detectDevice();
      if (!configLoaded) return;
      let newBgUrl = null;
      if (type == 0) {
        newBgUrl = await getLocalBgUrl(deviceType);
      } else if (type == 1) {
        if (deviceType === 'mobile') {
          const bgfmRandom = Math.floor(Math.random() * 2 + 1);
          if (bgfmRandom == 1) {
            newBgUrl = `https://uapis.cn/api/imgapi/furry/imgs4k.php`;
          } else {
            newBgUrl = `https://uapis.cn/api/imgapi/furry/szs8k.php`;
          };
        } else if (deviceType === 'tablet' || deviceType === 'pc') {
          newBgUrl = "https://uapis.cn/api/imgapi/furry/img4k.php";
        } else {
          newBgUrl = "https://uapis.cn/api/imgapi/furry/img4k.php";
        };
      } else if (type == 2) {
        if (deviceType === 'mobile') {
          newBgUrl = `https://img.moehu.org/pics.php?id=sjpic`;
        } else if (deviceType === 'tablet' || deviceType === 'pc') {
          newBgUrl = `https://img.moehu.org/pic.php?id=pc`;
        } else {
          newBgUrl = `https://img.moehu.org/pic.php?id=pc`;
        };
      } else if (type == 3) {
        newBgUrl = "https://img.moehu.org/pic.php?id=kemonomimi";
      } else if (type == 4) {
        newBgUrl = "https://img.moehu.org/pic.php?id=gqbz";
      } else if (type == 5) {
        newBgUrl = "https://uapis.cn/api/bing.php?rand=true";
      };
      // 预加载新壁纸
      const result = await preloadImage(newBgUrl);
      if (!result.ok) {
        console.error("壁纸加载失败");
        ElMessage({
          message: "壁纸加载失败惹喵...已临时切换回默认！",
          icon: h(Error, {
            theme: "filled",
            fill: "var(--el-message-icon-color)",
          }),
        });
        newBgUrl = await getLocalBgUrl(deviceType);
        if (!currentBgUrl.value) {
          currentBgUrl.value = newBgUrl;
        } else {
          performTransition(newBgUrl);
        };
        if (store.webSpeech) {
          stopSpeech();
          const voice = envConfig.VITE_TTS_Voice;
          const vstyle = envConfig.VITE_TTS_Style;
          SpeechLocal("壁纸加载失败.mp3");
        };
      };
    } finally {
      isLoading.value = false;
    };
  })();
};

// 预加载图片并执行过渡动画
const preloadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 图片加载完成后,执行过渡动画
      performTransition(url);
      resolve({ ok: true });
    };
    img.onerror = () => {
      resolve({ ok: false });
    };
    img.src = url;
  });
};

// 执行过渡动画
const performTransition = async (newUrl) => {
  // 如果是第一次加载,直接设置
  if (!currentBgUrl.value) {
    currentBgUrl.value = newUrl;
    return;
  }

  // 开始过渡
  nextBgUrl.value = newUrl;
  isTransitioning.value = true;
  isBlurringIn.value = false;

  // 等待DOM更新,确保新图层已渲染但保持初始模糊状态
  await nextTick();

  // 稍微延迟后开始淡入动画,确保初始状态已应用
  setTimeout(() => {
    isBlurringIn.value = true;
  }, 30);

  // 等待过渡完全完成后再切换 (1.6s transform是最长的，再加100ms缓冲)
  setTimeout(() => {
    currentBgUrl.value = newUrl;
    isTransitioning.value = false;
    isBlurringIn.value = false;
    nextBgUrl.value = null;
  }, 1700);
};


// 图片加载完成
const imgLoadComplete = (event) => {
  emit("imageLoaded", event.target);
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = async () => {
  console.error("壁纸加载失败：", currentBgUrl.value);
  ElMessage({
    message: "壁纸加载失败惹喵...已临时切换回默认！",
    icon: h(Error, {
      theme: "filled",
      fill: "var(--el-message-icon-color)",
    }),
  });
  if (key) {
    const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
    currentBgUrl.value = await gasC(bgUrlS, key);
  } else {
    currentBgUrl.value = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
  };
  if (store.webSpeech) {
    stopSpeech();
    const voice = envConfig.VITE_TTS_Voice;
    const vstyle = envConfig.VITE_TTS_Style;
    SpeechLocal("壁纸加载失败.mp3");
  };
};

// 监听壁纸切换
watch(
  () => store.coverType,
  async (value) => {
    await changeBg(Number(value));
  },
  { immediate: true }
);

const SeasonStyle = async (type, state, where) => {
  const month = new Date().getMonth() + 1; // 当前月份，1-12
  if (type == 0) {
    if (sest == 1 && state == true && where == 'normal') return;
    if ([12, 1, 2].includes(month)) {
      if (state == true) {
        initSnowfall();
      } else if (state == false) {
        closeSnowfall();
      } else {
        return;
      };
    };
    if ([1, 2].includes(month)) {
      if (state == true) {
        initLantern();
      } else if (state == false) {
        closeLantern();
      } else {
        return;
      };
    };
    if ([7, 8, 9].includes(month)) {
      if (state == true) {
        initFirefly();
      } else if (state == false) {
        closeFirefly();
      } else {
        return;
      };
    };
  } else if (type == 1) {
    if (state == true) {
      initSnowfall();
    } else if (state == false) {
      closeSnowfall();
    } else {
      return;
    };
  } else if (type == 2) {
    if (state == true) {
      initLantern();
    } else if (state == false) {
      closeLantern();
    } else {
      return;
    };
  } else if (type == 3) {
    if (state == true) {
      initFirefly();
    } else if (state == false) {
      closeFirefly();
    } else {
      return;
    };
  } else {
    return;
  };
  sest = 1;
};

// 定时切换壁纸功能
const setupAutoSwitch = () => {
  if (autoBGSwitchTimer.value) {
    clearInterval(autoBGSwitchTimer.value);
    autoBGSwitchTimer.value = null;
  };

  // 获取定时切换设置值
  const switchMode = store.autoBGSwitchInterval || 0;

  // 根据模式设置间隔时间（毫秒）
  const intervals = {
    0: 0,      // 不自动切换
    1: 15000,   // 15秒
    2: 30000,  // 30秒
    3: 45000   // 45秒
  };
  const interval = intervals[switchMode];
  if (interval === 0) {
    return;
  };

  const switchBackground = async () => {
    if (isLoading.value) return;
    bgRandom = Math.floor(Math.random() * bgImageCount + 1);
    bgRandomp = Math.floor(Math.random() * bgImageCountP + 1);
    sBGCountN = null;
    await changeBg(Number(store.coverType));
  };

  // 启动定时器
  autoBGSwitchTimer.value = setInterval(switchBackground, interval);
};

onMounted(async () => {
  // 加载壁纸
  await changeBg(Number(store.coverType));
  // 加载季节特效
  if (store.seasonalEffects) { await SeasonStyle(0, true, 'normal') } else { sest = 1 };
  // 启动定时切换
  setupAutoSwitch();
});

onBeforeUnmount(() => {
  if (imgTimeout.value) {
    clearTimeout(imgTimeout.value);
  };
  if (autoBGSwitchTimer.value) {
    clearInterval(autoBGSwitchTimer.value);
  };
});

watch(() => store.seasonalEffects, async (value) => {
  if (sest == 0) return;
  if (value) {
    await SeasonStyle(0, true, 'userChange');
  } else {
    await SeasonStyle(0, false, 'userChange');
    await SeasonStyle(1, false, 'userChange');
    await SeasonStyle(2, false, 'userChange');
    await SeasonStyle(3, false, 'userChange');
  };
});

watch(() => store.sBGCount, async (value) => {
  if (store.coverType != 0 || value == null || value == 0) return;
  sBGCountN = value;
  await changeBg(Number(store.coverType));
  store.setSBGCount(null);
});

watch(() => store.autoBGSwitchInterval, () => {
  setupAutoSwitch();
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(20px) brightness(0.3);
    transform: scale(1);
    will-change: filter, opacity, transform;
    transition:
      filter 1.4s cubic-bezier(0.25, 0.1, 0.25, 1),
      opacity 1.4s cubic-bezier(0.33, 0, 0.2, 1),
      transform 1.6s cubic-bezier(0.22, 0.61, 0.36, 1);

    &.current {
      animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      animation-delay: 0.45s;

      &.blur-out {
        filter: blur(50px) brightness(0.25);
        opacity: 0;
        transform: scale(1.05);
      }
    }

    &.next {
      filter: blur(50px) brightness(0.25);
      opacity: 0;
      transform: scale(1.08);
      animation: none;
      z-index: 2;

      &.blur-in {
        filter: blur(20px) brightness(0.3);
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);

    transition: 1.5s;

    &.o-hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }

  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }

    &:active {
      transform: scale(1);
    }
  }
}
</style>