<template>
  <div v-if="store.footerProgressBar" class="progress-bar">
    <div
      class="progress"
      :class="{ dragging: isDragging }"
      :style="{ transform: `scaleX(${(isDragging ? dragProgress : smoothProgress) / 100})` }"
    >
      <Icon v-if="!store.playerCanplay" size="32" color="white" class="ReloadCircle">
        <ReloadCircle />
      </Icon>
    </div>

    <div
      class="progress-icon-wrapper"
      :class="{ dragging: isDragging }"
      :style="{ transform: `translate3d(${isDragging ? dragProgress : smoothProgress}%, 0, 0)` }"
    >
      <img
        v-if="store.showProgressIcon"
        src="https://file.nanorocky.top/home/images/icon/ProgressBar.ico"
        class="progress-icon"
        draggable="false"
        @mousedown="handleMouseDown"
        @touchstart.prevent="handleTouchStart"
        ref="icon"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MusicOne } from "@icon-park/vue-next";
import { Icon } from "@vicons/utils";
import { Paw, ReloadCircle } from "@vicons/ionicons5";
import { mainStore } from "@/store";
import config from "@/../package.json";
import { ref, watch, computed, onMounted, nextTick, onUpdated, onBeforeUnmount } from "vue";
import { throttle } from "lodash-es";

const store = mainStore();
const isSeeking = ref(false);
const audio = ref<HTMLAudioElement | null>(null);
const icon = ref<HTMLElement | null>(null);
const touchIdentifier = ref<number | null>(null);
const isDragging = ref(false);
const dragProgress = ref(0);
let dragTimer: ReturnType<typeof setTimeout> | null = null;

// 丝滑进度更新 (60fps)
const smoothProgress = ref(0);
let animationFrameId: number | null = null;

const updateProgress = () => {
  if (!isDragging.value && store.playerState) {
    if (audio.value && store.playerDuration) {
      smoothProgress.value = (audio.value.currentTime / store.playerDuration) * 100;
    } else if (store.playerCurrentTime && store.playerDuration) {
      smoothProgress.value = (store.playerCurrentTime / store.playerDuration) * 100;
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
  if (dragTimer) clearTimeout(dragTimer);
  isDragging.value = true;
  isSeeking.value = true;
  const progressBar = document.querySelector(".progress-bar");
  const rect = progressBar!.getBoundingClientRect();
  const initialX = e.clientX - rect.left;
  dragProgress.value = (initialX / rect.width) * 100;
  store.isDragging = true;
  store.dragProgressTime = (dragProgress.value / 100) * store.playerDuration!;
};

const onMouseUp = () => {
  if (!isDragging.value) return;
  isSeeking.value = false;
  if (audio.value && store.playerDuration) {
    audio.value.currentTime = (dragProgress.value / 100) * store.playerDuration;
  }
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    isDragging.value = false;
    store.isDragging = false;
  }, 350);
};

const onMouseMove = throttle((e: MouseEvent) => {
  if (!isDragging.value) return;
  const progressBar = document.querySelector(".progress-bar");
  const rect = progressBar!.getBoundingClientRect();
  let offsetX = e.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgress.value = (offsetX / rect.width) * 100;
  store.dragProgressTime = (dragProgress.value / 100) * store.playerDuration!;
}, 16);

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 1) return;
  if (dragTimer) clearTimeout(dragTimer);
  isDragging.value = true;
  isSeeking.value = true;
  touchIdentifier.value = e.touches[0].identifier;
  const progressBar = document.querySelector(".progress-bar");
  const rect = progressBar!.getBoundingClientRect();
  const initialX = e.touches[0].clientX - rect.left;
  dragProgress.value = (initialX / rect.width) * 100;
  store.isDragging = true;
  store.dragProgressTime = (dragProgress.value / 100) * store.playerDuration!;
};

const onTouchMove = throttle((e: TouchEvent) => {
  if (!isDragging.value || touchIdentifier.value === null) return;
  const touch = Array.from(e.touches).find((t) => t.identifier === touchIdentifier.value);
  if (!touch) return;
  e.preventDefault();
  const progressBar = document.querySelector(".progress-bar");
  const rect = progressBar!.getBoundingClientRect();
  let offsetX = touch.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgress.value = (offsetX / rect.width) * 100;
  store.dragProgressTime = (dragProgress.value / 100) * store.playerDuration!;
}, 16);

const onTouchEnd = () => {
  if (!isDragging.value) return;
  isSeeking.value = false;
  touchIdentifier.value = null;
  if (audio.value && store.playerDuration) {
    audio.value.currentTime = (dragProgress.value / 100) * store.playerDuration;
  }
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    isDragging.value = false;
    store.isDragging = false;
  }, 350);
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
    } else {
      store.showProgressIconState = 0;
      store.showProgressIcon = false;
    }
  },
);

onMounted(() =>
  nextTick(() => {
    audio.value = document.querySelector("audio");
    animationFrameId = requestAnimationFrame(updateProgress);
    const progressBarShowCheck = document.querySelector("#footer");
    if (progressBarShowCheck) {
      progressBarShowCheck.addEventListener("mouseenter", handleMouseEnter);
      progressBarShowCheck.addEventListener("mouseleave", handleMouseLeave);
    }
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
  }),
);

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
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
    will-change: transform;

    &.dragging {
      transition: none !important;
    }

    .ReloadCircle {
      position: absolute;
      user-select: none;
      touch-action: none;
      top: -16px;
      right: -16px;
      width: 32px;
      height: 32px;
      color: black;
      animation: spin 1s linear infinite;

      @keyframes spin {
        0% {
          transform: rotate(0deg) translateZ(0);
        }

        100% {
          transform: rotate(360deg) translateZ(0);
        }
      }
    }
  }

  .progress-icon-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    pointer-events: none;
    will-change: transform;

    &.dragging .progress-icon {
      transition: none !important;
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
