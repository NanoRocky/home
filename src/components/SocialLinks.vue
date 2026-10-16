<template>
  <!-- 社交链接 -->
  <div :class="['social', store.socialTipPosition || 'right']" @dblclick="togglesocial">
    <div class="link">
      <span v-for="item in socialLinks" :key="item.name" class="icon-item" @click="openLink(item.url)"
        @auxclick.stop="openLink(item.url)" @mousedown="handleMouseDown" @mouseenter="socialTip = item.tip"
        @mouseleave="socialTip = t('components.social.TipI')" @dblclick.stop>
        <img class="icon" :src="item.icon" height="24" />
      </span>
    </div>
    <span class="tip" @dblclick="togglesocial">{{ socialTip }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import socialLinks from "@/assets/socialLinks.json";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { mainStore } from "@/store";

const { t } = useI18n();
// 社交链接提示
const socialTip = ref(t("components.social.Tip"));
const store = mainStore();

const openLink = (url: string) => {
  if (url.startsWith("mailto:")) {
    window.location.href = url;
  } else {
    window.open(url, "_blank");
  }
};

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    e.stopPropagation();
    e.preventDefault();
  }
};

const togglesocial = () => {
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: t("components.social.defaultTip"),
  });
  if (store.webSpeech) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("戳戳社.mp3");
  }
};
</script>

<style lang="scss" scoped>
.social {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 460px;
  width: 100%;
  height: 42px;
  background-color: transparent;
  border-radius: 6px;
  -webkit-backdrop-filter: blur(0);
  backdrop-filter: blur(0);
  animation: fade 0.5s;
  transition:
    background-color 0.3s,
    backdrop-filter 0.3s;
  position: relative;

  @media (max-width: 840px) {
    max-width: 100%;
    justify-content: center;

    .link {
      justify-content: space-evenly !important;
      width: 90%;
    }

    .tip {
      display: none !important;
      color: var(--social-font-color);
    }
  }

  .link {
    display: flex;
    align-items: center;
    justify-content: center;

    a,
    .icon-item {
      display: inherit;
      cursor: pointer;

      .icon {
        margin: 0 12px;
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.1);
        }

        &:active {
          transform: scale(1);
        }
      }
    }
  }

  .tip {
    color: var(--social-font-color);
    display: none;
    margin-right: 12px;
    animation: fade 0.5s;
  }

  @media (min-width: 768px) {
    &:hover {
      background-color: var(--card-background-color);
      -webkit-backdrop-filter: blur(5px);
      backdrop-filter: blur(5px);

      .tip {
        display: block;
        color: var(--social-font-color);
      }
    }
  }

  &.down {
    justify-content: flex-start;

    .tip {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      margin-right: 0;
      white-space: nowrap;
      text-align: center;
      padding: 4px 12px;
      border-radius: 6px;
      background-color: var(--social-background-color);
      -webkit-backdrop-filter: blur(5px);
      backdrop-filter: blur(5px);
      font-size: 0.9rem;
      max-width: 460px;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 1;

      &::before {
        content: "";
        position: absolute;
        top: -8px;
        left: 0;
        width: 100%;
        height: 8px;
      }
    }
  }
}
</style>
