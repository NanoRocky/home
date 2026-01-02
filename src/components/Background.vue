<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img :class="['bg', { 'show-bg': bg1.show }]" :src="bg1.url" alt="cover" @load="imgLoadComplete(1, $event)"
      @error.once="imgLoadError(1)" @transitionend="imgAnimationEnd" crossorigin="anonymous" />
    <img :class="['bg', { 'show-bg': bg2.show }]" :src="bg2.url" alt="cover" @load="imgLoadComplete(2, $event)"
      @error.once="imgLoadError(2)" @transitionend="imgAnimationEnd" crossorigin="anonymous" />
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
import { ref, h, reactive } from 'vue';
import { gasC } from "@/utils/authServer";

const store = mainStore();

// 壁纸数据
const bg1 = reactive({
  url: '',
  show: false,
});
const bg2 = reactive({
  url: '',
  show: false,
});
// 当前显示的壁纸
let currentBg = 1;

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

  try {
    const configLoaded = await loadConfig();
    if (!configLoaded) return;

    const deviceType = detectDevice();
    let newBgUrl = '';

    // 根据类型和设备获取新的壁纸 URL
    if (type == 0) {
      if (deviceType === 'mobile') {
        newBgUrl = `https://filep.nanorocky.top/home/images/phone/backgroundphone${bgRandomp}.webp`;
      } else {
        newBgUrl = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
      }
      if (key) {
        newBgUrl = await gasC(newBgUrl, key);
      }
    } else if (type == 1) {
      if (deviceType === 'mobile') {
        const bgfmRandom = Math.floor(Math.random() * 2 + 1);
        newBgUrl = bgfmRandom === 1 ? 'https://uapis.cn/api/imgapi/furry/imgs4k.php' : 'https://uapis.cn/api/imgapi/furry/szs8k.php';
      } else {
        newBgUrl = "https://uapis.cn/api/imgapi/furry/img4k.php";
      }
    } else if (type == 2) {
      if (deviceType === 'mobile') {
        newBgUrl = 'https://img.moehu.org/pics.php?id=sjpic';
      } else {
        newBgUrl = 'https://img.moehu.org/pic.php?id=pc';
      }
    } else if (type == 3) {
      newBgUrl = "https://img.moehu.org/pic.php?id=kemonomimi";
    } else if (type == 4) {
      newBgUrl = "https://img.moehu.org/pic.php?id=gqbz";
    } else if (type == 5) {
      newBgUrl = "https://uapis.cn/api/bing.php?rand=true";
    }

    // 更新壁纸 URL
    if (currentBg === 1) {
      bg2.url = newBgUrl;
    } else {
      bg1.url = newBgUrl;
    }

  } catch (error) {
    console.error("更换壁纸链接时出错:", error);
    imgLoadError(currentBg === 1 ? 2 : 1);
  } finally {
    isLoading.value = false;
  }
};

// 图片加载完成
const imgLoadComplete = (bgIndex, event) => {
  if (imgTimeout.value) {
    clearTimeout(imgTimeout.value);
  }
  imgTimeout.value = setTimeout(() => {
    store.setImgLoadStatus(true);
    if (bgIndex === 1) {
      bg1.show = true;
      bg2.show = false;
      currentBg = 1;
    } else {
      bg2.show = true;
      bg1.show = false;
      currentBg = 2;
    }
  }, 300);
  emit("imageLoaded", event.target);
};

// 图片动画完成
const imgAnimationEnd = (event) => {
  // 确保是新图片（带有 'show-bg' 类）的 'opacity' 过渡完成时才触发
  if (event.target.classList.contains('show-bg') && event.propertyName === 'opacity') {
    console.log("壁纸动画完成");
    emit("loadComplete");
  }
};


// 图片显示失败
const imgLoadError = async (bgIndex) => {
  console.error("壁纸加载失败：", bgIndex === 1 ? bg1.url : bg2.url);
  ElMessage({
    message: "壁纸加载失败惹喵...已临时切换回默认！",
    icon: h(Error, {
      theme: "filled",
      fill: "var(--el-message-icon-color)",
    }),
  });

  let defaultBgUrl = `https://filep.nanorocky.top/home/images/background${bgRandom}.webp`;
  if (key) {
    defaultBgUrl = await gasC(defaultBgUrl, key);
  }

  if (bgIndex === 1) {
    bg1.url = defaultBgUrl;
  } else {
    bg2.url = defaultBgUrl;
  }

  if (store.webSpeech) {
    stopSpeech();
    SpeechLocal("壁纸加载失败.mp3");
  }
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(Number(value));
  }
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

onMounted(() => {
  // 初始化壁纸
  changeBg(Number(store.coverType));
  // 加载季节特效
  if (store.seasonalEffects) {
    SeasonStyle(0, true, 'normal');
  } else {
    sest = 1;
  }
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
    opacity: 0;
    transition: opacity 1.5s ease-in-out, filter 1.5s ease-in-out;

    &.show-bg {
      opacity: 1;
      filter: blur(0) brightness(1);
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
