<template>
  <div v-if="store.footerProgressBar" class="progress-bar" ref="progressBarRef">
    <div class="progress" :class="{ dragging: isDragging }" ref="progressFillRef"></div>

    <div class="progress-icon-wrapper" :class="{ dragging: isDragging }" ref="progressWrapperRef">
      <img
        v-if="store.showProgressIcon"
        src="/images/icon/ProgressBar.ico"
        class="progress-icon"
        draggable="false"
        @mousedown="handleMouseDown"
        @touchstart.prevent="handleTouchStart"
        ref="icon"
      />
      <Icon v-if="!store.playerCanplay" size="32" color="white" class="ReloadCircle">
        <ReloadCircle />
      </Icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@vicons/utils";
import ReloadCircle from "@vicons/ionicons5/es/ReloadCircle.js";
import { mainStore } from "@/store";
import { ref, watch, computed, onMounted, nextTick, onUpdated, onBeforeUnmount } from "vue";
import { throttle } from "lodash-es";

const store = mainStore();
const isSeeking = ref(false);
const audio = ref<HTMLAudioElement | null>(null);
const icon = ref<HTMLElement | null>(null);
const touchIdentifier = ref<number | null>(null);
const isDragging = ref(false);
const progressBarRef = ref<HTMLElement | null>(null);
const progressFillRef = ref<HTMLElement | null>(null);
const progressWrapperRef = ref<HTMLElement | null>(null);
let dragProgressVal = 0;
let smoothProgressVal = 0;
let lastAppliedProgress = -1;
let dragTimer: ReturnType<typeof setTimeout> | null = null;
let footerEl: Element | null = null;

let animationFrameId: number | null = null;

const applyProgressTransform = (percent: number, force = false) => {
  const clamped = Math.min(100, Math.max(0, percent));
  if (!force && clamped === lastAppliedProgress) return;
  lastAppliedProgress = clamped;
  if (progressFillRef.value) {
    progressFillRef.value.style.transform = `scaleX(${clamped / 100})`;
  }
  if (progressWrapperRef.value) {
    progressWrapperRef.value.style.transform = `translate3d(${clamped}%, 0, 0)`;
  }
};

watch([progressFillRef, progressWrapperRef], () => {
  applyProgressTransform(isDragging.value ? dragProgressVal : smoothProgressVal, true);
});

const updateProgress = () => {
  if (!isDragging.value && store.playerState) {
    if (!audio.value || !audio.value.isConnected) {
      audio.value = document.querySelector("audio");
    }
    if (audio.value && store.playerDuration) {
      smoothProgressVal = Math.min(
        100,
        Math.max(0, (audio.value.currentTime / store.playerDuration) * 100),
      );
      applyProgressTransform(smoothProgressVal);
    } else if (store.playerCurrentTime != null && store.playerDuration) {
      smoothProgressVal = Math.min(
        100,
        Math.max(0, (store.playerCurrentTime / store.playerDuration) * 100),
      );
      applyProgressTransform(smoothProgressVal);
    }
  }
  animationFrameId = requestAnimationFrame(updateProgress);
};

// 鼠标事件处理
const handleMouseEnter = () => {
  if (store.showProgressIconState === 2) {
    store.showProgressIcon = true;
  } else {
    store.showProgressIconState = 1;
    store.showProgressIcon = true;
  }
};

const handleMouseLeave = () => {
  if (store.showProgressIconState === 2) {
    store.showProgressIcon = true;
  } else {
    store.showProgressIconState = 0;
    store.showProgressIcon = false;
  }
};

const handleMouseDown = (e: MouseEvent) => {
  const progressBar = progressBarRef.value || document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  if (!rect.width) return;
  if (dragTimer) clearTimeout(dragTimer);
  isDragging.value = true;
  isSeeking.value = true;
  const initialX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  dragProgressVal = (initialX / rect.width) * 100;
  smoothProgressVal = dragProgressVal;
  applyProgressTransform(dragProgressVal, true);
  store.isDragging = true;
  store.dragProgressTime = (dragProgressVal / 100) * (store.playerDuration || 0);
};

const onMouseUp = () => {
  if (!isDragging.value) return;
  isSeeking.value = false;
  if (audio.value && store.playerDuration) {
    audio.value.currentTime = (dragProgressVal / 100) * store.playerDuration;
  }
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    isDragging.value = false;
    store.isDragging = false;
  }, 500);
};

const onMouseMove = throttle((e: MouseEvent) => {
  if (!isSeeking.value) return;
  const progressBar = progressBarRef.value || document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  if (!rect.width) return;
  let offsetX = e.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgressVal = (offsetX / rect.width) * 100;
  smoothProgressVal = dragProgressVal;
  applyProgressTransform(dragProgressVal);
  store.dragProgressTime = (dragProgressVal / 100) * (store.playerDuration || 0);
}, 16);

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 1) return;
  const progressBar = progressBarRef.value || document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  if (!rect.width) return;
  if (dragTimer) clearTimeout(dragTimer);
  isDragging.value = true;
  isSeeking.value = true;
  touchIdentifier.value = e.touches[0].identifier;
  const initialX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
  dragProgressVal = (initialX / rect.width) * 100;
  smoothProgressVal = dragProgressVal;
  applyProgressTransform(dragProgressVal, true);
  store.isDragging = true;
  store.dragProgressTime = (dragProgressVal / 100) * (store.playerDuration || 0);
};

