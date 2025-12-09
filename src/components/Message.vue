<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo -->
    <div class="logo">
      <img class="logo-img" :src="siteLogo" alt="logo" />
      <div :class="{ name: true, 'text-truncate-ellipsis': true, long: siteUrl[0].length >= 6 }">
        <span class="bg">{{ siteUrl[0] }}</span>
        <span class="sm" v-if="siteUrl[1]">.{{ siteUrl[1] }}</span>
      </div>
    </div>
    <!-- 简介 -->
    <div class="description cards" @click="changeBox">
      <div class="content">
        <Icon size="16">
          <QuoteLeft />
        </Icon>
        <Transition name="fade" mode="out-in">
          <div :key="descriptionText.hello + descriptionText.text" class="text">
            <p>{{ descriptionText.hello }}</p>
            <p>{{ descriptionText.text }}</p>
          </div>
        </Transition>
        <Icon size="16">
          <QuoteRight />
        </Icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@vicons/utils";
import { QuoteLeft, QuoteRight } from "@vicons/fa";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";

const store = mainStore();

// 主页站点logo
const siteLogo = envConfig.VITE_SITE_MAIN_LOGO;

// 站点链接
const siteUrl = computed(() => {
  let mns: string | null = null;
  if (store.msgNameShow) {
    mns = envConfig.VITE_SITE_MAIN_NAME || envConfig.VITE_SITE_URL || "imsyy.top";
  } else {
    mns = envConfig.VITE_SITE_URL || "imsyy.top";
  }

  const url = mns;
  if (!url) return ["imsyy", "top"];

  // 判断是否包含点号（如果是域名，通常包含点）
  if (url.includes('.')) {
    let urlFormat = url;
    // 去除协议前缀
    urlFormat = urlFormat.replace(/^(https?:\/\/)/, "");
    const domainOnly = urlFormat.split('/')[0];
    const hostname = domainOnly.split(':')[0];
    return hostname.split(".");
  } else {
    // 如果是纯名称（无点号），直接返回数组的第一项，第二项为 null
    return [url, ""];
  }
});

// 简介区域文字
const descriptionText = reactive({
  hello: envConfig.VITE_DESC_HELLO,
  text: envConfig.VITE_DESC_TEXT,
});

// 切换右侧功能区
const changeBox = () => {
  if ((store.getInnerWidth ?? 0) >= 721) {
    store.boxOpenState = !store.boxOpenState;
  } else {
    ElMessage({
      message: "当前显示分辨率不足以打开拓展盒子啦qwq【这么“小”还想开impart！（bushi）】",
      grouping: true,
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("分辨率不足.mp3");
    };
  };
};

// 监听状态变化
watch(
  () => store.boxOpenState,
  (value) => {
    if (value) {
      descriptionText.hello = envConfig.VITE_DESC_HELLO_OTHER;
      descriptionText.text = envConfig.VITE_DESC_TEXT_OTHER;
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("惊讶.mp3");
      };
    } else {
      descriptionText.hello = envConfig.VITE_DESC_HELLO;
      descriptionText.text = envConfig.VITE_DESC_TEXT;
    };
  },
);
</script>

<style lang="scss" scoped>

/* 1.在此处引入你的本地字体 */
/* 请将 '你的中文字体文件名.ttf' 修改为你 public/font/ 文件夹下的实际文件名 */
//@font-face {
  //font-family: 'MyCustomChineseFont';
  //src: url('/font/ZcoolKuaiLe.ttf'); 
  //font-display: swap;
//}

.message {
  .logo {
    display: flex;
    flex-direction: row;
    align-items: center;
    animation: fade 0.5s;
    max-width: 460px;
    color: rgba(245, 245, 245, 1);

    .logo-img {
      border-radius: 50%;
      width: 120px;
    }

    .name {
      width: 100%;
      padding-left: 22px;
      transform: translateY(-8px);
      /* 2.修改字体栈：优先使用英文手写体，如果遇到中文则使用你的本地中文字体 */
      font-family: "Pacifico-Regular", "ZcoolKuaiLe";

      .bg {
        font-size: 5rem;
        color: rgba(245, 245, 245, 1);
      }

      .sm {
        margin-left: 6px;
        font-size: 2rem;
        color: rgba(255, 240, 245, 1);

        @media (min-width: 721px) and (max-width: 789px) {
          display: none;
        }
      }
    }

    @media (max-width: 768px) {
      .logo-img {
        width: 100px;
      }

      .name {
        height: 128px;

        .bg {
          font-size: 4.5rem;
        }
      }
    }

    @media (max-width: 720px) {
      max-width: 100%;
    }
  }

  .description {
    padding: 1rem;
    margin-top: 3.5rem;
    max-width: 460px;
    animation: fade 0.5s;

    .content {
      display: flex;
      justify-content: space-between;

      .text {
        margin: 0.75rem 1rem;
        line-height: 2rem;
        margin-right: auto;
        transition: opacity 0.2s;

        p {
          &:nth-of-type(1) {
            /* 简介里的 Hello 文字也应用同样的混合字体逻辑 */
            font-family: "Pacifico-Regular", "ZcoolKuaiLe";
          }
        }
      }

      .xicon:nth-of-type(2) {
        align-self: flex-end;
      }
    }

    @media (max-width: 720px) {
      max-width: 100%;
      pointer-events: none;
    }
  }
  
  // @media (max-width: 390px) {
  //   .logo {
  //     flex-direction: column;
  //     .logo-img {
  //       display: none;
  //     }
  //     .name {
  //       margin-left: 0;
  //       height: auto;
  //       transform: none;
  //       text-align: center;
  //       .bg {
  //         font-size: 3.5rem;
  //       }
  //       .sm {
  //         font-size: 1.4rem;
  //       }
  //     }
  //   }
  //   .description {
  //     margin-top: 2.5rem;
  //   }
  // }
}
</style>
