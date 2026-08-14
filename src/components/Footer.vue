<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <Transition name="fade" mode="out-in">
      <div v-if="!store.playerState || !store.playerLrcShow" class="power">
        <span>
          <span :class="ShowStartYear ? 'c-hidden' : 'o-hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="ShowStartYear" class="site-start">
            {{ startYear }}
            -
          </span>
          {{ fullYear }}
          <a href="https://nanorocky.top/">{{ siteAuthor }}</a>
        </span>
        <!-- 以下信息请不要修改哦 -->
        <span class="o-hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">
            {{ config.author }}
          </a>
        </span>
        <span class="o-hidden">
          &amp;&nbsp;Update&nbsp;by
          <a :href="config.efug" target="_blank">
            {{ config.efua }}
          </a>
        </span>
        <!-- 站点备案 -->
        <span>
          <span v-if="siteIcp">
            &amp;&nbsp;
            <a v-if="siteIcp" href="https://beian.miit.gov.cn" target="_blank">
              {{ siteIcp }}
            </a>
          </span>
          <!-- 这备那备的真的很扫（bushi） -->
          <span v-if="siteMps">
            &amp;&nbsp;
            <a v-if="siteMps" href="https://beian.mps.gov.cn" target="_blank">
              {{ siteMps }}
            </a>
          </span>
          <!-- 不妨碍再整个活儿 -->
          <span v-if="siteMICP">
            &amp;&nbsp;
            <a v-if="siteMICP" href="https://icp.gov.moe/?keyword=20257739" target="_blank">
              {{ siteMICP }}
            </a>
          </span>
        </span>
      </div>
      <div v-else class="lrc" @dblclick="toggleForceIcon">
        <!-- 音乐进度条 -->
        <ProgressBar v-if="store.footerProgressBar" />
        <Transition
          name="fade"
          mode="out-in"
          :id="`lrc-line-${store.playerLrc[0][2]}`"
          v-if="!(!store.dwrcEnable || store.dwrcTemp.length == 0 || store.dwrcLoading)"
        >
          <!-- &amp; -->
          <!-- 逐字模块山 -->
          <div
            class="lrc-all"
            :key="
              store.playerLrc.length != 0
                ? `lrc-line-${store.playerLrc[0][2]}-${store.playerLrc.length}-${store.playerLrc[0][4]}-${store.lyricSeekVersion}`
                : `lrc-line-null`
            "
          >
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
            &nbsp;
            <Icon
              size="20"
              style="transform: rotate(-18deg)"
              class="paws-1"
              color="var(--footer-music-paw-icon-color)"
            >
              <paw />
            </Icon>
            <span class="dwrc-box">
              <span
                class="dwrc-2 lrc-text text-truncate-ellipsis"
                id="dwrc-2-wrap"
                :data-line="store.playerLrc[0]?.[2]"
              >
                <span
                  v-for="(i, index) in store.playerLrc"
                  :key="`lrc-over-char-${i[2]}-${i[3]}`"
                  :style="{ '--char-duration': i[5] + 'ms' }"
                  :class="[
                    'dwrc-2-char',
                    i[0] && Number(i[6]) > 0 ? 'fade-in' : 'fade-in-start',
                    i[0] && Number(i[5]) > 1019 && Number(i[6]) > 0 ? 'long-tone' : 'fade-in-start',
                    i[0] && Number(i[6]) <= 0 ? 'fade-out' : '',
                    i[0] && Number(i[5]) > 1019 && Number(i[6]) <= 0 ? 'long-tone-out' : '',
                  ]"
                  v-html="i[4]"
                >
                </span>
              </span>
              <span class="dwrc-1 lrc-text text-truncate-ellipsis" id="dwrc-1-wrap">
                <span
                  v-for="(i, index) in store.playerLrc"
                  :key="`lrc-char-${i[2]}-${i[3]}`"
                  :style="{ '--char-duration': i[5] + 'ms' }"
                  :class="[
                    'dwrc-char',
                    i[0] && Number(i[6]) > 0 ? 'fade-in' : 'fade-in-start',
                    i[0] && Number(i[5]) > 1019 && Number(i[6]) > 0 ? 'long-tone' : 'fade-in-start',
                    i[0] && Number(i[6]) <= 0 ? 'fade-out' : '',
                    i[0] && Number(i[5]) > 1019 && Number(i[6]) <= 0 ? 'long-tone-out' : '',
                    i[1] ? 'dwrc-style-s2' : 'dwrc-style-s1',
                  ]"
                  :id="`lrc-char-${i[2]}-${i[3]}`"
                  v-html="i[4]"
                >
                </span>
              </span>
            </span>
            <Icon
              size="20"
              style="transform: rotate(18deg)"
              class="paws-2"
              color="var(--footer-music-paw-icon-color)"
            >
              <paw />
            </Icon>
            &nbsp;
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
          </div>
        </Transition>
        <Transition name="fade" mode="out-in" v-else>
          <!-- 逐行模块 -->
          <div
            class="lrc-all"
            :key="
              store.getPlayerLrc.length > 0
                ? `lrc-${store.getPlayerLrc[0][2]}-${store.getPlayerLrc.length}`
                : $t('components.music.lrcSearching')
            "
          >
            <music-one theme="filled" size="18" fill="var(--footer-music-icon-color)" />
            &nbsp;
            <Icon
              size="20"
              style="transform: rotate(-18deg)"
              class="paws-3"
              color="var(--footer-music-paw-icon-color)"
            >
              <paw />
            </Icon>
            <span
              class="lrc-text text-truncate-ellipsis"
              v-html="store.getPlayerLrc[0][4]"
              :class="`lrc-char`"
            />
            <Icon
              size="20"
              style="transform: rotate(18deg)"
              class="paws-4"
              color="var(--footer-music-paw-icon-color)"
            >
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
import { useI18n } from "vue-i18n";
import { throttle } from "lodash-es";

