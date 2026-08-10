<template>
  <APlayer v-if="playList[0]" ref="player" :audio="playList" :autoplay="store.playerAutoplay" :theme="theme"
    :autoSwitch="false" :loop="store.playerLoop" :order="store.playerOrder" :volume="volume" :showLrc="true"
    :listFolded="listFolded" :listMaxHeight="listMaxHeight" :noticeSwitch="false" @play="onPlay" @pause="onPause"
    @Loadstart="onLoadStart" @timeupdate="onTimeUp" @error="loadMusicError" @canplay="onCanplay" @waiting="onWaiting" />
</template>

<script setup lang="ts">
import { Float, MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList, testGitHubConnectivity } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import type { APlayer as APlayerType } from '@worstone/vue-aplayer';
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { decodeDWQYRC } from "@/utils/decodeDWQYRC";
import { alignPilferedLyrics } from "@/utils/checkPilferDWRC";

const store = mainStore();
let showDWRCRunning = 0;
let lastTimestamp = Date.now();
let nowLineStart: number = -1;
let nowLineIndex = ref(-1);

type PlayerInstance = {
  aplayer: APlayerType;
  audioRef: HTMLAudioElement;
  audioStatus: {
    duration: number;
    playedTime: number;
  };
  toggle: () => void;
  setVolume: (volume: number, triggerEvent: boolean) => void;
  skipBack: () => void;
  skipForward: () => void;
  toggleList: () => void;
  play: () => void;
  pause: () => void;
};

type DWRCItem = [
  number,
  number,
  Array<[[number, number], string, number, number]>
];

interface PlaylistItem {
  name: string;
  artist: string;
  album?: string;
  url: string;
  cover: string;
  lrc: string;
};

// 获取播放器 DOM
const player = ref<PlayerInstance | null>(null);

// 歌曲播放列表
const playList = ref<PlaylistItem[]>([]);

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
    validator: (value: number) => {
      return value >= 0 && value <= 1;
    },
  },
  // 歌曲服务器 ( netease-网易云, tencent-qq音乐 )
  songServer: {
    type: String,
    default: "netease", //'netease' | 'tencent'
  },
  songServerSE: {
    type: String,
    default: null,
  },
  // 播放类型 ( song-歌曲, playlist-播放列表, album-专辑, search-搜索, artist-艺术家 )
  songType: {
    type: String,
    default: "playlist",
  },
  // id
  songId: {
    type: String,
    default: "7452421335",
  },
  songIdSE: {
    type: String,
    default: null,
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

// 监听播放顺序
watch(
  () => store.playerOrder,
  (newOrder) => {
    if (!player.value) return;
    if (player.value) {
      player.value.aplayer.order = newOrder;
    };
  },
);

// 监听循环模式
watch(
  () => store.playerLoop,
  (newLoop) => {
    if (!player.value) return;
    if (player.value) {
      player.value.aplayer.loop = newLoop;
    };
  },
);

// 初始化播放器
onMounted(() => {
  nextTick(() => {
    try {
      getPlayerList(props.songServer, props.songType, props.songId, props.songServerSE, props.songIdSE, store.playerTrLrc).then((res) => {
        // 更改播放器加载状态
        store.musicIsOk = true;
        // 生成歌单
        playList.value = res as PlaylistItem[];
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: "Loading...",
          });
          // 设置 Media Session 操作
          navigator.mediaSession.setActionHandler("play", () => { player.value!.play() });
          navigator.mediaSession.setActionHandler("pause", () => { player.value!.pause() });
          navigator.mediaSession.setActionHandler("nexttrack", () => { changeSong(1) });
          navigator.mediaSession.setActionHandler("previoustrack", () => { changeSong(0) });
          navigator.mediaSession.setActionHandler("seekbackward", () => { seekbackward(5) });
          navigator.mediaSession.setActionHandler("seekforward", () => { seekforward(5) });
        };
        console.log("音乐加载完成");
      });
    } catch (err) {
      console.error(err);
      store.musicIsOk = false;
      ElMessage({
        message: "播放器加载失败",
        grouping: true,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "var(--music-aplayer-message-icon-color)",
        }),
      });
      if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("播放器加载失败.mp3");
      };
    };
  });
});

