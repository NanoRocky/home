<template>
  <APlayer v-if="playList[0]" ref="player" :audio="playList" :autoplay="store.playerAutoplay" :theme="theme"
    :autoSwitch="false" :loop="store.playerLoop" :order="store.playerOrder" :volume="volume" :showLrc="true"
    :listFolded="listFolded" :listMaxHeight="listMaxHeight" :noticeSwitch="false" @play="onPlay" @pause="onPause"
    @Loadstart="onLoadStart" @timeupdate="onTimeUp" @error="loadMusicError" />
</template>

<script setup>
import { Float, MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { decodeYrc } from "../utils/decodeYrc";

const store = mainStore();
let showYrcRunning = 0;
let lastTimestamp = Date.now();
let nowLineStart = -1;

// 获取播放器 DOM
const player = ref(null);

// 歌曲播放列表
const playList = ref([]);

// 歌曲播放项
const playIndex = ref(0);

// 配置项
const props = defineProps({
  // 主题色
  theme: {
    type: String,
    default: "#efefef",
  },
  // 默认音量
  volume: {
    type: Number,
    default: 0.7,
    validator: (value) => {
      return value >= 0 && value <= 1;
    },
  },
  // 歌曲服务器 ( netease-网易云, tencent-qq音乐 )
  songServer: {
    type: String,
    default: "netease", //'netease' | 'tencent'
  },
  // 播放类型 ( song-歌曲, playlist-播放列表, album-专辑, search-搜索, artist-艺术家 )
  songType: {
    type: String,
    default: "playlist",
  },
  // id
  songId: {
    type: String,
    default: "3035221869",
  },
  // 列表是否默认折叠
  listFolded: {
    type: Boolean,
    default: false,
  },
  // 列表最大高度
  listMaxHeight: {
    type: Number,
    default: 420,
  },
});

const listHeight = computed(() => {
  return props.listMaxHeight + "px";
});

// 初始化播放器
onMounted(() => {
  nextTick(() => {
    try {
      getPlayerList(props.songServer, props.songType, props.songId).then((res) => {
        // 更改播放器加载状态
        store.musicIsOk = true;
        // 生成歌单
        playList.value = res;
        if ("mediaSession" in navigator) {
          // 设置 Media Session 操作
          navigator.mediaSession.setActionHandler("play", () => {
            player.value.play();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            player.value.pause();
          });
          navigator.mediaSession.setActionHandler("nexttrack", () => {
            changeSong(1); // 1 表示下一首
          });
          navigator.mediaSession.setActionHandler("previoustrack", () => {
            changeSong(0); // 0 表示上一首
          });
        };
        console.log("音乐加载完成");
      });
    } catch (err) {
      console.error(err);
      store.musicIsOk = false;
      ElMessage({
        message: "播音员消失惹，音乐加载失败qwq",
        grouping: true,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "#efefef",
        }),
      });
      if (store.webSpeech) {
        stopSpeech();
        const voice = import.meta.env.VITE_TTS_Voice;
        const vstyle = import.meta.env.VITE_TTS_Style;
        SpeechLocal("播放器加载失败.mp3");
      };
    }
  });
});

// 播放
const onPlay = () => {
  console.log("播放");
  playIndex.value = player.value.aplayer.index;
  // 播放状态
  store.setPlayerState(player.value.audioRef.paused);
  // 储存播放器信息
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, {
      theme: "filled",
      fill: "#efefef",
    }),
  });

  if ("mediaSession" in navigator) {
    // 更新 Media Session 元数据
    navigator.mediaSession.metadata = new MediaMetadata({
      title: store.getPlayerData.name,
      artist: store.getPlayerData.artist,
      artwork: [
        {
          src: playList.value[playIndex.value].cover, // 使用当前播放项的封面图像
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });
  };

  if (store.webSpeech) {
    if (store.playerSpeechName) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      Speech(
        "正在播放，“" +
        store.getPlayerData.artist +
        "”的歌曲，《" +
        store.getPlayerData.name +
        "》。",
        voice,
        vstyle,
      );
    };
  };
};

// 暂停
const onPause = () => {
  store.setPlayerState(player.value.audioRef.paused);
};

// 切换播放暂停事件
const playToggle = () => {
  player.value.toggle();
};

// 切换音量事件
const changeVolume = (value) => {
  player.value.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type) => {
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  nextTick(() => {
    player.value.play();
  });
};

// 切换歌曲列表状态
const toggleList = () => {
  player.value.toggleList();
};

