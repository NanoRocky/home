<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <!-- 翻译歌词独立悬浮气泡 -->
    <Transition
      name="tr-fade"
      mode="out-in"
      @before-enter="onTrBeforeEnter"
      @after-enter="onTrAfterEnter"
      @before-leave="onTrBeforeLeave"
      @after-leave="onTrAfterLeave"
    >
      <div
        v-if="
          store.playerState && store.playerLrcShow && store.playerTrLrc && store.playerTrLrcText
        "
        class="translation-lrc"
        :key="store.playerTrLrcText"
        @mousedown="handleLrcMiddleClick"
      >
        <span class="tr-text">{{ store.playerTrLrcText }}</span>
      </div>
    </Transition>
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
      <div v-else class="lrc" @dblclick="toggleForceIcon" @mousedown="handleLrcMiddleClick">
        <!-- 音乐进度条 -->
        <ProgressBar v-if="store.footerProgressBar" />
        <!-- 歌词组件 -->
        <Transition
          name="fade"
          mode="out-in"
          :id="`lrc-line-${store.playerLrc[0]?.[2] ?? 0}`"
          @before-leave="onBeforeLeave"
          @before-enter="onBeforeEnter"
          @after-enter="onAfterEnter"
        >
          <div
            class="lrc-all"
            ref="lrcAllRef"
            :class="{ 'is-overflow': lyricGeo.isOverflow, 'is-centered': !lyricGeo.isOverflow }"
            :key="lyricTransitionKey"
          >
            <!-- 左侧 ICON 组 -->
            <div class="lrc-side-icons left-icons" ref="leftIconsRef">
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
            </div>
            <!-- 中间歌词视口区域 -->
            <div class="lrc-viewport" ref="lrcViewportRef">
              <div class="lrc-scroll-track" ref="lrcTrackRef">
                <!-- 逐字模块 -->
                <span v-if="!isLineByLine" class="dwrc-box" ref="dwrcBoxRef">
                  <DwrcDot v-if="store.dwrcDot" ref="dwrcDotRef" />
                  <span
                    class="dwrc-2 lrc-text"
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
                        i[0] && Number(i[5]) > 1019 && Number(i[6]) > 0
                          ? 'long-tone'
                          : 'fade-in-start',
                        i[0] && Number(i[6]) <= 0 ? 'fade-out' : '',
                        i[0] && Number(i[5]) > 1019 && Number(i[6]) <= 0 ? 'long-tone-out' : '',
                      ]"
                      v-html="i[4]"
                    >
                    </span>
                  </span>
                  <span class="dwrc-1 lrc-text" id="dwrc-1-wrap">
                    <span
                      v-for="(i, index) in store.playerLrc"
                      :key="`lrc-char-${i[2]}-${i[3]}`"
                      :style="{ '--char-duration': i[5] + 'ms' }"
                      :class="[
                        'dwrc-char',
                        i[0] && Number(i[6]) > 0 ? 'fade-in' : 'fade-in-start',
                        i[0] && Number(i[5]) > 1019 && Number(i[6]) > 0
                          ? 'long-tone'
                          : 'fade-in-start',
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
                <!-- 逐行模块 -->
                <span
                  v-else
                  class="lrc-text line-lrc-text lrc-char"
                  ref="lineLrcRef"
                  v-html="store.getPlayerLrc[0]?.[4]"
                />
              </div>
            </div>
            <!-- 右侧 ICON 组 -->
            <div class="lrc-side-icons right-icons" ref="rightIconsRef">
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
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup lang="ts">
import DwrcDot from "@/components/DwrcDot.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { MusicOne } from "@icon-park/vue-next";
import { Icon } from "@vicons/utils";
import Paw from "@vicons/ionicons5/es/Paw.js";
import { mainStore } from "@/store";
import config from "@/../package.json";
import { onPilferDiscard } from "@/utils/translationLyric";
import {
  ref,
  reactive,
  watch,
  computed,
  onMounted,
  nextTick,
  onUpdated,
  onBeforeUnmount,
} from "vue";
import { useI18n } from "vue-i18n";
import { throttle } from "lodash-es";

