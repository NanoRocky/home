<template>
  <APlayer v-if="playList[0]" ref="player" :audio="playList" :autoplay="store.playerAutoplay" :theme="theme"
    :autoSwitch="false" :loop="store.playerLoop" :order="store.playerOrder" :volume="volume" :showLrc="true"
    :preload="playerPreload" :listFolded="listFolded" :listMaxHeight="listMaxHeight" :noticeSwitch="false"
    @play="onPlay" @pause="onPause" @Loadstart="onLoadStart" @timeupdate="onTimeUp" @error="loadMusicError"
    @canplay="onCanplay" @waiting="onWaiting" @seeked="() => updatePositionState()"
    @durationchange="() => updatePositionState()" @loadedmetadata="() => updatePositionState()" />
</template>

<script setup lang="ts">
import { Float, MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList, testGitHubConnectivity } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import type { APlayer as APlayerType } from "@worstone/vue-aplayer";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { decodeDWQYRC } from "@/utils/decodeDWQYRC";
import { alignPilferedLyrics } from "@/utils/checkPilferDWRC";
import {
  initTranslationLrc,
  onPilferSuccess,
  syncTranslationLrc,
  clearTranslationLrc,
} from "@/utils/translationLyric";
import { useI18n } from "vue-i18n";
import { gasA } from "@/utils/authServer";

const store = mainStore();
const { t } = useI18n();
let showDWRCRunning = 0;
let lastTimestamp = Date.now();
let nowLineStart: number = -1;
let nowLineIndex = ref(-1);
let lastMediaSessionSongKey = "";
let lastReportedDuration = 0;

const playerPreload = computed(() => (import.meta.env.VITE_METING_SKEY ? "none" : "metadata"));
type DWRCItem = [number, number, Array<[[number, number], string, number, number]>];

const parseTTL = (val?: string): number => {
  if (!val) return 7000;
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return 7000;
  return num < 100 ? Math.round(num * 1000) : Math.round(num);
};

const SIGN_TTL = parseTTL(import.meta.env.VITE_METING_SKEY_TTL);

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
  setAudio?: (audio: any) => void;
};

interface PlaylistItem {
  name: string;
  artist: string;
  album?: string;
  url: string;
  rawUrl?: string;
  _signedUrl?: string;
  _signTime?: number;
  _signingPromise?: Promise<string>;
  cover: string;
  lrc: string;
}

const signAudioUrl = async (rawUrl?: string): Promise<string | null> => {
  const skey = import.meta.env.VITE_METING_SKEY;
  if (!skey || !rawUrl) return null;

  try {
    const urlObj = new URL(rawUrl);
    const songApi = import.meta.env.VITE_SONG_API;
    if (songApi) {
      try {
        const songApiOrigin = new URL(songApi).origin;
        if (urlObj.origin !== songApiOrigin) {
          return null;
        }
      } catch { }
    }
    return await gasA(rawUrl, skey);
  } catch (error) {
    console.error("音频 URL 签名失败:", error);
    return null;
  }
};

const ensureAudioSigned = async (audioItem: any): Promise<string> => {
  if (!audioItem) return "";
  const rawUrl = audioItem.rawUrl || audioItem.url || "";
  if (!rawUrl) return "";

  if (audioItem._signedUrl && audioItem._signTime && Date.now() - audioItem._signTime < SIGN_TTL) {
    return audioItem._signedUrl;
  }

  if (audioItem._signingPromise) {
    return audioItem._signingPromise;
  }

  audioItem._signingPromise = (async () => {
    try {
      const signed = await signAudioUrl(rawUrl);
      if (signed) {
        audioItem.url = signed;
        audioItem._signedUrl = signed;
        audioItem._signTime = Date.now();
        return signed;
      }
      audioItem._signedUrl = audioItem.url || rawUrl;
      audioItem._signTime = Date.now();
      return audioItem._signedUrl;
    } finally {
      delete audioItem._signingPromise;
    }
  })();

  return audioItem._signingPromise;
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
    default: "3035221869",
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
    }
  },
);

