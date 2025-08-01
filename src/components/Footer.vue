<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <Transition name="fade" mode="out-in">
      <div v-if="!store.playerState || !store.playerLrcShow" class="power">
        <span>
          <span :class="ShowStartYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="ShowStartYear" class="site-start">
            {{ startYear }}
            -
          </span>
          {{ fullYear }}
          <a href="https://nanorocky.top/">{{ siteAuthor }}</a>
        </span>
        <!-- 以下信息请不要修改哦 -->
        <span class="hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">
            {{ config.author }}
          </a>
        </span>
        <!-- 站点备案 -->
        <span>
          <a v-if="siteIcp" href="https://beian.miit.gov.cn" target="_blank">
            &amp;&nbsp; {{ siteIcp }}
          </a>
          <!-- 这备那备的真的很扫（bushi） -->
          <a v-if="siteMps" href="https://beian.mps.gov.cn" target="_blank">
            &amp;&nbsp;{{ siteMps }}
          </a>
          <!-- 不妨碍再整个活儿 -->
          <a v-if="siteMICP" href="https://icp.gov.moe/?keyword=20257739" target="_blank">
            &amp;&nbsp;{{ siteMICP }}
          </a>
        </span>
      </div>
      <div v-else class="lrc" @dblclick="toggleForceIcon">
        <!-- 音乐进度条 -->
        <ProgressBar v-if="store.footerProgressBar" />
        <Transition name="fade" mode="out-in" :id="`lrc-line-${store.playerLrc[0][2]}`"
          v-if="!(!store.dwrcEnable || store.dwrcTemp.length == 0 || store.dwrcLoading)">
          <!-- &amp; -->
          <!-- 逐字模块山 -->
          <div class="lrc-all"
            :key="store.playerLrc.length != 0 ? `lrc-line-${store.playerLrc[0][2]}` : `lrc-line-null`">
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
            &nbsp;
            <Icon size="20" style="transform: rotate(-18deg);" class="paws-1" color="var(--footer-music-paw-icon-color)">
              <paw />
            </Icon>
            <span class="dwrc-box">
              <span class="dwrc-2 lrc-text text-hidden" id="dwrc-2-wrap">
                <span v-for="(i, index) in store.playerLrc" :key="`lrc-over-char-${i[2]}-${i[3]}`" v-html="i[4]">
                </span>
              </span>
              <span class="dwrc-1 lrc-text text-hidden" id="dwrc-1-wrap">
                <span v-for="(i, index) in store.playerLrc" :key="`lrc-char-${i[2]}-${i[3]}`" :class="[
                  'dwrc-char',
                  i[0] && Number(i[6]) > 0 ? 'fade-in' : 'fade-in-start',
                  i[0] && Number(i[5]) > 1019 && Number(i[6]) > 0 ? 'long-tone' : 'fade-in-start',
                  i[0] && Number(i[6]) <= 0 ? 'fade-out' : '',
                  i[1] ? 'dwrc-style-s2' : 'dwrc-style-s1'
                ]" :id="`lrc-char-${i[2]}-${i[3]}`" v-html="i[4]">
                </span>
              </span>
            </span>
            <Icon size="20" style="transform: rotate(18deg);" class="paws-2" color="var(--footer-music-paw-icon-color)">
              <paw />
            </Icon>
            &nbsp;
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
          </div>
        </Transition>
        <Transition name="fade" mode="out-in" v-else>
          <!-- 逐行模块 -->
          <div class="lrc-all" :key="store.getPlayerLrc.length > 0 ?
            `lrc-${store.getPlayerLrc[0][2]}-${store.getPlayerLrc.length}` : '猫猫正在翻找歌词...'">
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
            &nbsp;
            <Icon size="20" style="transform: rotate(-18deg);" class="paws-3" color="var(--footer-music-paw-icon-color)">
              <paw />
            </Icon>
            <span class="lrc-text text-hidden" v-html="store.getPlayerLrc[0][4]" :class="`lrc-char`" />
            <Icon size="20" style="transform: rotate(18deg);" class="paws-4" color="var(--footer-music-paw-icon-color)">
              <paw />
            </Icon>
            &nbsp;
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup lang="ts">
import ProgressBar from "@/components/ProgressBar.vue";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { MusicOne } from "@icon-park/vue-next";
import { Icon } from "@vicons/utils";
import { Paw } from "@vicons/ionicons5";
import { mainStore } from "@/store";
import config from "@/../package.json";
import { ref, watch, computed, onMounted, nextTick, onUpdated, onBeforeUnmount } from "vue";
import { throttle } from "lodash";