const store = mainStore();
const dwrcDotRef = ref<InstanceType<typeof DwrcDot> | null>(null);
const lrcAllRef = ref<HTMLElement | null>(null);
const leftIconsRef = ref<HTMLElement | null>(null);
const rightIconsRef = ref<HTMLElement | null>(null);
const lrcViewportRef = ref<HTMLElement | null>(null);
const lrcTrackRef = ref<HTMLElement | null>(null);
const dwrcBoxRef = ref<HTMLElement | null>(null);
const lineLrcRef = ref<HTMLElement | null>(null);

const fullYear = new Date().getFullYear();
const audio = ref(null);
const icon = ref(null);
const { locale, t } = useI18n();

// 加载配置数据
// const siteStartDate = ref(import.meta.env.VITE_SITE_START);
const startYear = ref<number | null>(
  import.meta.env.VITE_SITE_START?.length >= 4
    ? parseInt(import.meta.env.VITE_SITE_START.substring(0, 4))
    : null,
);
const ShowStartYear = computed(() => {
  return startYear.value !== null && startYear.value < fullYear;
});
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteMps = ref(import.meta.env.VITE_SITE_MPS);
const siteMICP = ref(import.meta.env.VITE_SITE_MICP);
const siteAuthor = computed(() => {
  if (locale.value !== "zh-CN" && import.meta.env.VITE_SITE_AUTHOR_EN) {
    return import.meta.env.VITE_SITE_AUTHOR_EN;
  }
  return import.meta.env.VITE_SITE_AUTHOR || "nanorocky";
});

const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
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
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("启用进度图标常驻.mp3");
    }
  } else {
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("禁用进度图标常驻.mp3");
    }
  }
};

let lastMiddleClickTime = 0;

const isExternalLyric = computed(() => {
  if (!store.lyricSource) return false;
  if (store.lyricSource === "amll") return true;
  return Boolean(store.songServer && store.lyricSource !== store.songServer);
});

const discardExternalLyric = () => {
  if (!isExternalLyric.value) return;
  const source = store.lyricSource;
  store.dwrcTemp = [];
  store.dwrcEnable = false;
  store.dwrcLoading = false;
  store.lyricSeekVersion++;

  if (source !== "amll") {
    onPilferDiscard(undefined, store);
  }

  store.lyricSource = store.songServer;

  ElMessage({
    message: t("components.music.restoredOriginalLyric"),
    grouping: true,
  });
};

const handleLrcMiddleClick = (e: MouseEvent) => {
  if (!isExternalLyric.value) return;
  if (e.button !== 1) return;
  e.stopPropagation();
  e.preventDefault();
  const now = Date.now();
  if (now - lastMiddleClickTime < 350) {
    lastMiddleClickTime = 0;
    discardExternalLyric();
  } else {
    lastMiddleClickTime = now;
  }
};

const PADDING_LEFT = 8; // 开始左间距
const PADDING_RIGHT = 8; // 结束右间距
const MASK_MAX_WIDTH = 24; // 遮罩渐隐最大宽度
const SCROLL_LERP = 0.15; // 阻尼平滑系数

const lyricGeo = reactive({
  viewportWidth: 0,
  viewportLeft: 0,
  contentWidth: 0,
  maxScroll: 0,
  isOverflow: false,
});

let currentScrollX = 0;
let lastMaskLeft = -1;
let lastMaskRight = -1;
let lastMaskLeftColor = "";
let lastMaskRightColor = "";
let isTransitioning = false;
let transitionTimer: any = null;

const resetDynamicMask = (targetVp?: HTMLElement | null) => {
  lastMaskLeft = -1;
  lastMaskRight = -1;
  lastMaskLeftColor = "";
  lastMaskRightColor = "";
  const vp = targetVp || lrcViewportRef.value;
  if (vp) {
    const vpStyle = vp.style;
    vpStyle.setProperty("--mask-left", "0px");
    vpStyle.setProperty("--mask-left-color", "black");
    vpStyle.setProperty("--mask-right", `${MASK_MAX_WIDTH}px`);
    vpStyle.setProperty("--mask-right-color", "transparent");
  }
};

const onBeforeLeave = () => {
  isTransitioning = true;
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    isTransitioning = false;
  }, 400);
};