// 监听循环模式
watch(
  () => store.playerLoop,
  (newLoop) => {
    if (!player.value) return;
    if (player.value) {
      player.value.aplayer.loop = newLoop;
    }
  },
);

// 监听翻译歌词开关
watch(
  () => store.playerTrLrc,
  (val) => {
    if (val) {
      if (player.value && player.value.aplayer) {
        const currentAudio = player.value.aplayer.audio[player.value.aplayer.index];
        if (currentAudio && currentAudio.lrc) {
          initTranslationLrc(currentAudio.lrc, player.value.aplayer.index, store);
        }
      }
    } else {
      clearTranslationLrc(store);
    }
  },
);

// 初始化播放器
onMounted(() => {
  nextTick(() => {
    try {
      getPlayerList(
        props.songServer,
        props.songType,
        props.songId,
        props.songServerSE,
        props.songIdSE,
        store.clientUUID,
      ).then(async (res) => {
        // 更改播放器加载状态
        store.musicIsOk = true;
        const items = res as PlaylistItem[];
        const metingSkey = import.meta.env.VITE_METING_SKEY;
        // 生成歌单
        playList.value = items;
        nextTick(() => {
          if (player.value) {
            let setAudioToken = 0;
            if (metingSkey) {
              const originalSetAudio = (player.value as any).setAudio;
              if (originalSetAudio) {
                (player.value as any).setAudio = async function (audioItem: any) {
                  const myToken = ++setAudioToken;
                  if (!audioItem) {
                    originalSetAudio.call(this, audioItem);
                    return;
                  }
                  const signedUrl = await ensureAudioSigned(audioItem);
                  if (myToken !== setAudioToken) {
                    return;
                  }
                  if (signedUrl) {
                    audioItem.url = signedUrl;
                  }
                  originalSetAudio.call(this, audioItem);
                  if (this.audioStatus?.playStatus) {
                    this.audioRef?.play()?.catch(() => { });
                  }
                };
              }
            }

            if (player.value.audioRef) {
              const originalPlay = player.value.audioRef.play;
              player.value.audioRef.play = function () {
                if (metingSkey && player.value?.audioRef) {
                  const idx = player.value?.aplayer?.index ?? 0;
                  const currentAudio = player.value?.aplayer?.audio?.[idx];
                  const audioEl = player.value.audioRef;
                  const isSameAudioSrc =
                    Boolean(currentAudio?._signedUrl) &&
                    (audioEl.src === currentAudio._signedUrl ||
                      audioEl.src.includes(currentAudio._signedUrl)) &&
                    !audioEl.error;

                  if (currentAudio && !isSameAudioSrc) {
                    return ensureAudioSigned(currentAudio)
                      .then((signedUrl) => {
                        if (
                          signedUrl &&
                          player.value?.audioRef &&
                          player.value.audioRef.src !== signedUrl
                        ) {
                          player.value.audioRef.src = signedUrl;
                        }
                        return originalPlay.call(this);
                      })
                      .catch(() => originalPlay.call(this));
                  }
                }
                const playPromise = originalPlay.call(this);
                if (playPromise !== undefined) {
                  playPromise.catch((error: any) => {
                    if (error?.name === "NotAllowedError") {
                      console.warn(t("console.player.autoPlayError"), error);
                      ElMessage({
                        message: t("components.music.autoPlayError"),
                        grouping: true,
                        icon: h(PlayWrong, {
                          theme: "filled",
                          fill: "var(--music-aplayer-message-icon-color)",
                        }),
                      });
                      store.setPlayerState(true);
                    }
                  });
                }
                return playPromise;
              };
            }
          }
        });

        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: "Loading...",
          });
          // 设置 Media Session 操作
          navigator.mediaSession.setActionHandler("play", () => {
            player.value!.play();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            player.value!.pause();
          });
          navigator.mediaSession.setActionHandler("nexttrack", () => {
            changeSong(1);
          });
          navigator.mediaSession.setActionHandler("previoustrack", () => {
            changeSong(0);
          });
          navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            seekbackward(details?.seekOffset || 5);
          });
          navigator.mediaSession.setActionHandler("seekforward", (details) => {
            seekforward(details?.seekOffset || 5);
          });
          try {
            navigator.mediaSession.setActionHandler("seekto", (details) => {
              if (details.seekTime !== undefined && details.seekTime !== null) {
                seektime(details.seekTime);
              }
            });
          } catch { }
        }
        console.log(t("console.player.musicLoaded"));
      });
    } catch (err) {
      console.error(err);
      store.musicIsOk = false;
      ElMessage({
        message: t("components.music.playerLoadFailed"),
        grouping: true,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "var(--music-aplayer-message-icon-color)",
        }),
      });
      if (store.webSpeech) {
        stopSpeech();
        const voice = import.meta.env.VITE_TTS_Voice;
        const vstyle = import.meta.env.VITE_TTS_Style;
        SpeechLocal("播放器加载失败.mp3");
      }
    }
  });
});