// 播放
const onPlay = () => {
  if (!player.value) return;
  console.log("播放");
  playIndex.value = player.value.aplayer.index;
  const currentTrack = playList.value[playIndex.value];
  if (!currentTrack) {
    return;
  };
  // 播放状态
  store.setPlayerState(player.value.audioRef.paused);
  // 储存播放器信息
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, {
      theme: "filled",
      fill: "var(--music-aplayer-list-icon-color)",
    }),
  });

  if ("mediaSession" in navigator) {
    // 更新 Media Session 元数据
    navigator.mediaSession.metadata = new MediaMetadata({
      title: store.getPlayerData.name || "",
      artist: store.getPlayerData.artist || "",
      album: store.getPlayerData.album || "",
      artwork: [
        {
          src: playList.value[playIndex.value].cover, // 使用当前播放项的封面图像
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });
    updatePositionState();
  };

  if (store.webSpeech) {
    if (store.playerSpeechName) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
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

// 开始播放处理
const onCanplay = () => {
  // 播放状态
  store.setPlayerCanplay(true);
  updatePositionState();
};

const onWaiting = () => {
  store.setPlayerCanplay(false);
};

// 暂停
const onPause = () => {
  store.setPlayerState(player.value!.audioRef.paused);
};

// 切换播放暂停事件
const playToggle = () => {
  player.value!.toggle();
  updatePositionState();
};

// 切换音量事件
const changeVolume = (value) => {
  player.value!.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type) => {
  type === 0 ? player.value!.skipBack() : player.value!.skipForward();
  store.setPlayerCanplay(false);
  updatePositionState();
  nextTick(() => {
    player.value!.play();
  });
};

// 切换歌曲列表状态
const toggleList = () => {
  player.value!.toggleList();
};

// 快退
const seekbackward = (value) => {
  if (!player.value) return;
  const dur = player.value.audioStatus.duration;
  const currentTime = player.value.audioStatus.playedTime;
  const ti = currentTime - value;
  if (ti > dur) {
    changeSong(1);
  } else if (ti < dur) {
    player.value.aplayer.seek(0);
  } else {
    player.value.aplayer.seek(ti);
  };
  updatePositionState();
};

// 快进
const seekforward = (value) => {
  const dur = player.value!.audioStatus.duration;
  const currentTime = player.value!.audioStatus.playedTime;
  const ti = currentTime + value;
  if (ti > dur) {
    changeSong(1);
  } else if (ti < dur) {
    player.value!.aplayer.seek(0);
  } else {
    player.value!.aplayer.seek(ti);
  };
  updatePositionState();
};

// 跳转
const seektime = (value) => {
  const dur = player.value!.audioStatus.duration;
  if (value > dur) {
    changeSong(1);
  } else if (value < 0) {
    player.value!.aplayer.seek(0);
  } else {
    player.value!.aplayer.seek(value);
  };
  updatePositionState();
};

// 加载音频错误
const loadMusicError = () => {
  let notice = "";
  if (playList.value.length > 1) {
    notice = "播放歌曲出现错误，播放器将在 2s 后进行下一首";
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("歌曲加载失败.mp3");
    };
  } else {
    notice = "播放歌曲出现错误";
    if (store.webSpeech) {
      stopSpeech();
      const voice = envConfig.VITE_TTS_Voice;
      const vstyle = envConfig.VITE_TTS_Style;
      SpeechLocal("播放器未知异常.mp3");
    };
  };
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "var(--music-aplayer-message-icon-color)",
      duration: 2000,
    }),
  });
  console.error(
    "播放歌曲: " + player.value!.aplayer.audio[player.value!.aplayer.index].name + " 出现错误",
  );
};

