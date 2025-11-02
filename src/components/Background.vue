<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img v-show="store.imgLoadStatus" :src="bgUrl" class="bg" alt="cover" @load="imgLoadComplete"
      @error.once="imgLoadError" @animationend="imgAnimationEnd" crossorigin="anonymous" />
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
import { ref, h } from 'vue';
import { gasC } from "@/utils/authServer";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
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

// 更换壁纸链接
const changeBg = async (type) => {
  if (isLoading.value) return;
  isLoading.value = true;
  (async () => {
    try {
      const configLoaded = await loadConfig();
      const deviceType = await detectDevice();
      if (!configLoaded) return;
      if (type == 0) {
        // 这里指定了所有自定义背景的文件格式，必须统一。可以自定义修改，比如 webp 或 png
        // 酪灰的小批注：这里添加了设备类型识别以加载不同分辨率的壁纸
        if (deviceType === 'mobile') {
          if (key) {
            const bgUrlS = `https://filep.nanorocky.top/home/images/phone/backgroundphone${bgRandomp}.webp`;
            bgUrl.value = await gasC(bgUrlS, key);
          } else {
            bgUrl.value = `https://filep.nanorocky.top/home/images/phone/backgroundphone${bgRandomp}.webp`;
          };
        } else if (deviceType === 'tablet' || deviceType === 'pc') {
          if (key) {
            const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
            bgUrl.value = await gasC(bgUrlS, key);
          } else {
            bgUrl.value = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
          };
        } else {
          if (key) {
            const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
            bgUrl.value = await gasC(bgUrlS, key);
          } else {
            bgUrl.value = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
          };
        };
      } else if (type == 1) {
        if (deviceType === 'mobile') {
          const bgfmRandom = Math.floor(Math.random() * 2 + 1);
          if (bgfmRandom == 1) {
            bgUrl.value = `https://uapis.cn/api/imgapi/furry/imgs4k.php`;
          } else {
            bgUrl.value = `https://uapis.cn/api/imgapi/furry/szs8k.php`;
          };
        } else if (deviceType === 'tablet' || deviceType === 'pc') {
          bgUrl.value = "https://uapis.cn/api/imgapi/furry/img4k.php";
        } else {
          bgUrl.value = "https://uapis.cn/api/imgapi/furry/img4k.php";
        };
      } else if (type == 2) {
        if (deviceType === 'mobile') {
          bgUrl.value = `https://img.moehu.org/pics.php?id=sjpic`;
        } else if (deviceType === 'tablet' || deviceType === 'pc') {
          bgUrl.value = `https://img.moehu.org/pic.php?id=pc`;
        } else {
          bgUrl.value = `https://img.moehu.org/pic.php?id=pc`;
        };
      } else if (type == 3) {
        bgUrl.value = "https://img.moehu.org/pic.php?id=kemonomimi";
      } else if (type == 4) {
        bgUrl.value = "https://img.moehu.org/pic.php?id=gqbz";
      } else if (type == 5) {
        bgUrl.value = "https://uapis.cn/api/bing.php?rand=true";
      };
    } finally {
      isLoading.value = false;
    };
  })();
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
  console.error("壁纸加载失败：", bgUrl.value);
  ElMessage({
    message: "壁纸加载失败惹喵...已临时切换回默认！",
    icon: h(Error, {
      theme: "filled",
      fill: "var(--el-message-icon-color)",
    }),
  });
  if (key) {
    const bgUrlS = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
    bgUrl.value = await gasC(bgUrlS, key);
  } else {
    bgUrl.value = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
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
    } else if ([1, 2].includes(month)) {
      if (state == true) {
        initLantern();
      } else if (state == false) {
        closeLantern();
      } else {
        return;
      };
    } else if ([7, 8, 9].includes(month)) {
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

onMounted(async () => {
  // 加载壁纸
  await changeBg(Number(store.coverType));
  // 加载季节特效
  if (store.seasonalEffects) { await SeasonStyle(0, true, 'normal') } else { sest = 1 };
});

onBeforeUnmount(() => {
  if (imgTimeout.value) {
    clearTimeout(imgTimeout.value);
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
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
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