// 播放
const onPlay = () => {
  if (!player.value) return;
  nowLineIndex.value = -1;
  playIndex.value = player.value.aplayer.index;
  const currentTrack = playList.value[playIndex.value];
  if (!currentTrack) {
    return;
  }
  // 播放状态
  store.setPlayerState(player.value.audioRef.paused);
  // 储存播放器信息
  store.setPlayerData(currentTrack.name, currentTrack.artist, currentTrack.album || null);

  const songKey = `${playIndex.value}-${currentTrack.name}-${currentTrack.artist}`;
  const isNewTrack = lastMediaSessionSongKey !== songKey;

  if (isNewTrack) {
    lastMediaSessionSongKey = songKey;
    console.log(t("console.player.play"));
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
        title: store.getPlayerData.name || currentTrack.name || "",
        artist: store.getPlayerData.artist || currentTrack.artist || "",
        album: currentTrack.album || store.getPlayerData.album || "",
        artwork: currentTrack.cover
          ? [
            {
              src: currentTrack.cover,
              sizes: "512x512",
            },
          ]
          : [],
      });
      navigator.mediaSession.playbackState = "playing";
      updatePositionState();
    }

    if (store.webSpeech) {
      if (store.playerSpeechName) {
        stopSpeech();
        const voice = import.meta.env.VITE_TTS_Voice;
        const vstyle = import.meta.env.VITE_TTS_Style;
        Speech(
          t("components.music.playing") +
          store.getPlayerData.artist +
          t("components.music.ofSong") +
          store.getPlayerData.name +
          "》。",
          voice,
          vstyle,
        );
      }
    }
  } else {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
    updatePositionState();
  }
};

// 开始播放处理
const onCanplay = () => {
  lastDwrcLyricStr = "";
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
  lastDwrcLyricStr = "";
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "paused";
  }
  updatePositionState();
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

// 跳转
const seektime = (value: number) => {
  if (!player.value) return;
  const dur =
    player.value.audioRef && !isNaN(player.value.audioRef.duration) && isFinite(player.value.audioRef.duration) && player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : (player.value.audioStatus?.duration || store.playerDuration || 0);

  if (dur > 0 && value >= dur) {
    changeSong(1);
    return;
  }
  const targetTime = Math.max(0, dur > 0 ? Math.min(value, dur) : Math.max(0, value));

  if (typeof (player.value as any).seek === "function") {
    (player.value as any).seek(targetTime);
  }
  if (player.value.audioRef) {
    player.value.audioRef.currentTime = targetTime;
  }
  if (player.value.audioStatus) {
    player.value.audioStatus.playedTime = targetTime;
  }
  store.playerCurrentTime = targetTime;
  updatePositionState(targetTime);
};

// 快退
const seekbackward = (value: number = 5) => {
  if (!player.value) return;
  const currentTime = player.value.audioRef?.currentTime || player.value.audioStatus?.playedTime || 0;
  seektime(currentTime - value);
};

// 快进
const seekforward = (value: number = 5) => {
  if (!player.value) return;
  const currentTime = player.value.audioRef?.currentTime || player.value.audioStatus?.playedTime || 0;
  seektime(currentTime + value);
};