// 加载音频错误
const loadMusicError = () => {
  let notice = "";
  if (playList.value.length > 1) {
    notice = "猫猫“不会唱”这首歌啦qwq，将在 2 秒后播放下一首歌曲";
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("歌曲加载失败.mp3");
    };
  } else {
    notice = "播音室出现了一点小故障，请稍后再试qwq";
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("播放器未知异常.mp3");
    };
  };
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "#EFEFEF",
      duration: 2000,
    }),
  });
  console.error(
    "猫猫在播放歌曲: " + player.value.aplayer.audio[player.value.aplayer.index].name + " 出现错误...",
  );
};

// 音频时间更新事件
const fetchYrc = async (yrcUrl) => {
  // 逐字接入模块
  const yrcSource = await fetch(yrcUrl);
  const yrcText = await yrcSource.text();
  store.yrcIndex = playIndex.value;
  if (yrcText.startsWith("[ch:0]")) {
    store.yrcEnable = true;
    store.yrcTemp = decodeYrc(yrcText);
    store.yrcLoading = false;
    return;
  } else if (!store.playerYrcATDB) {
    store.yrcEnable = false;
    store.yrcTemp = [];
    store.yrcLoading = false;
    return;
  };
  // 接入 AMLL TTML Database
  const songUrlInf = new URLSearchParams(new URL(yrcUrl).search);
  const songId = songUrlInf.get("id");
  const songServer = songUrlInf.get("server");
  if (!songId) {
    return;
  };
  const songUrlInfUrl = store.playerYrcATDBF
    ? {
      netease: `https://ghp.ci/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
      tencent: `https://ghp.ci/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songId}.qrc`,
    }
    : {
      netease: `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
      tencent: `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songId}.qrc`,
    };
  if (!["netease", "tencent"].includes(songServer)) {
    return;
  };
  try {
    const amllUrl = songUrlInfUrl[songServer].replace("${songIdlrc}", songId);
    const amllSource = await fetch(amllUrl);
    const amllText = await amllSource.text();
  } catch (e) {
    console.log(e);
    store.yrcEnable = true;
    store.yrcTemp = decodeYrc(amllText);
    store.yrcLoading = false;
  };
};

function onLoadStart() {
  // 逐字获取模块
  try {
    if (player.value == null || player.value.aplayer == null) {
      return;
    };
    const aplayer = player.value.aplayer;
    const lyrics = aplayer.lyrics[playIndex.value];
    if (store.playerYrcShow != true) {
      store.yrcEnable = false;
      store.yrcTemp = [];
      store.yrcLoading = false;
      return;
    };
    if (store.yrcIndex == playIndex.value) {
      return;
    };
    const yrcUrl = aplayer.audio[aplayer.index]["lrc"] + "&yrc=true";
    store.yrcIndex = playIndex.value;
    store.yrcLoading = true;
    fetchYrc(yrcUrl);
  } catch (error) {
    store.yrcEnable = false;
    store.yrcTemp = [];
    store.yrcLoading = false;
    console.error(error);
  };
};

function syncLrc() {
  if (player.value == null || player.value.aplayer == null) {
    return;
  };
  // 逐行模块
  const aplayer = player.value.aplayer;
  const lyrics = aplayer.lyrics[playIndex.value];
  const playerLyricIndex = player.value.aplayer.lyricIndex;
  if (lyrics === undefined || lyrics[playerLyricIndex] === undefined) {
    return doLrcSync("猫猫正在翻找歌词...");
  };
  let lrc = lyrics[playerLyricIndex][1];
  if (lrc === "Loading") {
    return doLrcSync("猫猫正在翻找歌词...");
  } else if (lrc === "Not available" && !store.playerYrcATDB) {
    return doLrcSync("猫猫没有找到这首歌的歌词诶qwq");
  } else if (lrc === "Not availible") {
    // 哈哈哈又是你（）
    const songUrlInfw = new URLSearchParams(new URL(yrcUrl).search);
    const songIdlrc = songUrlInfw.get("id");
    const songServerlrc = songUrlInfw.get("server");
    if (!songIdlrc) {
      return doLrcSync("猫猫没有找到这首歌的歌词诶qwq");
    };
    const songUrlInfwurl = store.playerYrcATDBF
      ? {
        netease: `https://ghp.ci/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songId}.lrc`,
        tencent: `https://ghp.ci/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songId}.lrc`,
      }
      : {
        netease: `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songId}.lrc`,
        tencent: `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songId}.lrc`,
      };
    if (!["netease", "tencent"].includes(songServerlrc)) {
      return doLrcSync("猫猫没有找到这首歌的歌词诶qwq");
    };
    const amllUrllrc = songUrlInfwurl[songServerlrc].replace("${songIdlrc}", songIdlrc);
    fetch(amllUrllrc)
      .then((response) => response.text())
      .catch(() => {
        doLrcSync("猫猫没有找到这首歌的歌词诶qwq");
      });
    return doLrcSync("猫猫正在翻找歌词...");
  };
  doLrcSync(lrc);
};

