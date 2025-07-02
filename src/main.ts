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

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);
export default pinia;

app.use(pinia);
app.mount("#app");
const store = mainStore();

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