const onBeforeEnter = (el: Element) => {
  isTransitioning = false;
  clearTimeout(transitionTimer);
  currentScrollX = 0;

  const track = el.querySelector(".lrc-scroll-track") as HTMLElement;
  if (track) {
    track.style.transform = "translate3d(0, 0, 0)";
  }
  const vp = el.querySelector(".lrc-viewport") as HTMLElement;
  if (vp) {
    resetDynamicMask(vp);
  }

  nextTick(() => {
    updateLyricGeometry();
  });
};

const onAfterEnter = () => {
  isTransitioning = false;
  clearTimeout(transitionTimer);
  updateLyricGeometry();
};

let isTrLrcMounted = false;

const isTranslationActive = () => {
  return !!(store.playerState && store.playerLrcShow && store.playerTrLrc && store.playerTrLrcText);
};

const onTrBeforeEnter = (el: Element) => {
  if (!isTrLrcMounted) {
    el.classList.add("is-motion");
    isTrLrcMounted = true;
  } else {
    el.classList.remove("is-motion");
  }
};

const onTrBeforeLeave = (el: Element) => {
  if (!isTranslationActive()) {
    el.classList.add("is-motion");
    isTrLrcMounted = false;
  } else {
    el.classList.remove("is-motion");
  }
};

const onTrAfterEnter = (el: Element) => {
  el.classList.remove("is-motion");
};

const onTrAfterLeave = (el: Element) => {
  el.classList.remove("is-motion");
};

watch(
  () => store.playerState && store.playerLrcShow && store.playerTrLrc && store.playerTrLrcText,
  (val) => {
    if (!val) {
      isTrLrcMounted = false;
    }
  },
);

type DwrcItem = [number, number, any[]];
const isLineByLine = computed(() => {
  return !store.dwrcEnable || (store.dwrcTemp as DwrcItem[]).length === 0 || store.dwrcLoading;
});

const lyricTransitionKey = computed(() => {
  if (!isLineByLine.value) {
    return store.playerLrc?.length > 0
      ? `lrc-line-${store.playerLrc[0]?.[2]}-${store.playerLrc.length}-${store.playerLrc[0]?.[4]}-${store.lyricSeekVersion}`
      : `lrc-line-null`;
  } else {
    return store.getPlayerLrc?.length > 0
      ? `lrc-${store.getPlayerLrc[0]?.[2]}-${store.getPlayerLrc.length}`
      : t("components.music.lrcSearching");
  }
});

const updateLyricGeometry = () => {
  if (!lrcAllRef.value) return;

  const lrcAllRect = lrcAllRef.value.getBoundingClientRect();
  const leftIconsWidth = leftIconsRef.value ? leftIconsRef.value.getBoundingClientRect().width : 50;
  const rightIconsWidth = rightIconsRef.value
    ? rightIconsRef.value.getBoundingClientRect().width
    : 50;

  const sideMargin = 8;
  const maxAvailableViewportWidth = Math.max(
    0,
    lrcAllRect.width - (leftIconsWidth + rightIconsWidth + sideMargin),
  );

  const contentEl = dwrcBoxRef.value || lineLrcRef.value;
  const contentWidth = contentEl ? contentEl.getBoundingClientRect().width : 0;

  lyricGeo.contentWidth = contentWidth;

  const availableWidth = maxAvailableViewportWidth - PADDING_LEFT - PADDING_RIGHT;
  lyricGeo.isOverflow = contentWidth > availableWidth + 1 && availableWidth > 0;

  if (lyricGeo.isOverflow) {
    const vpRect = lrcViewportRef.value?.getBoundingClientRect();
    lyricGeo.viewportWidth =
      vpRect && vpRect.width > contentWidth ? vpRect.width : maxAvailableViewportWidth;
    lyricGeo.viewportLeft = vpRect ? vpRect.left : lrcAllRect.left + leftIconsWidth + 4;
    lyricGeo.maxScroll = Math.max(
      0,
      contentWidth + PADDING_LEFT + PADDING_RIGHT - lyricGeo.viewportWidth,
    );
  } else {
    lyricGeo.viewportWidth = contentWidth;
    lyricGeo.viewportLeft = lrcAllRect.left + (lrcAllRect.width - contentWidth) / 2;
    lyricGeo.maxScroll = 0;
  }
};

