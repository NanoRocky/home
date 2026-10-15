<template>
  <div class="dwrc-dot" ref="dotRef"></div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const dotRef = ref<HTMLElement | null>(null);
defineExpose({ dotRef });
</script>

<style scoped>
.dwrc-dot {
  position: absolute;
  bottom: 3px;
  left: -1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(255, 182, 193, 1);
  box-shadow: 0 0 6px rgba(255, 192, 203, 1);
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  will-change: transform, opacity;
}
</style>
