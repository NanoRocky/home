import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { validationPlugin } from "@/store/plugins/validation";
// 引入 pinia
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
// swiper
import "swiper/css";
import "uno.css";

const app = createApp(App);
const pinia = createPinia();

export default pinia;
pinia.use(piniaPluginPersistedstate);
pinia.use(validationPlugin);

app.use(pinia);
app.mount("#app");
const store = mainStore();

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("set") === "reset") {
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: `正在恢复默认配置，请稍后...`,
  });
  if (store.webSpeech) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("重置2.mp3");
  };
  store.resetStore();
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

const setupset = () => setTimeout(() => {
  if (urlParams.get("set") != "reset" && store.imgLoadStatus === true) {
    if (urlParams.get("bg")) {
      store.coverType = Number(urlParams.get("bg"));
    };
    if (urlParams.get("bgc") && (store.coverType == 0 || urlParams.get("bg") == "0")) {
      store.sBGCount = String(urlParams.get("bgc"));
    };
    if (urlParams.get("devs")) {
      store.setV = Boolean(urlParams.get("devs"));
    };
    if (urlParams.get("pap")) {
      store.playerAutoplay = Boolean(urlParams.get("pap"));
    };
  } else {
    setupset();
  };
}, 300);

setupset();