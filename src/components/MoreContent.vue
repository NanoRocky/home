<template>
  <div class="more-content">
    <span class="greeting">
      你好~
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
const key = import.meta.env.VITE_SFILE_SKEY;
const msgP = ref<string | null>(null);
const getRandomMsg = () => Math.floor(Math.random() * 1) + 1;

onMounted(async () => {
  try {
    const msgpRandomp = getRandomMsg();
    const baseUrl = "https://filep.nanorocky.top/home/images/msg/";
    const imgUrl = `${baseUrl}MSG${msgpRandomp}.png`;
    if (key) {
      // 假设 gasC 是异步函数
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
  height: 100%;

  .greeting {
    font-size: 1rem;
    font-weight: bold;
    width: 95%;
    text-align: center;
    padding: 0 10px;
  }

  .msg-image {
    width: 95%;
    max-height: 75%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    position: relative;

    .msgp {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: top;
    }
  }

}
</style>
