<template>
  <div class="box cards">
    <close-one
      class="close"
      theme="filled"
      size="28"
      fill="var(--close-icon-color)"
      @click="store.boxOpenState = false"
    />
    <setting-two
      class="setting"
      theme="filled"
      size="28"
      fill="var(--close-icon-color)"
      @click="store.setOpenState = true"
    />
    <div class="content">
      <!-- 可在此处自定义任意内容 -->
      <TimeCapsule />
      <MoreContent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CloseOne, SettingTwo } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import TimeCapsule from "@/components/TimeCapsule.vue";
import MoreContent from "@/components/MoreContent.vue";

const store = mainStore();
</script>

<style lang="scss" scoped>
.box {
  flex: 1 0 0%;
  margin-left: 0.75rem;
  height: 80%;
  max-width: 50%;
  position: relative;
  animation: fade 0.5s;
  overflow: hidden;

  &:hover {
    transform: scale(1);
  }

  .close,
  .setting {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    transition:
      transform 0.3s,
      opacity 0.3s;

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(1);
    }
  }

  .setting {
    right: 56px;
  }

  .content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 30px;
    width: 100%;
    height: 100%;
  }
}
</style>