// 音频时间更新事件
const fetchDWRC = async (dwrcUrl: string) => {
  // 逐字接入模块
  const dwrcSource = await fetch(dwrcUrl);
  const dwrcText = await dwrcSource.text();
  store.dwrcIndex = playIndex.value;
  try {
    const decoded = decodeDWQYRC(dwrcText, store.playerRMMetadata);
    store.dwrcTemp = Array.isArray(decoded) ? decoded as DWRCItem[] : [];
    store.dwrcLoading = false;
    store.dwrcEnable = true;
    return;
  } catch (e) {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  };
  // 额外处理
  const songUrlInf = new URLSearchParams(new URL(dwrcUrl).search);
  const songId = songUrlInf.get("id");
  const songServer = songUrlInf.get("server");
  const baseUrl = `${new URL(dwrcUrl).origin}${new URL(dwrcUrl).pathname}`;
  if (!songId) {
    return;
  };
  // 接入 AMLL TTML Database
  if (store.playerDWRCATDB) {
    const songUrlInfUrl = store.playerDWRCATDBF
      ? {
        netease: `https://ghfast.top/https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
        tencent: `https://ghfast.top/https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/qq-lyrics/${songId}.qrc`,
      }
      : {
        netease: `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
        tencent: `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/qq-lyrics/${songId}.qrc`,
      };
    if (!songServer || !["netease", "tencent"].includes(songServer)) {
      return;
    };
    try {
      const amllUrl = songUrlInfUrl[songServer].replace("${songIdlrc}", songId);
      const amllSource = await fetch(amllUrl);
      if (amllSource.status === 404) {
        store.dwrcTemp = [];
        store.dwrcLoading = false;
        store.dwrcEnable = false;
      } else if (!amllSource.ok) {
        throw new Error(`AMLL TTML Database 调用失败...`);
      } else {
        const amllText = await amllSource.text();
        const decoded = decodeDWQYRC(amllText, store.playerRMMetadata);
        store.dwrcTemp = Array.isArray(decoded) ? decoded as DWRCItem[] : [];
        store.dwrcLoading = false;
        store.dwrcEnable = true;
        return;
      };
    } catch (e) {
      if (store.playerDWRCATDBF) {
        const songUrlInfUrlse = {
          netease: `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
          tencent: `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/qq-lyrics/${songId}.qrc`,
        };
        if (songServer || ["netease", "tencent"].includes(songServer)) {
          try {
            const amllUrlse = songUrlInfUrlse[songServer].replace("${songIdlrc}", songId);
            const amllSourcese = await fetch(amllUrlse);
            if (amllSourcese.status === 404) {
              store.dwrcTemp = [];
              store.dwrcLoading = false;
              store.dwrcEnable = false;
            } else if (!amllSourcese.ok) {
              store.dwrcTemp = [];
              store.dwrcLoading = false;
              store.dwrcEnable = false;
            } else {
              const amllTextse = await amllSourcese.text();
              const decodedse = decodeDWQYRC(amllTextse, store.playerRMMetadata);
              store.dwrcTemp = Array.isArray(decodedse) ? decodedse as DWRCItem[] : [];
              store.dwrcLoading = false;
              store.dwrcEnable = true;
              return;
            };
          } catch (e) {
            store.dwrcTemp = [];
            store.dwrcLoading = false;
            store.dwrcEnable = false;
          };
        };
      };
    };
  } else {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  };
  // 偷东西
  if (store.playerDWRCPilfer && baseUrl && store.dwrcEnable != true) {
    try {
      const currentAudio = player.value!.aplayer.audio[player.value!.aplayer.index];
      const currentName = currentAudio.name?.trim();
      const currentArtist = currentAudio.artist?.trim();
      const currentServer = songServer === "netease" ? "tencent" : "netease";
      const pilferUrl = `${baseUrl}?server=${currentServer}&type=search&id=0&dwrc=true&keyword=${encodeURIComponent(currentName)}`;
      const resp = await fetch(pilferUrl);
      const data = await resp.json();
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === "object" ? Object.values(data) : []);
      if (list.length > 0) {
        const stripBrackets = (title?: string) => {
          if (!title) return '';
          let result = String(title);
          const pairRegex = /[（(\[{<【《][^（(\[{<【《）)\]}>】》]*[）)\]}>】》]/g;
          let depth = 0;
          const MAX_DEPTH = 10;
          while (depth < MAX_DEPTH) {
            const previousResult = result;
            result = result.replace(pairRegex, '');
            if (result.length === previousResult.length) {
              break;
            };
            depth++;
          };
          result = result.replace(/[（(\[{<【《）)\]}>】》]/g, '');
          return result.replace(/\s+/g, ' ').trim();
        };
        const normalizeArtist = (name?: string) => {
          if (!name) return '';
          return stripBrackets(name);
        };
        const normalizedCurrentName = stripBrackets(currentName);
        const normalizedCurrentArtist = normalizeArtist(currentArtist);
        const match = list.find(
          (item) =>
            stripBrackets(item.name) === normalizedCurrentName &&
            normalizeArtist(item.artist) === normalizedCurrentArtist
        );
        if (match && match.lrc) {
          let lrcUrl = match.lrc;
          const urlObj = new URL(lrcUrl);
          const dwrcParam = urlObj.searchParams.get("dwrc");
          if (dwrcParam === null) {
            urlObj.searchParams.append("dwrc", "true");
          } else if (dwrcParam === "false") {
            urlObj.searchParams.set("dwrc", "true");
          };
          lrcUrl = urlObj.toString();
          const pilferSource = await fetch(lrcUrl);
          const pilferText = await pilferSource.text();
          const originalLrcUrl = player.value!.aplayer.audio[player.value!.aplayer.index]["lrc"];
          const sourceLrcResp = await fetch(originalLrcUrl);
          const sourceLrcText = await sourceLrcResp.text();
          const processedText = alignPilferedLyrics(pilferText, sourceLrcText);
          if (processedText) {
            const decoded = decodeDWQYRC(processedText, store.playerRMMetadata);
            store.dwrcTemp = Array.isArray(decoded) ? (decoded as DWRCItem[]) : [];
            store.dwrcLoading = false;
            store.dwrcEnable = true;
            console.log(`当前正在播放 ${songServer} 来源的《${store.getPlayerData.name}》- '${store.getPlayerData.artist}'，已成功从 ${currentServer} 偷到逐字歌词~`);
            return;
          } else {
            store.dwrcTemp = [];
            store.dwrcLoading = false;
            store.dwrcEnable = false;
          };
        } else {
          store.dwrcTemp = [];
          store.dwrcLoading = false;
          store.dwrcEnable = false;
        };
      } else {
        store.dwrcTemp = [];
        store.dwrcLoading = false;
        store.dwrcEnable = false;
      };
    } catch (e) {
      store.dwrcTemp = [];
      store.dwrcLoading = false;
      store.dwrcEnable = false;
    }
  } else {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  };
  store.dwrcTemp = [];
  store.dwrcLoading = false;
  store.dwrcEnable = false;
};