const store = mainStore();
const fullYear = new Date().getFullYear();
const lrcContainer = ref(null);
const scrollPosition = ref(0);
const currentLine = ref(0);
const audio = ref(null);
const icon = ref(null);

// 加载配置数据
// const siteStartDate = ref(import.meta.env.VITE_SITE_START);
const startYear = ref<number | null>(
  import.meta.env.VITE_SITE_START?.length >= 4 ?
    parseInt(import.meta.env.VITE_SITE_START.substring(0, 4)) : null
);
const ShowStartYear = computed(() => {
  return startYear.value !== null && startYear.value < fullYear;
});
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteMps = ref(import.meta.env.VITE_SITE_MPS);
const siteMICP = ref(import.meta.env.VITE_SITE_MICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://nanorocky.top";
  // 判断协议前缀
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  };
  return url;
});

const toggleForceIcon = () => {
  store.forceShowBarIcon = !store.forceShowBarIcon;
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: `${store.forceShowBarIcon ? '诶？' : '进度 ICON 常驻已禁用'}`,
  });
  if (store.forceShowBarIcon) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("启用进度图标常驻.mp3");
  } else {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("禁用进度图标常驻.mp3");
  };
};

// dwrc part
watch(() => store.getPlayerLrc, (_new, _old) => {
  type DwrcItem = [number, number, any[]];
  const isLineByLine = !store.dwrcEnable || (store.dwrcTemp as DwrcItem[]).length === 0 || store.dwrcLoading;
  if (!store.playerDWRCShowPro || isLineByLine) {
    return;
  };
  const audio = document.querySelector('audio');
  if (!audio) {
    return;
  };
  const now = audio.currentTime * 1000;
  const dwrc2 = document.getElementsByClassName("dwrc-box")[0] as HTMLElement;
  if (!dwrc2 || dwrc2 == undefined) {
    return;
  };
  const outputDom = dwrc2.querySelectorAll("#dwrc-2-wrap span");
  const inputDom = dwrc2.querySelectorAll("#dwrc-1-wrap span");
  if (inputDom.length == 0 || outputDom.length == 0) {
    return;
  };
  const dwrcFiltered = (store.dwrcTemp as DwrcItem[]).filter(
    (i) => i[0] < now && now < i[0] + i[1]
  );
  if (dwrcFiltered.length == 0) {
    return;
  };
  const nowLine = dwrcFiltered[dwrcFiltered.length - 1][2];
  for (let i = 0; i < nowLine.length; i++) {
    const item = nowLine[i] as [[number, number], any, any, any];
    const [[start, duration], _a, _b, _c] = item;
    const inputItem = inputDom[i] as HTMLElement;
    if (!inputItem || inputItem.hasAttribute('data-start')) {
      return;
    };
    const computedStyle = window.getComputedStyle(inputItem);
    const width = parseFloat(computedStyle.width);
    if (isNaN(width)) {
      inputItem.removeAttribute('data-start');
      return;
    };
    const outputItem = outputDom[i] as HTMLElement;
    const animateOptions: KeyframeAnimationOptions = {
      delay: Math.max(0, start - now),
      duration: duration,
      fill: "forwards" as FillMode,
      easing: "linear",
    };
    outputItem.style.transform = "translateY(-1px)";
    const outputAnimate = outputItem.animate(
      [
        { width: 0 },
        { width: `${width}px` },
      ],
      animateOptions,
    );
    outputAnimate.onfinish = () => {
      outputItem.style.transform = "translateY(1px)";
      outputItem.animate(
        [
          { transform: "translateY(-1px)" },
          { transform: "translateY(1px)" },
        ],
        {
          duration: 300,
          fill: "forwards",
          easing: "linear",
        }
      );
    };
    inputItem.setAttribute("data-start", "true");
  };
});

</script>

