import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
// 引入 pinia
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// swiper
import "swiper/css";
import { createResetPlugin } from '@/store/plugins/piniaResetPlugin'

const app = createApp(App);
const pinia = createPinia();

export default pinia;
pinia.use(piniaPluginPersistedstate);
pinia.use(createResetPlugin());

app.use(pinia);
app.mount("#app");
const store = mainStore();

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("set") === "reset") {
  localStorage.removeItem("main");
  sessionStorage.removeItem("main");
  store.resetStore();
  store.$reset();
  window.location.href = window.location.pathname;
};

// PWA
navigator.serviceWorker.addEventListener("controllerchange", async () => {
  // 弹出更新提醒
  console.log("网站已更新，请刷新网页嗷！");
  ElMessage("网站已更新，请刷新网页嗷！");
  if (store.webSpeech) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("网站更新.mp3");
  };
});