const onTimeUp = () => {
  store.playerCurrentTime = player.value.audioStatus.playedTime;
  store.playerDuration = player.value.audioStatus.duration;
  if (showYrcRunning == 0 && player.value != null && player.value.aplayer != null) {
    requestAnimationFrame(syncYrc);
  };
};

function doLrcSync(lrc) {
  if (player.value == null || player.value.aplayer == null) {
    return;
  };
  const playerLyricIndex = player.value.aplayer.lyricIndex;
  const output = [[true, 1, playerLyricIndex, 0, lrc]];
  if (store.playerLrc.toString() != output.toString()) {
    store.setPlayerLrc(output);
    return;
  };
};

function syncYrc() {
  showYrcRunning = 1;
  try {
    if (player.value == null || player.value.aplayer == null) {
      return requestAnimationFrame(syncYrc);
    };
    const isLineByLine = !store.yrcEnable || store.yrcTemp.length == 0 || store.yrcLoading
    if (isLineByLine) {
      syncLrc();
      return requestAnimationFrame(syncYrc);
    } else {
      // 逐行模块
      const now = player.value.audioStatus.playedTime * 1000;
      const yrcFiltered = store.yrcTemp.filter((i) => i[0] < now);
      const yrcLyric =
        yrcFiltered.length > 0
          ? yrcFiltered.slice(-1)[0][2].map((it) => {
            const [[start, duration], word, line, row] = it;
            const isCurrent = now >= start && now <= start + duration;
            const isSungLyrics = start + duration < now;
            const lessdur = start + duration - now;
            return [isCurrent, isSungLyrics, line, row, word, duration, lessdur, "auto"];
          })
          : [[true, 1, 0, 0, `${store.playerTitle} - ${store.playerArtist}`]];
      if (store.playerLrc.toString() != yrcLyric.toString()) {
        store.setPlayerLrc(yrcLyric);
      };
    };
  } catch (error) {
    console.error(error);
  };
  return requestAnimationFrame(syncYrc);
};
// 音频时间更新事件结束

// 暴露子组件方法
defineExpose({ playToggle, changeVolume, changeSong, toggleList });
</script>

<style lang="scss" scoped>
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "HarmonyOS_Regular", sans-serif !important;

  :deep(.aplayer-body) {
    background-color: transparent;

    .aplayer-pic {
      display: none;
    }

    .aplayer-info {
      margin-left: 0;
      background-color: #ffffff40;
      border-color: transparent !important;

      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 2px;
        overflow: initial;

        .aplayer-title {
          font-size: 16px;
          margin-right: 6px;
        }

        .aplayer-author {
          color: #efefef;
        }
      }

      .aplayer-lrc {
        text-align: left;
        margin: 7px 0 6px 6px;
        height: 44px;
        -webkit-mask: linear-gradient(#fff 15%,
            #fff 85%,
            hsla(0deg, 0%, 100%, 0.6) 90%,
            hsla(0deg, 0%, 100%, 0));
        mask: linear-gradient(#fff 15%,
            #fff 85%,
            hsla(0deg, 0%, 100%, 0.6) 90%,
            hsla(0deg, 0%, 100%, 0));

        &::before,
        &::after {
          display: none;
        }

        p {
          color: #efefef;
        }

        .aplayer-lrc-current {
          font-size: 0.95rem;
          margin-bottom: 4px !important;
        }
      }

      .aplayer-controller {
        display: none;
      }
    }
  }

  :deep(.aplayer-list) {
    margin-top: 6px;
    height: v-bind(listHeight);
    background-color: transparent;

    ol {
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      li {
        border-color: transparent;

        &.aplayer-list-light {
          background: #ffffff40;
          border-radius: 6px;
        }

        &:hover {
          background: #ffffff26 !important;
          border-radius: 6px !important;
        }

        .aplayer-list-index,
        .aplayer-list-author {
          color: #efefef;
        }
      }
    }
  }
}
</style>