// 加载音频错误
const loadMusicError = () => {
  store.lyricSource = null;
  let notice = "";
  if (playList.value.length > 1) {
    notice = t("components.music.songLoadFailedNext");
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("歌曲加载失败.mp3");
    }
  } else {
    notice = t("components.music.studioError");
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("播放器未知异常.mp3");
    }
  }
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
    t("components.music.songErrorLog") +
    player.value!.aplayer.audio[player.value!.aplayer.index].name +
    t("components.music.songErrorPostfix"),
  );
};

const checkFallbackLyricSource = (expectedIndex: number, sServer: string | null) => {
  if (playIndex.value !== expectedIndex) return;
  const lyrics = player.value?.aplayer?.lyrics?.[expectedIndex];
  if (lyrics && lyrics.length > 0) {
    const firstLineText = lyrics[0]?.[1];
    if (firstLineText === "Not available" || firstLineText === "Not availible") {
      store.lyricSource = null;
    } else if (firstLineText !== "Loading") {
      store.lyricSource = sServer;
    }
  } else {
    store.lyricSource = null;
  }
};

const notifyExternalLyricLoaded = () => {
  const isMobile =
    store.mobileOpenState ||
    (store.innerWidth != null && store.innerWidth <= 720) ||
    (typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)));

  const key = isMobile
    ? "components.music.externalLyricLoadedMobile"
    : "components.music.externalLyricLoaded";

  ElMessage({
    message: t(key),
    grouping: true,
  });
};

