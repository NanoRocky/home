import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
import { mainStore } from "@/store";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
// 引入 pinia
import { createPinia } from 'pinia';
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2';
// swiper
import "swiper/css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(
  createPersistedStatePlugin({
    // 为升级 pinia 后的兼容性保留的一块巧克力（
    storage: sessionStorage,
  })
);
export default pinia;

window.addEventListener("beforeunload", () => {
  // 这堆代码原本的意义是在于强制刷新这些本不需要被 pinia 缓存的变量，不知为什么这些变量只会在关闭页面重新输入域名访问才能恢复，导致刷新页面部分模块短时间内出现异常。
  // 但是貌似这堆代码也没能解决问题...罢了，先暂且留着叭（）
  const store = mainStore();
  Object.assign(store, {
    imgLoadStatus: false, // 壁纸加载状态
    innerWidth: null, // 当前窗口宽度
    musicIsOk: false, // 音乐是否加载完成
    musicOpenState: false, // 音乐面板开启状态
    backgroundShow: false, // 壁纸展示状态
    boxOpenState: false, // 盒子开启状态
    mobileOpenState: false, // 移动端开启状态
    mobileFuncState: false, // 移动端功能区开启状态
    setOpenState: false, // 设置页面开启状态
    playerState: false, // 当前播放状态
    playerTitle: null, // 当前播放歌曲名
    playerArtist: null, // 当前播放歌手名
    playerLrc: [[true, "歌词加载中..."]], // 当前播放歌词
    yrcIndex: -1, // 逐字歌词进度存储
    yrcTemp: [], // 逐字歌词缓存
    yrcEnable: true,
    yrcLoading: false,
  });
});

app.use(pinia);
app.mount("#app");

// PWA
navigator.serviceWorker.addEventListener("controllerchange", async () => {
  // 弹出更新提醒
  console.log("站点已更新，刷新后生效");
  ElMessage("站点已更新，刷新后生效");
  if (store.webSpeech) {
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("网站更新.mp3");
  };
});