<style lang="scss" scoped>
// 逐字模块1
.dwrc-char {
  display: inline-block;
  opacity: 0.6;
  -webkit-transform: translateY(1px);
  transform: translateY(1px);
  -webkit-background-clip: text;
  background-clip: text;
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear;

  &.fade-in-start {
    text-shadow: 0px 0px 2px var(--footer-dwrc-shadow-first-color);
    opacity: 0.6; // 初始显示的透明度
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-in {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: colorFade 0.7s ease-in-out forwards;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-out {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    text-shadow: 0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-enter-active {
    animation: float-up 0.3s linear forwards;
  }

  &.long-tone {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: pulse 1s ease-in-out forwards;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.dwrc-style-s1 {
    opacity: 0.6;
    color: var(--footer-dwrc-start-color);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.dwrc-style-s2 {
    opacity: 1;
    color: var(--footer-dwrc-end-color);
    text-shadow: 0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }
}

@keyframes float-up {
  from {
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
  }

  to {
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
  }
}

@keyframes colorFade {
  from {
    color: var(--footer-dwrc-start-color);
    opacity: 0.6;
    text-shadow: 0px 0px 3px var(--footer-dwrc-shadow-first-color),
      0px 0px 0px rgba(176, 224, 230, 1),
      0px 0px 0px rgba(230, 230, 250, 1);
  }

  to {
    color: var(--footer-dwrc-end-color);
    opacity: 1;
    text-shadow: 0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
  }
}

@keyframes pulse {
  from {
    color: var(--footer-dwrc-start-color);
    opacity: 0.6;
    text-shadow: 0px 0px 3px var(--footer-dwrc-shadow-first-color),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1);
  }

  to {
    color: var(--footer-dwrc-end-color);
    opacity: 1;
    text-shadow: 3px 3px 7px var(--footer-dwrc-shadow-first-color),
      0px 0px 4px rgba(255, 182, 193, 0.3),
      0px 0px 4px rgba(255, 192, 203, 0.3),
      0px 0px 8px rgba(255, 182, 193, 0.3),
      0px 0px 8px rgba(255, 192, 203, 0.3),
      0px 0px 12px rgba(255, 182, 193, 1),
      0px 0px 12px rgba(255, 192, 203, 1),
      0px 0px 16px rgba(255, 182, 193, 1),
      0px 0px 16px rgba(255, 192, 203, 1);
  }
}

// 逐字模块2
#dwrc-2-wrap>span {
  display: inline-block;
  transform: translateY(1px);
  white-space: nowrap;
  overflow: hidden;
  width: 0;
  opacity: 0.8;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear,
    width 0.3s linear;
}

#dwrc-2-wrap {
  display: inline-block;
  position: absolute;
  width: auto;
  opacity: 0.8;
  color: var(--footer-dwrc-two-color);
  text-shadow: 0 0 6px rgba(0, 191, 255, 0.8),
    0px 0px 2px rgba(176, 224, 230, 0.8),
    0px 0px 2px rgba(230, 230, 250, 0.8);
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  overflow: hidden;
  white-space: nowrap;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear,
    width 0.3s linear;
}

// 逐行部分
.lrc-char {
  display: inline;
  opacity: 1;
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--footer-dwrc-end-color);
  text-shadow: 0 0 6px var(--footer-dwrc-shadow-first-color),
    0 0 2px rgba(255, 165, 0, 1),
    0 0 2px rgba(255, 179, 71, 1);
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    opacity 0.3s linear,
    color 0.5s linear;
}

// End

#footer {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 1rem;
  // 文字不换行
  word-break: keep-all;
  white-space: nowrap;
  color: var(--footer-font-color);

  .power {
    animation: fade 0.3s;
  }

  .lrc {
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    z-index: 1;
    justify-content: flex-start;

    .lrc-all {
      width: 98%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      white-space: nowrap;

      .lrc-text {
        margin: 0 8px;
      }

      .i-icon {
        width: 18px;
        height: 18px;
        display: inherit;
      }

      .dwrc-box {
        justify-content: flex-start;
        position: relative;
        white-space: nowrap;
        align-items: center;
        width: auto;
        height: auto;
        z-index: 0;

        .dwrc-1,
        .dwrc-2 {
          white-space: nowrap;
        }

        .dwrc-1 {
          z-index: 1;
        }

        .dwrc-2 {
          position: absolute;
          z-index: 1000;
        }
      }
    }

    .lrc-container {
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 46px;
      white-space: nowrap;
    }

    .lrc-scroll {
      display: flex;
      transition: transform 0.3s ease;
    }

    .lrc-line {
      display: inline-block;
      padding: 0 10px;
      white-space: nowrap;
      font-size: 1.05rem;
      opacity: 0.6;
      transition: opacity 0.3s, color 0.3s;
    }

    .lrc-line.active {
      opacity: 1;
      color: #fff;
    }

    .lrc-line.played {
      color: #aaa;
    }
  }

  &.blur {
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    background: var(--footer-background-color);
    font-size: 1rem;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity 0.2s linear,
      transform 0.2s linear;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(2px);
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 720px) {
    font-size: 0.9rem;

    &.blur {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