// 音频时间更新事件
const fetchDWRC = async (dwrcUrl: string, expectedIndex: number) => {
  // 逐字接入模块
  const songUrlInf = new URLSearchParams(new URL(dwrcUrl).search);
  const songId = songUrlInf.get("id");
  const songServer = songUrlInf.get("server") || store.songServer;
  const baseUrl = `${new URL(dwrcUrl).origin}${new URL(dwrcUrl).pathname}`;

  try {
    const dwrcSource = await fetch(dwrcUrl);
    const dwrcText = await dwrcSource.text();
    if (playIndex.value !== expectedIndex) return;
    store.dwrcIndex = playIndex.value;
    const decoded = await decodeDWQYRC(dwrcText, store.playerRMMetadata);
    store.dwrcTemp = Array.isArray(decoded) ? (decoded as DWRCItem[]) : [];
    store.dwrcLoading = false;
    store.dwrcEnable = true;
    store.lyricSource = songServer;
    return;
  } catch (e) {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  }
  if (!songId) {
    checkFallbackLyricSource(expectedIndex, songServer);
    return;
  }
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
    }
    try {
      const amllUrl = songUrlInfUrl[songServer].replace("${songIdlrc}", songId);
      const amllSource = await fetch(amllUrl);
      if (amllSource.status === 404) {
        if (playIndex.value !== expectedIndex) return;
        store.dwrcTemp = [];
        store.dwrcLoading = false;
        store.dwrcEnable = false;
      } else if (!amllSource.ok) {
        if (playIndex.value !== expectedIndex) return;
        throw new Error(t("console.player.amllFail"));
      } else {
        const amllText = await amllSource.text();
        if (playIndex.value !== expectedIndex) return;
        const decoded = await decodeDWQYRC(amllText, store.playerRMMetadata);
        store.dwrcTemp = Array.isArray(decoded) ? (decoded as DWRCItem[]) : [];
        store.dwrcLoading = false;
        store.dwrcEnable = true;
        store.lyricSource = "amll";
        notifyExternalLyricLoaded();
        return;
      }
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
            if (playIndex.value !== expectedIndex) return;
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
              const decodedse = await decodeDWQYRC(amllTextse, store.playerRMMetadata);
              store.dwrcTemp = Array.isArray(decodedse) ? (decodedse as DWRCItem[]) : [];
              store.dwrcLoading = false;
              store.dwrcEnable = true;
              store.lyricSource = "amll";
              notifyExternalLyricLoaded();
              return;
            }
          } catch (e) {
            store.dwrcTemp = [];
            store.dwrcLoading = false;
            store.dwrcEnable = false;
          }
        }
      }
    }
  } else {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  }
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
      if (playIndex.value !== expectedIndex) return;
      const list = Array.isArray(data)
        ? data
        : data && typeof data === "object"
          ? Object.values(data)
          : [];
      if (list.length > 0) {
        const stripBrackets = (title?: string) => {
          if (!title) return "";
          let result = String(title);
          const pairRegex = /[（(\[{<【《][^（(\[{<【《）)\]}>】》]*[）)\]}>】》]/g;
          let depth = 0;
          const MAX_DEPTH = 10;
          while (depth < MAX_DEPTH) {
            const previousResult = result;
            result = result.replace(pairRegex, "");
            if (result.length === previousResult.length) {
              break;
            }
            depth++;
          }
          result = result.replace(/[（(\[{<【《）)\]}>】》]/g, "");
          return result.replace(/\s+/g, " ").trim();
        };
        const normalizeArtist = (name?: string) => {
          if (!name) return "";
          return stripBrackets(name);
        };
        const normalizedCurrentName = stripBrackets(currentName);
        const normalizedCurrentArtist = normalizeArtist(currentArtist);
        const match = list.find(
          (item) =>
            stripBrackets(item.name) === normalizedCurrentName &&
            normalizeArtist(item.artist) === normalizedCurrentArtist,
        );
        if (match && match.lrc) {
          let lrcUrl = match.lrc;
          const urlObj = new URL(lrcUrl);
          const dwrcParam = urlObj.searchParams.get("dwrc");
          if (dwrcParam === null) {
            urlObj.searchParams.append("dwrc", "true");
          } else if (dwrcParam === "false") {
            urlObj.searchParams.set("dwrc", "true");
          }
          lrcUrl = urlObj.toString();
          const pilferSource = await fetch(lrcUrl);
          const pilferText = await pilferSource.text();
          const originalLrcUrl = player.value!.aplayer.audio[player.value!.aplayer.index]["lrc"];
          const sourceLrcResp = await fetch(originalLrcUrl);
          const sourceLrcText = await sourceLrcResp.text();
          if (playIndex.value !== expectedIndex) return;
          const processedText = await alignPilferedLyrics(pilferText, sourceLrcText);
          if (processedText) {
            const decoded = await decodeDWQYRC(processedText, store.playerRMMetadata);
            store.dwrcTemp = Array.isArray(decoded) ? (decoded as DWRCItem[]) : [];
            store.dwrcLoading = false;
            store.dwrcEnable = true;
            store.lyricSource = currentServer;
            onPilferSuccess(match.lrc, expectedIndex, store);
            notifyExternalLyricLoaded();
            console.log(
              t("console.player.dwrcPilfering", {
                songServer,
                name: store.getPlayerData.name,
                artist: store.getPlayerData.artist,
                currentServer,
              }),
            );
            return;
          } else {
            store.dwrcTemp = [];
            store.dwrcLoading = false;
            store.dwrcEnable = false;
          }
        } else {
          store.dwrcTemp = [];
          store.dwrcLoading = false;
          store.dwrcEnable = false;
        }
      } else {
        store.dwrcTemp = [];
        store.dwrcLoading = false;
        store.dwrcEnable = false;
      }
    } catch (e) {
      store.dwrcTemp = [];
      store.dwrcLoading = false;
      store.dwrcEnable = false;
    }
  } else {
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.dwrcEnable = false;
  }
  if (playIndex.value !== expectedIndex) return;
  store.dwrcTemp = [];
  store.dwrcLoading = false;
  store.dwrcEnable = false;
  checkFallbackLyricSource(expectedIndex, songServer);
};