function onLoadStart() {
  // 逐字获取模块
  if (!player.value) return;
  nowLineIndex.value = -1;
  try {
    if (player.value == null || player.value.aplayer == null) {
      return;
    };
    const lyrics = player.value.aplayer.lyrics[playIndex.value];
    if (store.playerDWRCShow != true) {
      store.dwrcEnable = false;
      store.dwrcTemp = [];
      store.dwrcLoading = false;
      return;
    };
    if (store.dwrcIndex == playIndex.value) {
      return;
    };
    const dwrcUrl = player.value!.aplayer.audio[player.value!.aplayer.index]["lrc"] + "&dwrc=true";
    store.dwrcIndex = playIndex.value;
    store.dwrcLoading = true;
    fetchDWRC(dwrcUrl);
  } catch (error) {
    store.dwrcEnable = false;
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    console.error(error);
  };
};

const onTimeUp = () => {
  if (!player.value) return;
  const lastTime = store.playerCurrentTime;
  const newTime = player.value.audioStatus.playedTime;
  if (lastTime && Math.abs(newTime - lastTime) > 1) {
    store.lyricSeekVersion++;
    nowLineIndex.value = -1;
  };
  store.playerCurrentTime = newTime;
  store.playerDuration = player.value.audioStatus.duration;
  if (showDWRCRunning == 0 && player.value != null && player.value.aplayer != null) {
    requestAnimationFrame(syncDWRCLrc);
  };
};

function updatePositionState() {
  if (!player.value) return;
  navigator.mediaSession.setPositionState({
    duration: player.value!.audioStatus.duration,
    position: player.value!.audioStatus.playedTime,
  });
};