const store = mainStore();
const fullYear = new Date().getFullYear();
const lrcContainer = ref(null);
const scrollPosition = ref(0);
const currentLine = ref(0);
const audio = ref(null);
const icon = ref(null);
const { locale, t } = useI18n();

// 加载配置数据
// const siteStartDate = ref(envConfig.VITE_SITE_START);
const startYear = ref<number | null>(
  envConfig.VITE_SITE_START?.length >= 4
    ? parseInt(envConfig.VITE_SITE_START.substring(0, 4))
    : null,
);
const ShowStartYear = computed(() => {
  return startYear.value !== null && startYear.value < fullYear;
});
const siteIcp = ref(envConfig.VITE_SITE_ICP);
const siteMps = ref(envConfig.VITE_SITE_MPS);
const siteMICP = ref(envConfig.VITE_SITE_MICP);
const siteAuthor =
  locale.value != "zh-CN" && envConfig.VITE_SITE_AUTHOR_EN
    ? envConfig.VITE_SITE_AUTHOR_EN || envConfig.VITE_SITE_AUTHOR || "nanorocky"
    : envConfig.VITE_SITE_AUTHOR || "nanorocky";

const siteUrl = computed(() => {
  const url = envConfig.VITE_SITE_URL;
  if (!url) return "https://nanorocky.top/";
  let fullUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    fullUrl = "https://" + url;
  }
  fullUrl = fullUrl.replace(/^http:\/\//i, "https://");
  try {
    const urlObj = new URL(fullUrl);
    return urlObj.toString();
  } catch (e) {
    return "https://nanorocky.top/";
  }
});

const toggleForceIcon = () => {
  store.forceShowBarIcon = !store.forceShowBarIcon;
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: `${store.forceShowBarIcon ? t("components.music.eh") : t("components.music.progressIconDisabled")}`,
  });
  if (store.forceShowBarIcon) {
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("启用进度图标常驻.mp3");
    }
  } else {
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("禁用进度图标常驻.mp3");
    }
  }
};

