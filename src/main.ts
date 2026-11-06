import { createApp } from "vue";
import config from "@/../package.json";
import "@/style/style.scss";
import App from "@/App.vue";
import { mainStore } from "@/store";
import { stopSpeech, SpeechLocal } from "@/utils/speech";
import { validationPlugin } from "@/store/plugins/validation";
import { ensureClientUUID } from "@/utils/uuid";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// Element Plus
import { ElMessage, ElMessageBox } from "element-plus";
import "element-plus/dist/index.css";
// swiper
import "swiper/css";
import "uno.css";
// i18n
import i18n from "@/locales";

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
  store.clientUUID = ensureClientUUID(store.clientUUID);
  if (import.meta.env.DEV) {
    console.log(i18n.global.t("views.main.devMode"));
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
      message: i18n.global.t("components.settings.system.restoringDefault"),
    });
    if (store.webSpeech) {
      stopSpeech();
      SpeechLocal("重置2.mp3");
    }
    store.resetStore();
  }

  // PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", async () => {
      // 弹出更新提醒
      const updatedMsg = i18n.global.t("views.main.siteUpdated");
      console.log(updatedMsg);
      ElMessage(updatedMsg);
      if (store.webSpeech) {
        stopSpeech();
        SpeechLocal("网站更新.mp3");
      }
    });
  }

  const parseBoolParam = (val: string) =>
    !["false", "0", "no", "off"].includes(val.trim().toLowerCase());

  if (urlParams.get("set") !== "reset") {
    const devsParam = urlParams.get("devs");
    if (devsParam !== null && devsParam !== "") {
      store.setV = parseBoolParam(devsParam);
    }
    const papParam = urlParams.get("pap");
    if (papParam !== null && papParam !== "") {
      store.playerAutoplay = parseBoolParam(papParam);
    }

    if (urlParams.get("bg") || urlParams.get("bgc")) {
      const setupset = () =>
        setTimeout(() => {
          if (store.imgLoadStatus === true) {
            if (urlParams.get("bg")) {
              store.coverType = Number(urlParams.get("bg"));
            }
            if (urlParams.get("bgc") && (store.coverType == 0 || urlParams.get("bg") == "0")) {
              store.sBGCount = String(urlParams.get("bgc"));
            }
          } else {
            setupset();
          }
        }, 300);

      setupset();
    }
  }
};

const checkAuthorAndMount = () => {
  /* 原本这里的逻辑是..如果作者信息被修改，则停止项目运行。原本是想拦没有代码更改但删除作者信息直接倒卖的人，因为但凡是个会一点代码的人不可能不会解决这点小问题。这在技术上几乎没有一点防护效果。
  但是看到确实有用户修改后，思考了一阵，这好像和 MIT 开源文化有冲突...且 MIT 本身也就允许倒卖这种行为叭..（
  最后..还是决定将这里的完全不运行改成显示提示后继续正常工作，更合理些叭...理解万岁！
  另外，也请求各位不要随意移除原作者信息，谢谢！ */
  if (config.author != "imsyy" || config.efua != "NanoRocky") {
    console.warn(i18n.global.t("console.main.authorWarning"));
    console.log(i18n.global.t("console.main.repoLink"));
  }
  mountApp();
};

if (!import.meta.env.VITE_HAS_ENV_FILE) {
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.display = "none";
  }
  console.error(i18n.global.t("views.main.corruptedDetect"));
  ElMessageBox.alert(
    i18n.global.t("views.main.corruptedDetect"),
    i18n.global.t("common.status.warning"),
    {
      confirmButtonText: i18n.global.t("common.action.confirm"),
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      type: "error",
    },
  );
} else if (!import.meta.env.VITE_HAS_ENV_LOCAL) {
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.display = "none";
  }
  console.error(i18n.global.t("views.main.noConfigWarningLog"));
  ElMessageBox.confirm(
    i18n.global.t("views.main.noConfigDetect"),
    i18n.global.t("common.status.warning"),
    {
      confirmButtonText: i18n.global.t("common.action.continue"),
      cancelButtonText: i18n.global.t("common.action.cancel"),
      type: "warning",
    },
  )
    .then(() => {
      checkAuthorAndMount();
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: i18n.global.t("views.main.canceled"),
      });
    });
} else {
  checkAuthorAndMount();
}