function syncDWRCLrc() {
  showDWRCRunning = 1;
  try {
    if (!player.value || !player.value.aplayer) {
      return requestAnimationFrame(syncDWRCLrc);
    };
    const isLineByLine = !store.dwrcEnable || store.dwrcTemp.length === 0 || store.dwrcLoading;
    const now = player.value.audioStatus.playedTime * 1000;
    const lineSwitchNow = now + 200; // 提前 100ms 用于行切换
    if (isLineByLine) {
      const lyrics = player.value.aplayer.lyrics[playIndex.value];
      const playerLyricIndex = player.value.aplayer.lyricIndex;
      if (!lyrics || !lyrics[playerLyricIndex]) {
        const lrc = "歌词加载中...";
        if (store.playerLrc.length !== 1 || store.playerLrc[0][4] !== lrc) {
          store.setPlayerLrc([[true, 1, 0, 0, lrc]]);
        };
      } else {
        let lrc = lyrics[playerLyricIndex][1];
        if (lrc === "Loading") lrc = "歌词加载中...";
        if (store.playerLrc.length !== 1 || store.playerLrc[0][4] !== lrc || store.playerLrc[0][2] !== playerLyricIndex) {
          store.setPlayerLrc([[true, 1, playerLyricIndex, 0, lrc]]);
        };
      };
    } else {
      const dwrc = store.dwrcTemp;
      if (nowLineIndex.value === -1) {
        let foundIndex = -1;
        for (let i = 0; i < dwrc.length; i++) {
          if (dwrc[i][0] <= lineSwitchNow) {
            // now -> lineSwitchNow
            foundIndex = i;
          } else {
            break;
          };
        };
        nowLineIndex.value = foundIndex;
      } else {
        if (nowLineIndex.value + 1 < dwrc.length && lineSwitchNow >= dwrc
        [nowLineIndex.value + 1][0]) {
          // now -> lineSwitchNow
          nowLineIndex.value++;
        };
      };
      const currentLine = nowLineIndex.value !== -1 ? dwrc[nowLineIndex.value] : null;
      let dwrcLyric: any[];
      if (currentLine) {
        const fadeOutDuration = 300;
        dwrcLyric = currentLine[2].map((it: any) => {
          const [[start, duration], word, line, row] = it;
          const isDuringFadeOut = now > start + duration && now <= start + duration + fadeOutDuration;
          const isCurrent = (now >= start && now <= start + duration) || isDuringFadeOut;
          const isSungLyrics = start + duration < now && !isDuringFadeOut;
          const lessdur = start + duration - now;
          return [isCurrent, isSungLyrics, line, row, word, duration, lessdur, "auto"];
        });
      } else {
        dwrcLyric = [[true, 1, 0, 0, `${store.getPlayerData.name || 'Loading...'} - ${store.getPlayerData.artist || 'NanoRocky'}`]];
      };
      store.setPlayerLrc(dwrcLyric);
    };
  } catch (error) {
    console.error("Error in syncDWRCLrc:", error);
  } finally {
    requestAnimationFrame(syncDWRCLrc);
  };
};

// 暴露子组件方法
defineExpose({ playToggle, changeVolume, changeSong, toggleList });
</script>

<style lang="scss" scoped>
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "MiSans VF", sans-serif !important;

  :deep(.aplayer-body) {
    background-color: transparent;

    .aplayer-pic {
      display: none;
    }

    .aplayer-info {
      margin-left: 0;
      background-color: var(--music-player-list-bgc);
      border-color: transparent !important;

      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 2px;
        overflow: initial;

        .aplayer-title {
          font-size: 1rem;
          margin-right: 6px;
        }

        .aplayer-author {
          color: var(--text-color);
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
          color: var(--text-color);
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
          background: var(--music-player-list-bgc);
          border-radius: 6px;
        }

        &:hover {
          background: var(--music-player-list-hover-bgc) !important;
          border-radius: 6px !important;
        }

        .aplayer-list-index,
        .aplayer-list-author {
          color: var(--text-color);
        }
      }
    }
  }
}
</style>