let resizeObserver: ResizeObserver | null = null;
const setupResizeObserver = () => {
  if (typeof ResizeObserver === "undefined") return;
  resizeObserver = new ResizeObserver(() => {
    updateLyricGeometry();
  });
  if (lrcAllRef.value) resizeObserver.observe(lrcAllRef.value);
  if (lrcViewportRef.value) resizeObserver.observe(lrcViewportRef.value);
};

watch([lrcAllRef, lrcViewportRef], ([newAll, newViewport], [oldAll, oldViewport]) => {
  if (oldAll && resizeObserver) resizeObserver.unobserve(oldAll);
  if (oldViewport && resizeObserver) resizeObserver.unobserve(oldViewport);
  if (newAll && resizeObserver) resizeObserver.observe(newAll);
  if (newViewport && resizeObserver) resizeObserver.observe(newViewport);
  updateLyricGeometry();
});

let dprMediaQuery: MediaQueryList | null = null;
const listenDprChange = () => {
  if (typeof window === "undefined" || !window.matchMedia) return;
  dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dpr)`);
  dprMediaQuery.addEventListener(
    "change",
    () => {
      updateLyricGeometry();
      listenDprChange();
    },
    { once: true },
  );
};

let lastLineIndex: any = null;
watch(
  () => (isLineByLine.value ? store.getPlayerLrc?.[0]?.[2] : store.playerLrc?.[0]?.[2]),
  (newLine) => {
    if (newLine !== undefined && newLine !== lastLineIndex) {
      lastLineIndex = newLine;
      if (store.isDragging) {
        isTransitioning = false;
        clearTimeout(transitionTimer);
        currentScrollX = 0;
        resetDynamicMask();
        if (lrcTrackRef.value) {
          lrcTrackRef.value.style.transform = "translate3d(0, 0, 0)";
        }
        nextTick(() => {
          updateLyricGeometry();
        });
      }
    }
  },
  { immediate: true },
);

watch(
  () => store.lyricSeekVersion,
  () => {
    isTransitioning = false;
    clearTimeout(transitionTimer);
    nextTick(() => {
      updateLyricGeometry();
    });
  },
);

watch(
  () => [store.playerLrcShow, isLineByLine.value],
  () => {
    isTransitioning = false;
    clearTimeout(transitionTimer);
    currentScrollX = 0;
    resetDynamicMask();
    if (lrcTrackRef.value) {
      lrcTrackRef.value.style.transform = "translate3d(0, 0, 0)";
    }
    nextTick(() => {
      updateLyricGeometry();
    });
  },
);

let dwrcRAFId: number | null = null;

const startDWRCLoop = () => {
  if (dwrcRAFId !== null) return;
  const loop = () => {
    if (isTransitioning) {
      dwrcRAFId = requestAnimationFrame(loop);
      return;
    }

    const isLine = isLineByLine.value;
    const audio = document.querySelector("audio");
    const now = store.isDragging
      ? store.dragProgressTime * 1000
      : audio
        ? audio.currentTime * 1000
        : 0;

    let currentProgressX = 0;
    if (store.playerDWRCShowPro && !isLine && store.playerLrc && store.playerLrc.length > 0) {
      const dwrc2 = document.getElementsByClassName("dwrc-box")[0] as HTMLElement;
      let dotX = 0;
      let dotVisible = false;

      if (dwrc2) {
        const wrap2 = dwrc2.querySelector("#dwrc-2-wrap");
        if (wrap2 && wrap2.getAttribute("data-line") === store.playerLrc[0]?.[2]?.toString()) {
          const outputDom = dwrc2.querySelectorAll("#dwrc-2-wrap span") as NodeListOf<HTMLElement>;
          if (outputDom.length === store.playerLrc.length) {
            for (let i = 0; i < store.playerLrc.length; i++) {
              const lrcItem = store.playerLrc[i] as any[];
              const start = Number(lrcItem[8]);
              const duration = Number(lrcItem[5]);
              if (lrcItem[8] === undefined || isNaN(start) || isNaN(duration)) continue;

              const outputItem = outputDom[i];
              if (!outputItem) continue;

              if (duration === 0) {
                outputItem.style.clipPath = `inset(0 100% 0 0)`;
              } else if (now >= start + duration) {
                outputItem.style.clipPath = `inset(0 0% 0 0)`;
              } else if (now >= start && now < start + duration) {
                const progress = (now - start) / duration;
                const clipRight = Math.max(0, Math.min(100, (1 - progress) * 100));
                outputItem.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
              } else {
                outputItem.style.clipPath = `inset(0 100% 0 0)`;
              }
            }

            const timeline: { time: number; x: number }[] = [];
            for (let i = 0; i < store.playerLrc.length; i++) {
              const lrcItem = store.playerLrc[i] as any[];
              const start = Number(lrcItem[8]);
              const duration = Number(lrcItem[5]);
              if (isNaN(start) || isNaN(duration) || duration <= 0) continue;

              const outputItem = outputDom[i];
              if (!outputItem) continue;

              timeline.push({ time: start, x: outputItem.offsetLeft });
              timeline.push({
                time: start + duration,
                x: outputItem.offsetLeft + outputItem.offsetWidth,
              });
            }

            if (timeline.length > 0) {
              timeline.sort((a, b) => a.time - b.time);

              if (now <= timeline[0].time) {
                dotX = timeline[0].x;
              } else if (now >= timeline[timeline.length - 1].time) {
                dotX = timeline[timeline.length - 1].x;
              } else {
                for (let j = 0; j < timeline.length - 1; j++) {
                  const curr = timeline[j];
                  const next = timeline[j + 1];
                  if (now >= curr.time && now < next.time) {
                    if (next.time === curr.time) {
                      dotX = curr.x;
                    } else {
                      const progress = (now - curr.time) / (next.time - curr.time);
                      dotX = curr.x + (next.x - curr.x) * progress;
                    }
                    break;
                  }
                }
              }
              dotVisible = true;
            } else {
              dotVisible = false;
            }
          }
        }
      }

      if (dwrcDotRef.value && dwrcDotRef.value.dotRef) {
        const dotEl = dwrcDotRef.value.dotRef;
        if (dotVisible) {
          dotEl.style.opacity = "1";
          dotEl.style.transform = `translateX(${dotX}px)`;
        } else {
          dotEl.style.opacity = "0";
        }
      }

      currentProgressX = dotX;
    } else if (isLine && store.getPlayerLrc?.length > 0) {
      const lrcItem = (store.getPlayerLrc[0] as any[]) || [];
      const duration = Number(lrcItem[5]) || 5000;
      const start = Number(lrcItem[8]) || 0;
      const rawText = String(lrcItem[4] || "").replace(/<[^>]+>/g, "");
      const charCount = rawText.length || 1;
      const elapsed = Math.max(0, now - start);

      const progress = Math.min(1, Math.max(0, elapsed / duration));
      currentProgressX = progress * lyricGeo.contentWidth;
    }

    let targetOffset = 0;
    if (lyricGeo.isOverflow) {
      const screen65 = window.innerWidth * 0.65;
      const headScreenX = lyricGeo.viewportLeft + PADDING_LEFT + currentProgressX;
      const rawOffset = screen65 - headScreenX;
      targetOffset = Math.max(-lyricGeo.maxScroll, Math.min(0, rawOffset));
    }
    if (Math.abs(targetOffset - currentScrollX) > 0.05) {
      currentScrollX += (targetOffset - currentScrollX) * SCROLL_LERP;
    } else {
      currentScrollX = targetOffset;
    }

    if (lrcTrackRef.value) {
      lrcTrackRef.value.style.transform = `translate3d(${currentScrollX}px, 0, 0)`;
    }
    if (lyricGeo.isOverflow && lrcViewportRef.value) {
      const scrollDist = Math.abs(currentScrollX);
      const leftFade = Math.min(MASK_MAX_WIDTH, Math.max(0, Math.round(scrollDist)));
      const leftColor = leftFade > 0 ? "transparent" : "black";

      const remainingDist = Math.max(0, lyricGeo.maxScroll - scrollDist);
      const rightFade = Math.min(MASK_MAX_WIDTH, Math.max(0, Math.round(remainingDist)));
      const rightColor = rightFade > 0 ? "transparent" : "black";

      const vpStyle = lrcViewportRef.value.style;
      if (leftFade !== lastMaskLeft || leftColor !== lastMaskLeftColor) {
        lastMaskLeft = leftFade;
        lastMaskLeftColor = leftColor;
        vpStyle.setProperty("--mask-left", `${leftFade}px`);
        vpStyle.setProperty("--mask-left-color", leftColor);
      }
      if (rightFade !== lastMaskRight || rightColor !== lastMaskRightColor) {
        lastMaskRight = rightFade;
        lastMaskRightColor = rightColor;
        vpStyle.setProperty("--mask-right", `${rightFade}px`);
        vpStyle.setProperty("--mask-right-color", rightColor);
      }
    }

    dwrcRAFId = requestAnimationFrame(loop);
  };
  dwrcRAFId = requestAnimationFrame(loop);
};

const stopDWRCLoop = () => {
  if (dwrcRAFId !== null) {
    cancelAnimationFrame(dwrcRAFId);
    dwrcRAFId = null;
  }
};

onMounted(() => {
  setupResizeObserver();
  listenDprChange();
  nextTick(() => {
    updateLyricGeometry();
  });
  startDWRCLoop();
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  clearTimeout(transitionTimer);
  stopDWRCLoop();
});
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
  clip-path: inset(0 100% 0 0);
  will-change: clip-path, color, opacity;
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

.dwrc-box {
  position: relative;
  display: inline-block;
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
  overflow: visible;
  text-overflow: clip;
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

  &.is-elevated {
    position: fixed !important;
    bottom: 0 !important;
    top: auto !important;
    left: 0 !important;
    width: 100% !important;
    z-index: 101 !important;
    pointer-events: auto;
  }

  .translation-lrc {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    line-height: 1.4;
    padding: 4px 14px;
    border-radius: 6px;
    background-color: var(--card-background-color);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    font-size: 0.85rem;
    color: var(--text-color);
    white-space: nowrap;
    max-width: 80vw;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    user-select: none;
    pointer-events: auto;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &.tr-fade-enter-active,
    &.tr-fade-leave-active {
      transition:
        opacity 0.2s linear,
        transform 0.2s linear;
    }

    &.tr-fade-enter-from,
    &.tr-fade-leave-to {
      opacity: 0;
    }

    &.tr-fade-enter-to,
    &.tr-fade-leave-from {
      opacity: 1;
    }

    &.tr-fade-enter-from.is-motion,
    &.tr-fade-leave-to.is-motion {
      transform: translateX(-50%) translateY(4px);
    }

    &.tr-fade-enter-to.is-motion,
    &.tr-fade-leave-from.is-motion {
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 720px) {
      font-size: 0.78rem;
      padding: 3px 10px;
      max-width: 90vw;
      bottom: calc(100% + 6px);
    }
  }

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
      width: 100%;
      height: 46px;
      display: flex;
      flex-direction: row;
      align-items: center;
      white-space: nowrap;
      position: relative;

      .lrc-side-icons {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        user-select: none;
      }

      &.is-centered {
        justify-content: center;

        .lrc-viewport {
          flex: 0 1 auto;
          overflow: visible;
          mask-image: none;
          -webkit-mask-image: none;
        }

        .lrc-scroll-track {
          padding: 0 8px;
        }
      }

      &.is-overflow {
        justify-content: space-between;

        .lrc-side-icons {
          z-index: 2;

          &.left-icons {
            margin-left: 4px;
          }

          &.right-icons {
            margin-right: 4px;
          }
        }

        .lrc-viewport {
          flex: 1;
          min-width: 0;
          height: 100%;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(
            to right,
            var(--mask-left-color, black) 0,
            black var(--mask-left, 0px),
            black calc(100% - var(--mask-right, 24px)),
            var(--mask-right-color, transparent) 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            var(--mask-left-color, black) 0,
            black var(--mask-left, 0px),
            black calc(100% - var(--mask-right, 24px)),
            var(--mask-right-color, transparent) 100%
          );
        }

        .lrc-scroll-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          padding-left: 8px;
          padding-right: 8px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      }

      .line-lrc-text {
        display: inline-block !important;
        white-space: nowrap !important;
        text-overflow: clip !important;
        overflow: visible !important;
      }

      #dwrc-1-wrap,
      #dwrc-2-wrap {
        text-overflow: clip !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }

      .lrc-text {
        margin: 0;
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
        display: inline-block;

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
