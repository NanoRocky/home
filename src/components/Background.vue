<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img v-show="store.imgLoadStatus" :src="bgUrl" class="bg" alt="cover" @load="imgLoadComplete"
      @error.once="imgLoadError" @animationend="imgAnimationEnd" />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a v-if="store.backgroundShow && store.coverType != '3'" class="down" target="_blank">
        已禁用
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import initSnowfall from "@/utils/season/snow";
import initFirefly from "@/utils/season/firefly";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);
let bgImageCount = 38;  // 默认值，防止没有加载 JSON 文件时出错

// 加载 config.json
fetch('https://file.nanorocky.top/home/images/config.json')
  .then(response => response.json())
  .then(data => {
    bgImageCount = data.bgImageCount;  // 更新 bgImageCount 为 JSON 中的值
  })
  .catch(error => {
    console.error('无法加载壁纸配置文件:', error);
  });

// 壁纸随机数
const bgRandom = Math.floor(Math.random() * bgImageCount + 1);

// 更换壁纸链接
const changeBg = (type) => {
  if (type == 0) {
    bgUrl.value = `https://file.nanorocky.top/home/images/background${bgRandom}.webp`;
  } else if (type == 1) {
    bgUrl.value = "https://uapis.cn/api/imgapi/furry/img4k.php";
  } else if (type == 2) {
    bgUrl.value = "https://img.moehu.org/pic.php?id=pc";
  } else if (type == 3) {
    bgUrl.value = "https://img.moehu.org/pic.php?id=kemonomimi";
  } else if (type == 4) {
    bgUrl.value = "https://img.moehu.org/pic.php?id=gqbz";
  } else if (type == 5) {
    bgUrl.value = "https://uapis.cn/api/bing.php?rand=true";
  };
};

// 图片加载完成
const imgLoadComplete = () => {
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
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  ElMessage({
    message: "壁纸加载失败惹喵...已临时切换回默认！",
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  bgUrl.value = `https://file.nanorocky.top/home/images/background${bgRandom}.webp`;
  if (store.webSpeech) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("壁纸加载失败.mp3");
  };
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(value);
  },
);

const SeasonStyle = async () => {
  if (store.seasonalEffects) {
    const month = new Date().getMonth() + 1; // 当前月份，1-12
    if ([12, 1, 2].includes(month)) {
      initSnowfall();
    };
    if ([1, 2].includes(month)) {
      await import("@/utils/season/lantern");
    };
    if ([7, 8, 9].includes(month)) {
      initFirefly();
    };
  };
};

onMounted(async () => {
  // 加载壁纸
  changeBg(store.coverType);
  // 加载季节特效
  SeasonStyle();
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
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

    &.hidden {
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
