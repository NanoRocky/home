<template>
  <div class="more-content">
    <span class="greeting">
      {{ $t('moreContent.hello') }}
    </span>
    <div class="msg-image">
      <img v-if="msgP" :src="msgP" class="msgp" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { gasC } from "@/utils/authServer";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";

const store = mainStore();
const key = envConfig.VITE_SFILE_SKEY;
const msgP = ref<string | null>(null);
const getRandomMsg = () => Math.floor(Math.random() * 1) + 1;

onMounted(async () => {
  try {
    const msgpRandomp = getRandomMsg();
    const baseUrl = "https://filep.nanorocky.top/home/images/msg/";
    const imgUrl = `${baseUrl}MSG${msgpRandomp}.png`;
    if (key) {
      msgP.value = await gasC(imgUrl, key);
    } else {
      msgP.value = imgUrl;
    };
  } catch (error) {
    msgP.value = null;
  };
});
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

  .msg-image {
    width: auto;
    height: auto;
    max-height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    overflow: hidden;
    position: relative;

    .msgp {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      opacity: 0.9;
      object-fit: contain;
      object-position: bottom;
    }
  }

}
</style>