function onLoadStart() {
  // 逐字获取与翻译歌词模块
  if (!player.value) return;
  nowLineIndex.value = -1;
  lastDwrcLyricStr = "";
  store.lyricSource = null;
  store.songServer = null;
  try {
    if (player.value == null || player.value.aplayer == null) {
      return;
    }
    const currentAudio = player.value.aplayer.audio[player.value.aplayer.index];
    let songServer: string | null = null;
    if (currentAudio && currentAudio.lrc) {
      try {
        const urlObj = new URL(currentAudio.lrc);
        songServer = urlObj.searchParams.get("server");
      } catch (e) {
        const match = currentAudio.lrc.match(/[?&]server=([^&]+)/);
        if (match) songServer = match[1];
      }
      initTranslationLrc(currentAudio.lrc, player.value.aplayer.index, store);
    }
    store.songServer = songServer;
    if (store.playerDWRCShow != true) {
      store.dwrcEnable = false;
      store.dwrcTemp = [];
      store.dwrcLoading = false;
      checkFallbackLyricSource(playIndex.value, songServer);
      return;
    }
    if (store.dwrcIndex == playIndex.value) {
      return;
    }
    const dwrcUrl = player.value!.aplayer.audio[player.value!.aplayer.index]["lrc"] + "&dwrc=true";
    store.dwrcIndex = playIndex.value;
    store.dwrcLoading = true;
    fetchDWRC(dwrcUrl, playIndex.value);
  } catch (error) {
    store.dwrcEnable = false;
    store.dwrcTemp = [];
    store.dwrcLoading = false;
    store.lyricSource = null;
    console.error(error);
  }
}

const onTimeUp = () => {
  if (!player.value) return;
  const lastTime = store.playerCurrentTime;
  const newTime = player.value.audioStatus.playedTime;
  if (lastTime && Math.abs(newTime - lastTime) > 1) {
    store.lyricSeekVersion++;
    nowLineIndex.value = -1;
  }
  store.playerCurrentTime = newTime;
  const dur =
    player.value.audioRef && !isNaN(player.value.audioRef.duration) && isFinite(player.value.audioRef.duration) && player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : player.value.audioStatus.duration;
  store.playerDuration = dur;
  if (showDWRCRunning == 0 && player.value != null && player.value.aplayer != null) {
    requestAnimationFrame(syncDWRCLrc);
  }
  if (dur && dur > 0 && Math.abs(dur - lastReportedDuration) > 0.5) {
    lastReportedDuration = dur;
    updatePositionState();
  }
};

function updatePositionState(overridePos?: number) {
  if (
    !("mediaSession" in navigator) ||
    !("setPositionState" in navigator.mediaSession) ||
    !player.value
  ) {
    return;
  }
  const dur =
    player.value.audioRef && !isNaN(player.value.audioRef.duration) && isFinite(player.value.audioRef.duration) && player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : (player.value.audioStatus?.duration || store.playerDuration || 0);

  const pos =
    overridePos !== undefined
      ? overridePos
      : player.value.audioRef && !isNaN(player.value.audioRef.currentTime) && isFinite(player.value.audioRef.currentTime)
        ? player.value.audioRef.currentTime
        : (player.value.audioStatus?.playedTime || 0);

  if (typeof dur === "number" && !isNaN(dur) && isFinite(dur) && dur > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: player.value.audioRef?.playbackRate || 1,
        position: Math.min(Math.max(pos, 0), dur),
      });
    } catch {
      // 忽略边缘情况下浏览器的校验报错
    }
  }
}

