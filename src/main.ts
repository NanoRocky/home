import { createApp } from "vue";
import config from "@/../package.json";
import "@/style/style.scss";
import App from "@/App.vue";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { validationPlugin } from "@/store/plugins/validation";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// Element Plus
import { ElMessage, ElMessageBox, ElConfigProvider } from "element-plus";
import "element-plus/dist/index.css";
// swiper
import "swiper/css";
import "uno.css";
// i18n
import i18n, { type LocaleKey, supportedLocales } from "@/locales";

const app = createApp(App);
const pinia = createPinia();

export default pinia;
pinia.use(piniaPluginPersistedstate);
pinia.use(validationPlugin);
app.use(pinia);
app.use(i18n);

const mountApp = () => {
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.display = "block";
  }
  app.mount("#app");
  const store = mainStore();
  if (import.meta.env.DEV) {
    console.log(i18n.global.t('main.devMode'));
    /* 自动启用开发者选项 */
    store.setV = true;
    /* 在开发状态下挂载 store 以进行测试 */
    (window as any).store = store;
  } else if (import.meta.env.PROD) {
    /* 处于服务模式 */
  }
  // 初始化语言设置
  store.setLanguage(store.language);
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("set") === "reset") {
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: i18n.global.t('devSet.restoringDefault'),
    });
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("重置2.mp3");
    }
    store.resetStore();
  }

  // PWA
  navigator.serviceWorker.addEventListener("controllerchange", async () => {
    // 弹出更新提醒
    const updatedMsg = i18n.global.t('main.updated');
    console.log(updatedMsg);
    ElMessage(updatedMsg);
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("网站更新.mp3");
    }
  });

  const setupset = () =>
    setTimeout(() => {
      if (urlParams.get("set") != "reset" && store.imgLoadStatus === true) {
        if (urlParams.get("bg")) {
          store.coverType = Number(urlParams.get("bg"));
        }
        if (urlParams.get("bgc") && (store.coverType == 0 || urlParams.get("bg") == "0")) {
          store.sBGCount = String(urlParams.get("bgc"));
        }
        if (urlParams.get("devs")) {
          store.setV = Boolean(urlParams.get("devs"));
        }
        if (urlParams.get("pap")) {
          store.playerAutoplay = Boolean(urlParams.get("pap"));
        }
      } else {
        setupset();
      }
    }, 300);

  setupset();
};

if (!import.meta.env.VITE_CONFIG_TURN || import.meta.env.VITE_CONFIG_TURN != "true") {
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.display = "none";
  }
  console.error(i18n.global.t('main.configMissing'));
  ElMessageBox.confirm(i18n.global.t('main.configMissing'), i18n.global.t('main.warning'), {
    confirmButtonText: i18n.global.t('main.continue'),
    cancelButtonText: i18n.global.t('main.cancel'),
    type: "warning",
  })
    .then(() => {
      mountApp();
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: i18n.global.t('main.cancelled'),
      });
    });
} else {
  if (config.author != "imsyy" || config.efua != "NanoRocky") {
    console.warn(
      `Warning: Somethings error ... , The original author information for this project has been modified. If this was not done by you, please delete the file and download the project code package again. If this was done by you, please do not modify or remove the original author information. Thank you! Of course, you can also choose to ignore this message.`,
    );
    console.log("Original repository link: https://github.com/NanoRocky/home/blob/EFU/");
  } else if (envConfig.VITE_SITE_AUTHOR != "酪灰") {
    console.error(
      `Warning: This version is not permitted for public use. Please use the public version.`,
    );
    console.log("Original repository link: https://github.com/NanoRocky/home/blob/EFU/");
  } else {
    mountApp();
  }
}