const onTouchMove = throttle((e: TouchEvent) => {
  if (!isSeeking.value || touchIdentifier.value === null) return;
  const touch = Array.from(e.touches).find((t) => t.identifier === touchIdentifier.value);
  if (!touch) return;
  if (e.cancelable) e.preventDefault();
  const progressBar = progressBarRef.value || document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  if (!rect.width) return;
  let offsetX = touch.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgressVal = (offsetX / rect.width) * 100;
  smoothProgressVal = dragProgressVal;
  applyProgressTransform(dragProgressVal);
  store.dragProgressTime = (dragProgressVal / 100) * (store.playerDuration || 0);
}, 16);

const onTouchEnd = () => {
  if (!isDragging.value) return;
  isSeeking.value = false;
  touchIdentifier.value = null;
  if (audio.value && store.playerDuration) {
    audio.value.currentTime = (dragProgressVal / 100) * store.playerDuration;
  }
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    isDragging.value = false;
    store.isDragging = false;
  }, 200);
};

// 数据处理
watch(
  () => store.playerState,
  (_acc, _now) => {
    audio.value = document.querySelector("audio");
  },
);

// 监听外部强制开关
watch(
  () => store.forceShowBarIcon,
  (value) => {
    if (value) {
      store.showProgressIconState = 2;
      store.showProgressIcon = true;
    } else if (store.showProgressIconState === 2) {
      store.showProgressIconState = 0;
      store.showProgressIcon = false;
    }
  },
  { immediate: true },
);

onMounted(() =>
  nextTick(() => {
    audio.value = document.querySelector("audio");
    animationFrameId = requestAnimationFrame(updateProgress);
    footerEl = document.querySelector("#footer");
    if (footerEl) {
      footerEl.addEventListener("mouseenter", handleMouseEnter);
      footerEl.addEventListener("mouseleave", handleMouseLeave);
    }
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
  }),
);

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (dragTimer) {
    clearTimeout(dragTimer);
    dragTimer = null;
  }
  if (isDragging.value) {
    isDragging.value = false;
    store.isDragging = false;
  }
  onMouseMove.cancel();
  onTouchMove.cancel();
  if (footerEl) {
    footerEl.removeEventListener("mouseenter", handleMouseEnter);
    footerEl.removeEventListener("mouseleave", handleMouseLeave);
    footerEl = null;
  }
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
  document.removeEventListener("touchcancel", onTouchEnd);
});
</script>

<style lang="scss" scoped>
.progress-bar {
  // 进度条样式
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1.5px;
  opacity: 1;
  user-select: none;
  background-color: rgba(240, 240, 240, 1);
  z-index: 99;

  .progress {
    height: 100%;
    width: 100%;
    background-color: rgba(138, 43, 226, 1);
    position: relative;
    user-select: none;
    transform-origin: left center;
    transform: scaleX(0);
    will-change: transform;

    &.dragging {
      transition: none !important;
    }
  }

  .progress-icon-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    pointer-events: none;
    transform: translate3d(0%, 0, 0);
    will-change: transform;

    &.dragging .progress-icon {
      transition: none !important;
    }

    .ReloadCircle {
      position: absolute;
      user-select: none;
      touch-action: none;
      top: -16px;
      left: -16px;
      width: 32px;
      height: 32px;
      color: black;
      animation: spin 1s linear infinite;
      z-index: 2;
      /* 确保它在图标上方 */
      pointer-events: none;
      /* 让点击事件穿透到下方的猫爪 */

      @keyframes spin {
        0% {
          transform: rotate(0deg) translateZ(0);
        }

        100% {
          transform: rotate(360deg) translateZ(0);
        }
      }
    }

    .progress-icon {
      // 进度条图标，请勿修改宽高和边距，这些参数是定嘶的！除非你有大改动的能力
      position: absolute;
      user-select: none;
      touch-action: none;
      pointer-events: auto;
      top: -16px;
      left: -16px;
      opacity: 1;
      width: 32px;
      height: 32px;
      cursor: grab;
      transform: translateX(var(--progress-icon-x, 0)) translateZ(0) scale(1);
      will-change: transform;
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        filter 0.25s ease;

      &:hover {
        transform: translateX(var(--progress-icon-x, 0)) translateZ(0) scale(1.15);
        filter: drop-shadow(0 0 6px rgba(138, 43, 226, 0.6));
      }

      &:active {
        cursor: grabbing;
        transform: translateX(var(--progress-icon-x, 0)) translateZ(0) scale(0.95);
      }
    }
  }
}
</style>