let lastDwrcLyricStr = "";
function syncDWRCLrc() {
  showDWRCRunning = 1;
  try {
    if (!player.value || !player.value.aplayer) {
      return requestAnimationFrame(syncDWRCLrc);
    }
    const isLineByLine = !store.dwrcEnable || store.dwrcTemp.length === 0 || store.dwrcLoading;
    const now = store.isDragging
      ? store.dragProgressTime * 1000
      : player.value.audioRef && !isNaN(player.value.audioRef.currentTime)
        ? player.value.audioRef.currentTime * 1000
        : player.value.audioStatus.playedTime * 1000;
    const lineSwitchNow = now + 200; // 提前 100ms 用于行切换
    syncTranslationLrc(lineSwitchNow / 1000, store);
    if (isLineByLine) {
      const lyrics = player.value.aplayer.lyrics[playIndex.value];
      const playerLyricIndex = player.value.aplayer.lyricIndex;
      if (!lyrics || !lyrics[playerLyricIndex]) {
        const lrc = t("components.music.lrcSearching");
        if (store.playerLrc.length !== 1 || store.playerLrc[0][4] !== lrc) {
          store.setPlayerLrc([[true, 1, 0, 0, lrc, 0, 0, "auto", 0]]);
          lastDwrcLyricStr = "";
        }
      } else {
        let lrc = lyrics[playerLyricIndex][1];
        if (lrc === "Loading") {
          lrc = t("components.music.lrcSearching");
        } else if (lrc === "Not available" || lrc === "Not availible") {
          lrc = t("components.music.lrcNotFound");
          if (store.lyricSource !== null) {
            store.lyricSource = null;
          }
        } else {
          if (!store.dwrcEnable && store.songServer && store.lyricSource !== store.songServer) {
            store.lyricSource = store.songServer;
          }
        }

        let startTime = 0;
        let duration = 0;
        if (typeof lyrics[playerLyricIndex][0] === "number") {
          startTime = lyrics[playerLyricIndex][0] * 1000;
          let nextTime = store.playerDuration ? store.playerDuration * 1000 : startTime + 5000;
          if (lyrics[playerLyricIndex + 1] && typeof lyrics[playerLyricIndex + 1][0] === "number") {
            nextTime = lyrics[playerLyricIndex + 1][0] * 1000;
          }
          duration = nextTime - startTime;
        }

        if (
          store.playerLrc.length !== 1 ||
          store.playerLrc[0][4] !== lrc ||
          store.playerLrc[0][2] !== playerLyricIndex
        ) {
          store.setPlayerLrc([[true, 1, playerLyricIndex, 0, lrc, duration, 0, "auto", startTime]]);
          lastDwrcLyricStr = "";
        }
      }
    } else {
      const dwrc = store.dwrcTemp;
      let foundIndex = -1;
      for (let i = 0; i < dwrc.length; i++) {
        if (dwrc[i][0] <= lineSwitchNow) {
          foundIndex = i;
        } else {
          break;
        }
      }

      if (nowLineIndex.value === -1) {
        nowLineIndex.value = foundIndex;
      } else if (foundIndex !== nowLineIndex.value) {
        if (
          store.isDragging ||
          foundIndex < nowLineIndex.value ||
          foundIndex > nowLineIndex.value + 1
        ) {
          store.lyricSeekVersion++;
        }
        nowLineIndex.value = foundIndex;
      }
      const currentLine = nowLineIndex.value !== -1 ? dwrc[nowLineIndex.value] : null;
      let dwrcLyric: any[];
      if (currentLine) {
        const fadeOutDuration = 300;
        dwrcLyric = currentLine[2].map((it: any) => {
          const [[start, duration], word, line, row] = it;
          const isDuringFadeOut =
            now > start + duration && now <= start + duration + fadeOutDuration;
          const isCurrent = (now >= start && now <= start + duration) || isDuringFadeOut;
          const isSungLyrics = start + duration < now && !isDuringFadeOut;
          const fakeLessDur = isCurrent && !isDuringFadeOut ? 1 : -1;
          return [isCurrent, isSungLyrics, line, row, word, duration, fakeLessDur, "auto", start];
        });
      } else {
        dwrcLyric = [
          [
            true,
            1,
            0,
            0,
            `${store.getPlayerData.name || "Loading..."} - ${store.getPlayerData.artist || "NanoRocky"}`,
            0,
            0,
            "auto",
            0,
          ],
        ];
      }
      const currentStr = JSON.stringify(dwrcLyric);
      if (currentStr !== lastDwrcLyricStr) {
        store.setPlayerLrc(dwrcLyric);
        lastDwrcLyricStr = currentStr;
      }
    }
  } catch (error) {
    console.error(t("console.player.syncDWRCLrcError"), error);
  } finally {
    requestAnimationFrame(syncDWRCLrc);
  }
}

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