// dwrc part
watch(
  () => store.getPlayerLrc,
  (_new, _old) => {
    type DwrcItem = [number, number, any[]];
    const isLineByLine =
      !store.dwrcEnable || (store.dwrcTemp as DwrcItem[]).length === 0 || store.dwrcLoading;
    if (!store.playerDWRCShowPro || isLineByLine) {
      return;
    }
    const audio = document.querySelector("audio");
    const now = store.isDragging
      ? store.dragProgressTime * 1000
      : audio
        ? audio.currentTime * 1000
        : 0;
    const dwrc2 = document.getElementsByClassName("dwrc-box")[0] as HTMLElement;
    if (!dwrc2 || dwrc2 == undefined) {
      return;
    }
    const wrap2 = dwrc2.querySelector("#dwrc-2-wrap");
    if (wrap2 && wrap2.getAttribute("data-line") != store.getPlayerLrc[0][2]?.toString()) {
      return;
    }
    const outputDom = dwrc2.querySelectorAll("#dwrc-2-wrap span");
    const inputDom = dwrc2.querySelectorAll("#dwrc-1-wrap span");
    if (inputDom.length == 0 || outputDom.length == 0) {
      return;
    }

    for (let i = 0; i < store.getPlayerLrc.length; i++) {
      const lrcItem = store.getPlayerLrc[i] as any[];
      const start = Number(lrcItem[8]);
      const duration = Number(lrcItem[5]);
      if (lrcItem[8] === undefined || isNaN(start) || isNaN(duration)) return;

      const inputItem = inputDom[i] as HTMLElement;
      if (!inputItem) continue;

      if (store.isDragging) {
        inputItem.removeAttribute("data-start");
      } else if (!inputItem.hasAttribute("data-start")) {
        inputItem.setAttribute("data-start", "true");
      }

      const computedStyle = window.getComputedStyle(inputItem);
      const width = parseFloat(computedStyle.width);
      if (isNaN(width)) continue;

      const outputItem = outputDom[i] as HTMLElement;
      if (!outputItem) continue;

      if (now >= start + duration) {
        if (store.isDragging) outputItem.getAnimations().forEach((a) => a.cancel());
        outputItem.animate([{ width: `${width}px` }, { width: `${width}px` }], {
          duration: 0,
          fill: "forwards",
        });
      } else if (now >= start && now < start + duration) {
        const currentWidth = ((now - start) / duration) * width;
        if (store.isDragging) {
          outputItem.getAnimations().forEach((a) => a.cancel());
          outputItem.style.width = `${currentWidth}px`;
        } else {
          const remainingDuration = start + duration - now;
          outputItem.animate([{ width: `${currentWidth}px` }, { width: `${width}px` }], {
            duration: remainingDuration,
            fill: "forwards",
            easing: "linear",
          });
        }
      } else {
        if (store.isDragging) outputItem.getAnimations().forEach((a) => a.cancel());
        outputItem.animate([{ width: 0 }, { width: `${width}px` }], {
          delay: Math.max(0, start - now),
          duration: duration,
          fill: "forwards",
          easing: "linear",
        });
      }
    }
  },
);
</script>

