<template>
  <div class="more-content">
    <span class="greeting">
      {{ $t("components.moreContent.hello") }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from "vue";
import { gasC } from "@/utils/authServer";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";

const store = mainStore();
const key = import.meta.env.VITE_SFILE_SKEY;
</script>

<style lang="scss" scoped>
.more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
  max-height: 100%;
  flex: 1;

  .greeting {
    font-family: MiSans VF;
    font-weight: 520;
    font-size: 1.05rem;
    width: 100%;
    text-align: center;
    padding: 0 10px;
    color: var(--text-color);
  }
}
</style>