<style lang="scss" scoped>
// 逐字模块1
.dwrc-char {
  --anim-time: var(--char-duration, 0.5s);
  --short-time: min(var(--char-duration, 0.3s), 0.3s);
  display: inline-block;
  opacity: 1;
  -webkit-transform: translateY(1px);
  transform: translateY(1px);
  -webkit-background-clip: text;
  background-clip: text;
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    opacity var(--short-time) linear,
    color var(--anim-time) linear,
    transform var(--short-time) linear;

  &.fade-in-start {
    text-shadow: 0px 0px 2px var(--footer-dwrc-shadow-first-color);
    opacity: 0.6; // 初始显示的透明度
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.fade-in {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: colorFade var(--anim-time) linear forwards;
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.fade-out {
    opacity: 1 !important;
    color: var(--footer-dwrc-end-color) !important;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    text-shadow:
      0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.fade-enter-active {
    animation: float-up var(--short-time) linear forwards;
  }

  &.long-tone {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: pulse 1.2s ease-in-out forwards !important;
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.long-tone-out {
    opacity: 1 !important;
    color: var(--footer-dwrc-end-color) !important;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    animation: pulse-out 0.7s ease-in-out forwards !important;
    animation-iteration-count: 1;
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.dwrc-style-s1 {
    opacity: 0.6;
    color: var(--footer-dwrc-start-color);
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
  }

  &.dwrc-style-s2 {
    opacity: 1;
    color: var(--footer-dwrc-end-color);
    text-shadow:
      0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
    transition:
      color var(--anim-time) linear,
      opacity var(--short-time) linear,
      transform var(--short-time) linear;
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

.lrc-all {
  position: relative;

  .paws-1,
  .paws-2,
  .paws-3,
  .paws-4 {
    flex-shrink: 0;
  }

  .paws-1 {
    transform: rotate(-18deg) translateY(-2px) !important;
  }
  .paws-2 {
    transform: rotate(18deg) translateY(-2px) !important;
  }
}

@keyframes colorFade {
  from {
    color: var(--footer-dwrc-start-color);
    opacity: 0.6;
    text-shadow:
      0px 0px 3px var(--footer-dwrc-shadow-first-color),
      0px 0px 0px rgba(176, 224, 230, 1),
      0px 0px 0px rgba(230, 230, 250, 1);
  }

  to {
    color: var(--footer-dwrc-end-color);
    opacity: 1;
    text-shadow:
      0px 0px 6px var(--footer-dwrc-shadow-first-color),
      0px 0px 2px rgba(176, 224, 230, 1),
      0px 0px 2px rgba(230, 230, 250, 1);
  }
}

@keyframes pulse {
  from {
    color: var(--footer-dwrc-start-color);
    opacity: 0.6;
    text-shadow:
      0px 0px 3px var(--footer-dwrc-shadow-first-color),
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
    text-shadow:
      3px 3px 7px var(--footer-dwrc-shadow-first-color),
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

@keyframes pulse-out {
  from {
    color: var(--footer-dwrc-end-color);
    opacity: 1;
    text-shadow:
      3px 3px 7px var(--footer-dwrc-shadow-first-color),
      0px 0px 4px rgba(255, 182, 193, 0.3),
      0px 0px 4px rgba(255, 192, 203, 0.3),
      0px 0px 8px rgba(255, 182, 193, 0.3),
      0px 0px 8px rgba(255, 192, 203, 0.3),
      0px 0px 12px rgba(255, 182, 193, 1),
      0px 0px 12px rgba(255, 192, 203, 1),
      0px 0px 16px rgba(255, 182, 193, 1),
      0px 0px 16px rgba(255, 192, 203, 1);
  }

  to {
    color: var(--footer-dwrc-start-color);
    opacity: 1;
    text-shadow:
      0px 0px 3px var(--footer-dwrc-shadow-first-color),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1);
  }
}

// 逐字模块2
.dwrc-2-char {
  --anim-time: var(--char-duration, 0.5s);
  --short-time: min(var(--char-duration, 0.3s), 0.3s);
  display: inline-block;
  -webkit-transform: translateY(1px);
  transform: translateY(1px);
  white-space: nowrap;
  overflow: hidden;
  width: 0;
  will-change: width, color, opacity;
  transition:
    opacity var(--short-time) linear,
    transform var(--short-time) linear,
    color var(--anim-time) linear;

  &.fade-in-start {
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
  }

  &.fade-in {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
  }

  &.fade-out {
    opacity: 1 !important;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
  }

  &.long-tone {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
  }

  &.long-tone-out {
    opacity: 1 !important;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
  }
}

#dwrc-2-wrap {
  --anim-time: var(--char-duration, 0.5s);
  --short-time: min(var(--char-duration, 0.3s), 0.3s);
  display: inline-block;
  position: absolute;
  left: 0;
  top: 0;
  width: auto;
  opacity: 0.8;
  color: var(--footer-dwrc-two-color);
  text-shadow:
    0 0 6px rgba(0, 191, 255, 0.8),
    0px 0px 2px rgba(176, 224, 230, 0.8),
    0px 0px 2px rgba(230, 230, 250, 0.8);
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  overflow: hidden;
  white-space: nowrap;
  transition:
    opacity var(--short-time) linear,
    transform var(--short-time) linear,
    color var(--anim-time) linear;
}

// 逐行部分
.lrc-char {
  --anim-time: var(--char-duration, 0.5s);
  --short-time: min(var(--char-duration, 0.3s), 0.3s);
  display: inline;
  opacity: 1;
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--footer-dwrc-end-color);
  text-shadow:
    0 0 6px var(--footer-dwrc-shadow-first-color),
    0 0 2px rgba(255, 165, 0, 1),
    0 0 2px rgba(255, 179, 71, 1);
  font-family: MiSans VF;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    opacity var(--short-time) linear,
    color var(--anim-time) linear;
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
      transition:
        opacity 0.3s,
        color 0.3s;
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
    .o-hidden {
      display: none;
    }
  }
}
</style>
