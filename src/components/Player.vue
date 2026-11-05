<template>
  <APlayer
    v-if="playList[0]"
    ref="player"
    :audio="playList"
    :autoplay="store.playerAutoplay"
    :theme="theme"
    :autoSwitch="false"
    :loop="store.playerLoop"
    :order="store.playerOrder"
    :volume="volume"
    :lrcShow="true"
    :lrcType="0"
    :preload="playerPreload"
    :listFolded="listFolded"
    :listMaxHeight="listMaxHeight"
    :noticeSwitch="false"
    @play="onPlay"
    @pause="onPause"
    @loadstart="onLoadStart"
    @timeupdate="onTimeUp"
    @error="loadMusicError"
    @canplay="onCanplay"
    @waiting="onWaiting"
    @listswitch="onListSwitch"
    @seeked="() => updatePositionState()"
    @durationchange="() => updatePositionState()"
    @loadedmetadata="() => updatePositionState()"
  />
</template>

<script setup lang="ts">
import { Float, MusicOne, PlayWrong } from "@icon-park/vue-next";
import { markRaw, onBeforeUnmount } from "vue";
import { getPlayerList } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import type { DWRCItem, PlayerInstance, PlaylistItem } from "@/typings/player";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { decodeDWQYRC } from "@/utils/decodeDWQYRC";
import { alignPilferedLyrics, isLrcContentEmpty } from "@/utils/checkPilferDWRC";
import { removeLyricMetadata, isInstrumentalLyric } from "@/utils/removeLyricMetadata";
import { devLog } from "@/utils/debugLog";
import {
  initTranslationLrc,
  onPilferSuccess,
  onPilferDiscard,
  toggleTranslationLrc,
  syncTranslationLrc,
  clearTranslationLrc,
  reprocessTranslationLrc,
} from "@/utils/translationLyric";
import { useI18n } from "vue-i18n";
import { gasA } from "@/utils/authServer";

const normalizeLrcTimestamps = (lyricStr: string): string => {
  return lyricStr.replace(
    /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g,
    (_m, min: string, sec: string, ms?: string) => {
      const mm = min.padStart(2, "0");
      const ss = sec.padStart(2, "0");
      if (ms === undefined) return `[${mm}:${ss}]`;
      const frac = ms.length === 1 ? ms.padEnd(2, "0") : ms;
      return `[${mm}:${ss}.${frac}]`;
    },
  );
};

const aplayerUtils = (APlayer as any).components?.utils;
if (aplayerUtils && aplayerUtils.parse && !aplayerUtils.parse._patched) {
  const originalParse = aplayerUtils.parse;
  const patchedParse = function (this: any, lyricStr: string) {
    if (!lyricStr) return [];
    return originalParse.call(this, normalizeLrcTimestamps(lyricStr));
  };
  patchedParse._patched = true;
  aplayerUtils.parse = patchedParse;
}

const store = mainStore();
const { t } = useI18n();
let showDWRCRunning = 0;
let syncDwrcRafId: number | null = null;
let isPlayerUnmounted = false;
let dwrcLoadToken = 0;
let lastLoadedTrackKey = "";
let userDiscardedCurrentTrack = false;
let nowLineIndex = ref(-1);
let lastMediaSessionSongKey = "";
let lastReportedDuration = 0;
const MAX_CONSECUTIVE_LOAD_ERRORS = 5;
let consecutiveLoadErrors = 0;
let hasStoppedByLoadErrorLimit = false;
let errorSkipTimer: ReturnType<typeof setTimeout> | null = null;
let isAutoErrorSkipping = false;

/* 用来判断是否为空歌词.. 好像实现的有点怪怪的..？ */
const isPlaceholderLyricText = (text?: unknown): boolean => {
  return (
    text === "Not available" ||
    text === "Not availible" ||
    text === "Not found lyric" ||
    text === "暂无歌词" ||
    text === "歌詞がありません" ||
    text === t("components.music.notAvailable")
  );
};

const buildDwrcUrl = (rawLrcUrl?: string | null): string | null => {
  if (!rawLrcUrl || typeof rawLrcUrl !== "string") return null;
  try {
    const urlObj = new URL(rawLrcUrl);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") return null;
    urlObj.searchParams.set("dwrc", "true");
    return urlObj.toString();
  } catch {
    return null;
  }
};

const resetDwrcState = () => {
  store.dwrcTemp = markRaw([]);
  store.dwrcLoading = false;
  store.dwrcEnable = false;
};

const playerPreload = computed(() => (import.meta.env.VITE_METING_SKEY ? "none" : "metadata"));

const parseTTL = (val?: string): number => {
  if (!val) return 7000;
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return 7000;
  return num < 100 ? Math.round(num * 1000) : Math.round(num);
};

const SIGN_TTL = parseTTL(import.meta.env.VITE_METING_SKEY_TTL);

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
      } catch {}
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

const clearErrorSkipTimer = () => {
  if (errorSkipTimer !== null) {
    clearTimeout(errorSkipTimer);
    errorSkipTimer = null;
  }
  if (player.value?.skipForwardTimeout) {
    clearTimeout(player.value.skipForwardTimeout);
    player.value.skipForwardTimeout = null;
  }
};

const resetLoadErrorState = () => {
  consecutiveLoadErrors = 0;
  hasStoppedByLoadErrorLimit = false;
  clearErrorSkipTimer();
};

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
    if (!player.value?.aplayer) return;
    player.value.aplayer.order = newOrder;
  },
);

// 监听循环模式
watch(
  () => store.playerLoop,
  (newLoop) => {
    if (!player.value?.aplayer) return;
    player.value.aplayer.loop = newLoop;
  },
);

// 监听翻译歌词开关
watch(
  () => store.playerTrLrc,
  (val) => {
    const idx = player.value?.aplayer?.index ?? playIndex.value;
    const currentAudio = player.value?.aplayer?.audio?.[idx];
    const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
    const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
    const songMeta = { title: currentName, artist: currentArtist };
    toggleTranslationLrc(val, currentAudio?.lrc, idx, store, songMeta);
  },
);

// 监听歌词元数据移除开关
watch(
  () => store.playerRMMetadata,
  async () => {
    if (!player.value?.aplayer) return;
    const token = ++dwrcLoadToken;
    userDiscardedCurrentTrack = false;
    const currentIdx = player.value.aplayer.index ?? 0;
    nowLineIndex.value = -1;
    lastDwrcLyricStr = "";
    if (player.value.aplayer.lyrics) {
      for (let i = 0; i < player.value.aplayer.lyrics.length; i++) {
        if (i !== currentIdx) {
          delete player.value.aplayer.lyrics[i];
        }
      }
    }
    await player.value.loadLyric?.([[0, t("components.music.notAvailable")]], currentIdx);
    const currentAudio = player.value.aplayer.audio?.[currentIdx];
    const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
    const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
    const songMeta = { title: currentName, artist: currentArtist };
    if (store.playerTrLrc) {
      await reprocessTranslationLrc(store, songMeta);
    }
    const dwrcUrl = store.playerDWRCShow ? buildDwrcUrl(currentAudio?.lrc) : null;
    if (dwrcUrl) {
      store.dwrcIndex = currentIdx;
      store.dwrcLoading = true;
      fetchDWRC(dwrcUrl, currentIdx, token);
    } else {
      resetDwrcState();
      await checkFallbackLyricSource(currentIdx, store.songServer, token);
    }
  },
);

// 监听外部歌词手动恢复信号
watch(
  () => store.lyricRestoreVersion,
  async () => {
    if (!player.value?.aplayer) return;
    const token = ++dwrcLoadToken;
    userDiscardedCurrentTrack = true;
    const currentIdx = player.value.aplayer.index ?? playIndex.value;
    nowLineIndex.value = -1;
    lastDwrcLyricStr = "";
    await player.value.loadLyric?.([[0, t("components.music.notAvailable")]], currentIdx);
    await checkFallbackLyricSource(currentIdx, store.songServer, token);
  },
);

// 监听逐字歌词解析总开关
watch(
  () => store.playerDWRCShow,
  async (enabled) => {
    if (!player.value?.aplayer) return;
    const token = ++dwrcLoadToken;
    userDiscardedCurrentTrack = false;
    const currentIdx = player.value.aplayer.index ?? 0;
    const currentAudio = player.value.aplayer.audio?.[currentIdx];
    nowLineIndex.value = -1;
    lastDwrcLyricStr = "";
    if (enabled) {
      const dwrcUrl = buildDwrcUrl(currentAudio?.lrc);
      if (dwrcUrl) {
        store.dwrcIndex = currentIdx;
        store.dwrcLoading = true;
        fetchDWRC(dwrcUrl, currentIdx, token);
      } else {
        resetDwrcState();
        await checkFallbackLyricSource(currentIdx, store.songServer, token);
      }
    } else {
      const wasPilfered =
        Boolean(store.lyricSource) &&
        store.lyricSource !== "amll" &&
        store.lyricSource !== store.songServer;
      resetDwrcState();
      if (wasPilfered) {
        const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
        const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
        const songMeta = { title: currentName, artist: currentArtist };
        onPilferDiscard(currentIdx, store, songMeta);
        await player.value.loadLyric?.([[0, t("components.music.notAvailable")]], currentIdx);
      }
      await checkFallbackLyricSource(currentIdx, store.songServer, token);
    }
  },
);

// 监听外部逐字歌词源开关（AMLL / 跨平台偷取）
watch(
  () => [store.playerDWRCATDB, store.playerDWRCPilfer] as const,
  async ([atdbEnabled, pilferEnabled], [oldAtdb, oldPilfer]) => {
    if (!player.value?.aplayer || !store.playerDWRCShow) return;
    const currentIdx = player.value.aplayer.index ?? 0;
    const currentAudio = player.value.aplayer.audio?.[currentIdx];
    const isUsingAmll = store.lyricSource === "amll";
    const isUsingPilfer =
      Boolean(store.lyricSource) &&
      store.lyricSource !== "amll" &&
      store.lyricSource !== store.songServer;

    const turnedOffActiveSource =
      (!atdbEnabled && oldAtdb && isUsingAmll) || (!pilferEnabled && oldPilfer && isUsingPilfer);
    const turnedOnWhenFallback =
      ((atdbEnabled && !oldAtdb) || (pilferEnabled && !oldPilfer)) && !store.dwrcEnable;

    if (!turnedOffActiveSource && !turnedOnWhenFallback) return;

    const token = ++dwrcLoadToken;
    userDiscardedCurrentTrack = false;
    nowLineIndex.value = -1;
    lastDwrcLyricStr = "";

    if (turnedOffActiveSource && isUsingPilfer) {
      const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
      const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
      const songMeta = { title: currentName, artist: currentArtist };
      onPilferDiscard(currentIdx, store, songMeta);
      await player.value.loadLyric?.([[0, t("components.music.notAvailable")]], currentIdx);
    }

    const dwrcUrl = buildDwrcUrl(currentAudio?.lrc);
    if (dwrcUrl) {
      store.dwrcIndex = currentIdx;
      store.dwrcLoading = true;
      fetchDWRC(dwrcUrl, currentIdx, token);
    } else {
      resetDwrcState();
      await checkFallbackLyricSource(currentIdx, store.songServer, token);
    }
  },
);

// 初始化播放器
onMounted(() => {
  isPlayerUnmounted = false;
  nextTick(async () => {
    try {
      const res = await getPlayerList(
        props.songServer,
        props.songType,
        props.songId,
        props.songServerSE,
        props.songIdSE,
        store.clientUUID,
      );
      if (isPlayerUnmounted) return;
      const items = Array.isArray(res) ? (res as PlaylistItem[]) : [];
      if (items.length === 0) {
        throw new Error(t("console.player.playlistEmptyOrFailed"));
      }
      // 更改播放器加载状态
      store.musicIsOk = true;
      const metingSkey = import.meta.env.VITE_METING_SKEY;
      // 生成歌单
      playList.value = items;
      await nextTick();
      if (isPlayerUnmounted) return;
      if (player.value) {
        const playerInstance = player.value;
        if (playerInstance.skipForwardTimeout) {
          clearTimeout(playerInstance.skipForwardTimeout);
          playerInstance.skipForwardTimeout = null;
        }
        if (playerInstance.audioRef && typeof playerInstance.error === "function") {
          playerInstance.audioRef.removeEventListener("error", playerInstance.error);
        }
        playerInstance.error = () => {};

        const originalPlayerPlay = playerInstance.play;
        playerInstance.play = function (this: any) {
          const self = this ?? playerInstance;
          if (!isAutoErrorSkipping) {
            if (hasStoppedByLoadErrorLimit || !self?.audioStatus?.playStatus) {
              resetLoadErrorState();
            }
            if (self?.audioRef?.error) {
              const idx = self.aplayer?.index ?? 0;
              const currentAudio = self.aplayer?.audio?.[idx];
              if (currentAudio) {
                delete currentAudio._signedUrl;
                delete currentAudio._signTime;
              }
              lastLoadedTrackKey = "";
              if (!metingSkey) {
                self.audioRef.load();
              }
            }
          }
          return originalPlayerPlay.call(self);
        }.bind(playerInstance);

        const originalPlayerPause = playerInstance.pause;
        playerInstance.pause = function (this: any) {
          const self = this ?? playerInstance;
          clearErrorSkipTimer();
          return originalPlayerPause.call(self);
        }.bind(playerInstance);

        let setAudioToken = 0;
        if (metingSkey) {
          const originalSetAudio = player.value.setAudio;
          if (originalSetAudio) {
            player.value.setAudio = async function (this: any, audioItem: any) {
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
                this.audioRef?.play()?.catch(() => {});
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
                    if (signedUrl && player.value?.audioRef) {
                      if (player.value.audioRef.src !== signedUrl) {
                        player.value.audioRef.src = signedUrl;
                      } else if (player.value.audioRef.error) {
                        player.value.audioRef.load();
                      }
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

        player.value.loadLyric = async function (
          this: any,
          defaultLyric: [number, string][],
          songIdx: number,
        ) {
          let parsedLyrics = defaultLyric;
          try {
            const audioItem = this.aplayer?.audio?.[songIdx];
            if (!audioItem || !audioItem.lrc) {
              this.aplayer.lyrics[songIdx] = defaultLyric;
              this.updateLyric();
              return;
            }

            let rawText = audioItem._rawLrc;
            if (!rawText) {
              if (!audioItem._rawLrcPromise) {
                audioItem._rawLrcPromise = fetch(audioItem.lrc).then(async (res) => {
                  if (res.ok || res.status === 304) {
                    return await res.text();
                  }
                  throw new Error(
                    t("console.player.lrcRequestFailsStatus", {
                      status: res.status,
                    }),
                  );
                });
              }
              try {
                rawText = await audioItem._rawLrcPromise;
                audioItem._rawLrc = rawText;
              } catch {
                delete audioItem._rawLrcPromise;
                this.setNotice(t("components.music.lrcNoticeFailed"));
                this.aplayer.lyrics[songIdx] = defaultLyric;
                this.updateLyric();
                return;
              }
            }

            if (rawText) {
              let processedText = normalizeLrcTimestamps(rawText);

              if (store.playerRMMetadata) {
                processedText = await removeLyricMetadata(processedText, false, {
                  title: audioItem.name,
                  artist: audioItem.artist,
                });
              }

              const utils = (APlayer as any).components?.utils;
              if (utils && utils.parse) {
                const res = utils.parse(processedText);
                if (res && res.length > 0) {
                  parsedLyrics = res;
                  if (
                    parsedLyrics[0][0] > 1 &&
                    !isInstrumentalLyric(parsedLyrics[0][1] as string)
                  ) {
                    const name = audioItem.name || store.getPlayerData.name || "";
                    const artist = audioItem.artist || store.getPlayerData.artist || "";
                    const titleText = name && artist ? `${name} - ${artist}` : name || artist || "";
                    if (titleText) {
                      parsedLyrics.unshift([0, titleText]);
                    }
                  }
                } else if (
                  isInstrumentalLyric(audioItem.name || "") ||
                  isInstrumentalLyric(rawText)
                ) {
                  const instText = t("components.music.instrumental");
                  parsedLyrics = [[0, instText]];
                } else {
                  parsedLyrics = defaultLyric;
                }
              }
            }
          } catch (err) {
            console.warn("Custom loadLyric error:", err);
          } finally {
            this.aplayer.lyrics[songIdx] = parsedLyrics;
            this.updateLyric();
          }
        };

        (player.value.aplayer as any).lyricType = 1;
        const initIdx = player.value.aplayer?.index ?? 0;
        if (player.value.aplayer?.audio?.[initIdx]) {
          player.value.aplayer.lyrics[initIdx] = [[0, "Loading"]];
          player.value.loadLyric?.([[0, t("components.music.notAvailable")]], initIdx);
        }
      }

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Loading...",
        });
        // 设置 Media Session 操作
        navigator.mediaSession.setActionHandler("play", () => {
          player.value?.play();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          clearErrorSkipTimer();
          player.value?.pause();
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
        } catch {}
      }
      console.log(t("console.player.musicLoaded"));
    } catch (err) {
      if (isPlayerUnmounted) return;
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
        SpeechLocal("播放器加载失败.mp3");
      }
    }
  });
});

// 播放
const onPlay = () => {
  if (isPlayerUnmounted || !player.value) return;
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
  if (isPlayerUnmounted) return;
  resetLoadErrorState();
  lastDwrcLyricStr = "";
  // 播放状态
  store.setPlayerCanplay(true);
  updatePositionState();
};

const onListSwitch = () => {
  if (!isAutoErrorSkipping) {
    resetLoadErrorState();
  }
};

const onWaiting = () => {
  if (isPlayerUnmounted) return;
  store.setPlayerCanplay(false);
};

// 暂停
const onPause = () => {
  if (isPlayerUnmounted || !player.value) return;
  store.setPlayerState(player.value.audioRef.paused);
  lastDwrcLyricStr = "";
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "paused";
  }
  updatePositionState();
};

// 切换播放暂停事件
const playToggle = () => {
  if (!player.value) return;
  if (player.value.audioStatus?.playStatus) {
    clearErrorSkipTimer();
  } else {
    resetLoadErrorState();
  }
  player.value.toggle();
  updatePositionState();
};

// 切换音量事件
const changeVolume = (value: number) => {
  if (!player.value) return;
  player.value.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type: number) => {
  if (!player.value) return;
  resetLoadErrorState();
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  store.setPlayerCanplay(false);
  updatePositionState();
  nextTick(() => {
    player.value?.play();
  });
};

// 切换歌曲列表状态
const toggleList = () => {
  if (!player.value) return;
  player.value.toggleList();
};

// 跳转
const seektime = (value: number) => {
  if (!player.value) return;
  const dur =
    player.value.audioRef &&
    !isNaN(player.value.audioRef.duration) &&
    isFinite(player.value.audioRef.duration) &&
    player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : player.value.audioStatus?.duration || store.playerDuration || 0;

  if (dur > 0 && value >= dur) {
    changeSong(1);
    return;
  }
  const targetTime = Math.max(0, dur > 0 ? Math.min(value, dur) : Math.max(0, value));

  if (typeof player.value.seek === "function") {
    player.value.seek(targetTime);
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
  const currentTime =
    player.value.audioRef?.currentTime || player.value.audioStatus?.playedTime || 0;
  seektime(currentTime - value);
};

// 快进
const seekforward = (value: number = 5) => {
  if (!player.value) return;
  const currentTime =
    player.value.audioRef?.currentTime || player.value.audioStatus?.playedTime || 0;
  seektime(currentTime + value);
};

// 加载音频错误
const loadMusicError = () => {
  if (isPlayerUnmounted) return;
  clearErrorSkipTimer();

  // 中止当前失败曲目的在途逐字歌词与翻译歌词请求，避免发起后续无效请求
  dwrcLoadToken++;
  resetDwrcState();
  clearTranslationLrc(store);
  store.lyricSource = null;
  store.setPlayerCanplay(false);

  const currentIdx = player.value?.aplayer?.index ?? playIndex.value;
  const errSongName =
    player.value?.aplayer?.audio?.[currentIdx]?.name ||
    playList.value?.[currentIdx]?.name ||
    "Unknown";
  console.error(
    t("components.music.songErrorLog") + errSongName + t("components.music.songErrorPostfix"),
  );

  if (playList.value.length > 1) {
    consecutiveLoadErrors++;

    if (consecutiveLoadErrors >= MAX_CONSECUTIVE_LOAD_ERRORS) {
      hasStoppedByLoadErrorLimit = true;
      player.value?.pause();
      store.setPlayerState(true);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
      console.warn(
        t("console.player.maxLoadErrorsReached", {
          count: consecutiveLoadErrors,
        }),
      );
      ElMessage({
        message: t("components.music.songLoadFailedStop", {
          count: MAX_CONSECUTIVE_LOAD_ERRORS,
        }),
        grouping: true,
        duration: 4000,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "var(--music-aplayer-message-icon-color)",
        }),
      });
      if (store.webSpeech) {
        stopSpeech();
        SpeechLocal("音频多次加载失败.mp3");
      }
      return;
    }

    const shouldResumePlay = Boolean(player.value?.audioStatus?.playStatus || store.playerState);
    ElMessage({
      message: t("components.music.songLoadFailedNext"),
      grouping: true,
      icon: h(PlayWrong, {
        theme: "filled",
        fill: "var(--music-aplayer-message-icon-color)",
        duration: 2000,
      }),
    });
    if (store.webSpeech) {
      stopSpeech();
      SpeechLocal("歌曲加载失败.mp3");
    }

    errorSkipTimer = setTimeout(() => {
      errorSkipTimer = null;
      if (isPlayerUnmounted || !player.value || hasStoppedByLoadErrorLimit) return;
      isAutoErrorSkipping = true;
      try {
        player.value.skipForward();
      } finally {
        isAutoErrorSkipping = false;
      }
      store.setPlayerCanplay(false);
      updatePositionState();
      if (shouldResumePlay) {
        nextTick(() => {
          if (isPlayerUnmounted || !player.value || hasStoppedByLoadErrorLimit) return;
          isAutoErrorSkipping = true;
          try {
            player.value.play();
          } finally {
            isAutoErrorSkipping = false;
          }
        });
      }
    }, 2000);
  } else {
    hasStoppedByLoadErrorLimit = true;
    player.value?.pause();
    store.setPlayerState(true);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
    ElMessage({
      message: t("components.music.studioError"),
      grouping: true,
      icon: h(PlayWrong, {
        theme: "filled",
        fill: "var(--music-aplayer-message-icon-color)",
        duration: 2000,
      }),
    });
    if (store.webSpeech) {
      stopSpeech();
      SpeechLocal("播放器未知异常.mp3");
    }
  }
};

const checkFallbackLyricSource = async (
  expectedIndex: number,
  sServer: string | null,
  token = dwrcLoadToken,
) => {
  const isStale = () => token !== dwrcLoadToken || playIndex.value !== expectedIndex;
  if (isStale()) return;

  const currentAudio =
    player.value?.aplayer?.audio?.[expectedIndex] || playList.value?.[expectedIndex];
  let lyrics = player.value?.aplayer?.lyrics?.[expectedIndex];

  if (lyrics?.[0]?.[1] === "Loading" && currentAudio?._rawLrcPromise) {
    try {
      await currentAudio._rawLrcPromise;
      await nextTick();
    } catch {}
    if (isStale()) return;
    lyrics = player.value?.aplayer?.lyrics?.[expectedIndex];
  }

  const isDamaged = !lyrics || lyrics.length === 0 || isPlaceholderLyricText(lyrics[0]?.[1]);

  if (isDamaged) {
    let rawText = currentAudio?._rawLrc;
    if (!rawText && currentAudio?.lrc) {
      try {
        const resp = await fetch(currentAudio.lrc);
        if (resp.ok || resp.status === 304) {
          rawText = await resp.text();
          if (currentAudio) currentAudio._rawLrc = rawText;
        }
      } catch {}
      if (isStale()) return;
    }

    if (rawText && /\[\d{1,2}:\d{1,2}/.test(rawText)) {
      let processedText = normalizeLrcTimestamps(rawText);
      if (store.playerRMMetadata) {
        processedText = await removeLyricMetadata(processedText, false, {
          title: currentAudio?.name,
          artist: currentAudio?.artist,
        });
        if (isStale()) return;
      }
      const utils = (APlayer as any).components?.utils;
      const reParsed: [number, string][] = utils?.parse ? utils.parse(processedText) : [];
      if (reParsed && reParsed.length > 0) {
        if (reParsed[0][0] > 1 && !isInstrumentalLyric(reParsed[0][1] as string)) {
          const name = currentAudio?.name || store.getPlayerData.name || "";
          const artist = currentAudio?.artist || store.getPlayerData.artist || "";
          const titleText = name && artist ? `${name} - ${artist}` : name || artist || "";
          if (titleText) {
            reParsed.unshift([0, titleText]);
          }
        }
        if (player.value?.aplayer?.lyrics) {
          player.value.aplayer.lyrics[expectedIndex] = reParsed;
          player.value.updateLyric?.();
        }
        lyrics = reParsed;
      }
    } else if (
      rawText &&
      (isInstrumentalLyric(currentAudio?.name || "") || isInstrumentalLyric(rawText))
    ) {
      const instText = t("components.music.instrumental");
      const instLyrics: [number, string][] = [[0, instText]];
      if (player.value?.aplayer?.lyrics) {
        player.value.aplayer.lyrics[expectedIndex] = instLyrics;
        player.value.updateLyric?.();
      }
      lyrics = instLyrics;
    }
  }

  if (lyrics && lyrics.length > 0) {
    const firstLineText = lyrics[0]?.[1];
    if (isPlaceholderLyricText(firstLineText)) {
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

// 逐字歌词获取模块
const fetchDWRC = async (dwrcUrl: string, expectedIndex: number, token = dwrcLoadToken) => {
  const isStale = () => token !== dwrcLoadToken || playIndex.value !== expectedIndex;
  let parsedDwrcUrl: URL;
  try {
    parsedDwrcUrl = new URL(dwrcUrl);
  } catch {
    if (!isStale()) {
      resetDwrcState();
      await checkFallbackLyricSource(expectedIndex, store.songServer, token);
    }
    return;
  }

  const songUrlInf = parsedDwrcUrl.searchParams;
  const songId = songUrlInf.get("id");
  const songServer = songUrlInf.get("server") || store.songServer;
  const baseUrl = `${parsedDwrcUrl.origin}${parsedDwrcUrl.pathname}`;

  const currentAudio =
    player.value?.aplayer?.audio?.[expectedIndex] ||
    playList.value?.[expectedIndex] ||
    player.value?.aplayer?.audio?.[player.value?.aplayer?.index ?? 0];
  const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
  const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
  const songMeta = { title: currentName, artist: currentArtist };

  let dwrcText = "";
  try {
    const dwrcSource = await fetch(dwrcUrl);
    if (!dwrcSource.ok) {
      throw new Error(t("console.player.dwrcRequestFailed", { status: dwrcSource.status }));
    }
    dwrcText = await dwrcSource.text();
    if (isStale()) return;
    const decoded = await decodeDWQYRC(dwrcText, store.playerRMMetadata, songMeta);
    if (isStale()) return;
    store.dwrcIndex = expectedIndex;
    store.dwrcTemp = markRaw(Array.isArray(decoded) ? (decoded as DWRCItem[]) : []);
    store.dwrcLoading = false;
    store.dwrcEnable = true;
    store.lyricSource = songServer;
    return;
  } catch {
    if (isStale()) return;
    const isExplicitInstrumental =
      Boolean(dwrcText) &&
      isInstrumentalLyric(dwrcText) &&
      (isLrcContentEmpty(dwrcText) ||
        dwrcText
          .split(/\r?\n/)
          .map((l) => l.replace(/\[[^\]]*\]/g, "").trim())
          .filter(Boolean)
          .every((l) => isInstrumentalLyric(l)));
    if (isExplicitInstrumental) {
      resetDwrcState();
      await checkFallbackLyricSource(expectedIndex, songServer, token);
      return;
    }
  }

  // 接入 AMLL TTML Database
  if (
    store.playerDWRCATDB &&
    songId &&
    songServer &&
    (songServer === "netease" || songServer === "tencent")
  ) {
    const amllPath =
      songServer === "netease" ? `ncm-lyrics/${songId}.yrc` : `qq-lyrics/${songId}.qrc`;
    const directAmllUrl = `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/${amllPath}`;
    const amllCandidates = store.playerDWRCATDBF
      ? [`https://ghfast.top/${directAmllUrl}`, directAmllUrl]
      : [directAmllUrl];

    for (const amllUrl of amllCandidates) {
      try {
        const amllSource = await fetch(amllUrl);
        if (isStale()) return;
        if (amllSource.status === 404) {
          break;
        }
        if (!amllSource.ok) {
          throw new Error(t("console.player.amllFail"));
        }
        const amllText = await amllSource.text();
        if (isStale()) return;
        const decoded = await decodeDWQYRC(amllText, store.playerRMMetadata, songMeta);
        if (isStale()) return;
        store.dwrcIndex = expectedIndex;
        store.dwrcTemp = markRaw(Array.isArray(decoded) ? (decoded as DWRCItem[]) : []);
        store.dwrcLoading = false;
        store.dwrcEnable = true;
        store.lyricSource = "amll";
        notifyExternalLyricLoaded();
        return;
      } catch {
        if (isStale()) return;
      }
    }
  }

  // 跨平台偷取歌词
  if (store.playerDWRCPilfer && baseUrl) {
    if (!currentName) {
      devLog("DWRC-Match", t("console.player.pilferEmptyNameDiscard"));
    } else {
      try {
        const currentServer = songServer === "netease" ? "tencent" : "netease";
        const pilferUrl = `${baseUrl}?server=${currentServer}&type=search&id=0&dwrc=true&keyword=${encodeURIComponent(currentName)}`;
        const resp = await fetch(pilferUrl);
        if (!resp.ok) {
          throw new Error(t("console.player.pilferSearchFailed", { status: resp.status }));
        }
        const data = await resp.json();
        if (isStale()) return;
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
            (item: any) =>
              stripBrackets(item?.name) === normalizedCurrentName &&
              normalizeArtist(item?.artist) === normalizedCurrentArtist,
          ) as any;
          const lrcUrl = match?.lrc ? buildDwrcUrl(match.lrc) : null;
          if (match && lrcUrl) {
            const pilferSource = await fetch(lrcUrl);
            if (!pilferSource.ok) {
              throw new Error(
                t("console.player.pilferLrcFetchFailed", {
                  status: pilferSource.status,
                }),
              );
            }
            const pilferText = await pilferSource.text();
            let sourceLrcText = currentAudio?._rawLrc;
            if (!sourceLrcText && currentAudio?._rawLrcPromise) {
              try {
                sourceLrcText = await currentAudio._rawLrcPromise;
              } catch {}
            }
            if (!sourceLrcText && currentAudio?.lrc) {
              try {
                const sourceLrcResp = await fetch(currentAudio.lrc);
                if (sourceLrcResp.ok || sourceLrcResp.status === 304) {
                  sourceLrcText = await sourceLrcResp.text();
                  if (currentAudio) currentAudio._rawLrc = sourceLrcText;
                }
              } catch {}
            }

            if (isStale()) return;

            const isSourceEmpty = isLrcContentEmpty(sourceLrcText);
            const isPilferEmpty = isLrcContentEmpty(pilferText);
            if (isPilferEmpty) {
              devLog("DWRC-Match", t("console.player.pilferEmptyDiscard"));
            } else {
              const isPilferVerbatim = /\(\d+,\s*\d+(?:,\s*\d+)?\)/.test(pilferText);

              if (!isSourceEmpty && !isPilferVerbatim) {
                devLog(
                  "DWRC-Match",
                  t("console.player.pilferNonVerbatimDiscard", { currentServer }),
                );
              } else if (!isPilferVerbatim) {
                devLog(
                  "DWRC-Match",
                  t("console.player.pilferNonVerbatimFallback", { currentServer }),
                );
                let processedNormalText = pilferText;
                if (store.playerRMMetadata) {
                  processedNormalText = await removeLyricMetadata(
                    processedNormalText,
                    false,
                    songMeta,
                  );
                  if (isStale()) return;
                }
                let parsedLyrics: [number, string][] = [];
                const utils = (APlayer as any).components?.utils;
                if (utils && utils.parse) {
                  parsedLyrics = utils.parse(processedNormalText) || [];
                } else {
                  const lines = processedNormalText.split(/\r?\n/);
                  const regex = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || /^\[[a-zA-Z_]+:.*?\]$/i.test(trimmed)) continue;
                    const matches = [...trimmed.matchAll(regex)];
                    if (!matches.length) continue;
                    const text = trimmed.replace(regex, "").trim();
                    for (const m of matches) {
                      const minutes = parseInt(m[1], 10);
                      const seconds = parseInt(m[2], 10);
                      const fracStr = m[3] || "0";
                      const fraction = parseInt(fracStr, 10);
                      const fracSec =
                        fracStr.length === 3
                          ? fraction / 1000
                          : fracStr.length === 1
                            ? fraction / 10
                            : fraction / 100;
                      parsedLyrics.push([minutes * 60 + seconds + fracSec, text]);
                    }
                  }
                  parsedLyrics.sort((a, b) => a[0] - b[0]);
                }

                if (parsedLyrics.length > 0) {
                  if (
                    parsedLyrics[0][0] > 1 &&
                    !isInstrumentalLyric(parsedLyrics[0][1] as string)
                  ) {
                    const name = currentName || store.getPlayerData.name || match.name || "";
                    const artist =
                      currentArtist || store.getPlayerData.artist || match.artist || "";
                    const titleText = name && artist ? `${name} - ${artist}` : name || artist || "";
                    if (titleText) {
                      parsedLyrics.unshift([0, titleText]);
                    }
                  }

                  if (player.value?.aplayer?.lyrics) {
                    player.value.aplayer.lyrics[expectedIndex] = parsedLyrics;
                    player.value.updateLyric?.();
                  }

                  store.dwrcIndex = expectedIndex;
                  resetDwrcState();
                  store.lyricSource = currentServer;
                  onPilferSuccess(match.lrc, expectedIndex, store, songMeta);
                  notifyExternalLyricLoaded();
                  return;
                }
              } else {
                let processedText = await alignPilferedLyrics(
                  pilferText,
                  isSourceEmpty ? "" : sourceLrcText,
                  songMeta,
                );
                if (isStale()) return;

                if (!processedText && isPilferVerbatim) {
                  const aplayerLyrics = player.value?.aplayer?.lyrics?.[expectedIndex];
                  const isAPlayerDamaged =
                    !aplayerLyrics ||
                    aplayerLyrics.length === 0 ||
                    isPlaceholderLyricText(aplayerLyrics[0]?.[1]) ||
                    isSourceEmpty;
                  if (isAPlayerDamaged) {
                    devLog("DWRC-Match", t("console.player.pilferAlignFallback"));
                    processedText = pilferText;
                  }
                }

                if (processedText) {
                  const decoded = await decodeDWQYRC(
                    processedText,
                    store.playerRMMetadata,
                    songMeta,
                  );
                  if (isStale()) return;
                  store.dwrcIndex = expectedIndex;
                  store.dwrcTemp = markRaw(Array.isArray(decoded) ? (decoded as DWRCItem[]) : []);
                  store.dwrcLoading = false;
                  store.dwrcEnable = true;
                  store.lyricSource = currentServer;

                  if (player.value?.aplayer?.lyrics) {
                    const aplayerLyrics: [number, string][] = store.dwrcTemp.map(
                      ([startMs, _dur, stack]) => [
                        startMs / 1000,
                        stack.map((s) => s[1].replace(/&nbsp;|\u00A0/g, " ")).join(""),
                      ],
                    );
                    if (
                      aplayerLyrics.length > 0 &&
                      aplayerLyrics[0][0] > 1 &&
                      !isInstrumentalLyric(aplayerLyrics[0][1] as string)
                    ) {
                      const name = currentName || store.getPlayerData.name || match.name || "";
                      const artist =
                        currentArtist || store.getPlayerData.artist || match.artist || "";
                      const titleText =
                        name && artist ? `${name} - ${artist}` : name || artist || "";
                      if (titleText) {
                        aplayerLyrics.unshift([0, titleText]);
                      }
                    }
                    player.value.aplayer.lyrics[expectedIndex] = aplayerLyrics;
                    player.value.updateLyric?.();
                  }

                  onPilferSuccess(match.lrc, expectedIndex, store, songMeta);
                  notifyExternalLyricLoaded();
                  console.log(
                    t("console.player.dwrcPilfering", {
                      songServer,
                      name: currentName || store.getPlayerData.name || match.name || "",
                      artist: currentArtist || store.getPlayerData.artist || match.artist || "",
                      currentServer,
                    }),
                  );
                  return;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn(t("console.player.pilferProcessError"), e);
      }
    }
  }

  if (isStale()) return;
  resetDwrcState();
  await checkFallbackLyricSource(expectedIndex, songServer, token);
};

function onLoadStart() {
  // 逐字获取与翻译歌词模块
  if (isPlayerUnmounted || !player.value || !player.value.aplayer) return;
  try {
    const currentIdx = player.value.aplayer.index ?? 0;
    playIndex.value = currentIdx;
    const currentAudio = player.value.aplayer.audio?.[currentIdx];
    const trackKey = `${currentIdx}::${currentAudio?.lrc || currentAudio?.name || ""}`;
    nowLineIndex.value = -1;
    lastDwrcLyricStr = "";

    if (
      trackKey === lastLoadedTrackKey &&
      (store.dwrcLoading ||
        store.dwrcEnable ||
        store.lyricSource !== null ||
        userDiscardedCurrentTrack)
    ) {
      store.lyricSeekVersion++;
      return;
    }

    lastLoadedTrackKey = trackKey;
    userDiscardedCurrentTrack = false;
    const token = ++dwrcLoadToken;
    store.lyricSource = null;
    store.songServer = null;

    let songServer: string | null = null;
    if (currentAudio && currentAudio.lrc) {
      try {
        const urlObj = new URL(currentAudio.lrc);
        songServer = urlObj.searchParams.get("server");
      } catch {}
      if (buildDwrcUrl(currentAudio.lrc)) {
        const currentName = currentAudio?.name?.trim() || store.getPlayerData.name || "";
        const currentArtist = currentAudio?.artist?.trim() || store.getPlayerData.artist || "";
        const songMeta = { title: currentName, artist: currentArtist };
        initTranslationLrc(currentAudio.lrc, currentIdx, store, songMeta);
      } else {
        clearTranslationLrc(store);
      }
    } else {
      clearTranslationLrc(store);
    }
    store.songServer = songServer;

    const dwrcUrl = store.playerDWRCShow ? buildDwrcUrl(currentAudio?.lrc) : null;
    if (!dwrcUrl) {
      resetDwrcState();
      checkFallbackLyricSource(currentIdx, songServer, token);
      return;
    }
    store.dwrcIndex = currentIdx;
    store.dwrcLoading = true;
    fetchDWRC(dwrcUrl, currentIdx, token);
  } catch (error) {
    resetDwrcState();
    store.lyricSource = null;
    console.error(error);
  }
}

const onTimeUp = () => {
  if (isPlayerUnmounted || !player.value) return;
  const lastTime = store.playerCurrentTime;
  const newTime = player.value.audioStatus.playedTime;
  if (lastTime && Math.abs(newTime - lastTime) > 1) {
    if (!store.isDragging) {
      store.lyricSeekVersion++;
      nowLineIndex.value = -1;
    }
  }
  store.playerCurrentTime = newTime;
  const dur =
    player.value.audioRef &&
    !isNaN(player.value.audioRef.duration) &&
    isFinite(player.value.audioRef.duration) &&
    player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : player.value.audioStatus.duration;
  store.playerDuration = dur;
  if (
    showDWRCRunning == 0 &&
    !isPlayerUnmounted &&
    player.value != null &&
    player.value.aplayer != null
  ) {
    syncDwrcRafId = requestAnimationFrame(syncDWRCLrc);
  }
  if (dur && dur > 0 && Math.abs(dur - lastReportedDuration) > 0.5) {
    lastReportedDuration = dur;
    updatePositionState();
  }
};

function updatePositionState(overridePos?: number) {
  if (
    isPlayerUnmounted ||
    !("mediaSession" in navigator) ||
    !("setPositionState" in navigator.mediaSession) ||
    !player.value
  ) {
    return;
  }
  const dur =
    player.value.audioRef &&
    !isNaN(player.value.audioRef.duration) &&
    isFinite(player.value.audioRef.duration) &&
    player.value.audioRef.duration > 0
      ? player.value.audioRef.duration
      : player.value.audioStatus?.duration || store.playerDuration || 0;

  const pos =
    overridePos !== undefined
      ? overridePos
      : player.value.audioRef &&
          !isNaN(player.value.audioRef.currentTime) &&
          isFinite(player.value.audioRef.currentTime)
        ? player.value.audioRef.currentTime
        : player.value.audioStatus?.playedTime || 0;

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
let lastVerbatimLineRef: DWRCItem | null = null;
let lastWordStates = new Uint8Array(0);

let lastLineLyricsRef: [number, string][] | null = null;
let lastLineLyricsSorted = true;
let lastLineLyricsCursor = -1;

let lastDwrcArrRef: DWRCItem[] | null = null;
let lastDwrcArrSorted = true;
let lastDwrcArrCursor = -1;

const isTupleTimestampsSorted = (arr: readonly any[]): boolean => {
  for (let i = 1; i < arr.length; i++) {
    const prev = arr[i - 1]?.[0];
    const curr = arr[i]?.[0];
    if (typeof prev !== "number" || typeof curr !== "number" || curr < prev) {
      return false;
    }
  }
  return true;
};

const findActiveTupleIndex = (
  arr: readonly any[],
  targetTime: number,
  isSorted: boolean,
  cursorHint: number,
): number => {
  if (!arr.length) return -1;
  if (!isSorted || typeof arr[0]?.[0] !== "number") {
    let idx = -1;
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i][0] === "number" && arr[i][0] <= targetTime) {
        idx = i;
      } else if (typeof arr[i][0] === "number" && arr[i][0] > targetTime) {
        break;
      }
    }
    return idx;
  }
  let c = cursorHint >= arr.length ? arr.length - 1 : cursorHint;
  while (c >= 0 && arr[c][0] > targetTime) {
    c--;
  }
  while (c + 1 < arr.length && arr[c + 1][0] <= targetTime) {
    c++;
  }
  return c;
};

function syncDWRCLrc() {
  if (isPlayerUnmounted) {
    showDWRCRunning = 0;
    syncDwrcRafId = null;
    return;
  }
  showDWRCRunning = 1;
  try {
    if (!player.value || !player.value.aplayer) {
      return;
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
      const lyrics = player.value.aplayer.lyrics?.[playIndex.value];
      let playerLyricIndex = -1;
      if (lyrics && lyrics.length > 0) {
        if (lyrics !== lastLineLyricsRef) {
          lastLineLyricsRef = lyrics;
          lastLineLyricsSorted = isTupleTimestampsSorted(lyrics);
          lastLineLyricsCursor = -1;
        }
        const targetSec = lineSwitchNow / 1000;
        playerLyricIndex = findActiveTupleIndex(
          lyrics,
          targetSec,
          lastLineLyricsSorted,
          lastLineLyricsCursor,
        );
        lastLineLyricsCursor = playerLyricIndex;
        if (playerLyricIndex === -1) {
          const currentAudio =
            player.value?.aplayer?.audio?.[playIndex.value] || playList.value?.[playIndex.value];
          const name = currentAudio?.name || store.getPlayerData.name || "";
          const artist = currentAudio?.artist || store.getPlayerData.artist || "";
          const placeholder =
            name && artist
              ? `${name} - ${artist}`
              : name || artist || t("components.music.lrcSearching");
          const firstStart = typeof lyrics[0][0] === "number" ? lyrics[0][0] * 1000 : 5000;
          if (
            store.playerLrc.length !== 1 ||
            store.playerLrc[0][4] !== placeholder ||
            store.playerLrc[0][2] !== -1
          ) {
            store.setPlayerLrc([[true, 1, -1, 0, placeholder, firstStart, 0, "auto", 0]]);
            lastDwrcLyricStr = "";
          }
          if (nowLineIndex.value !== -1) {
            nowLineIndex.value = -1;
          }
          if (player.value.aplayer.lyricIndex !== 0) {
            player.value.aplayer.lyricIndex = 0;
          }
          return;
        }
        if (player.value.aplayer.lyricIndex !== playerLyricIndex) {
          player.value.aplayer.lyricIndex = playerLyricIndex;
        }
      } else {
        playerLyricIndex = player.value.aplayer.lyricIndex ?? 0;
      }

      if (nowLineIndex.value === -1) {
        nowLineIndex.value = playerLyricIndex;
      } else if (playerLyricIndex !== nowLineIndex.value) {
        if (
          store.isDragging ||
          playerLyricIndex < nowLineIndex.value ||
          playerLyricIndex > nowLineIndex.value + 1
        ) {
          store.lyricSeekVersion++;
        }
        nowLineIndex.value = playerLyricIndex;
      }

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
        } else if (isPlaceholderLyricText(lrc)) {
          lrc = t("components.music.lrcNotFound");
          if (store.lyricSource !== null) {
            store.lyricSource = null;
          }
        } else {
          if (
            !store.dwrcLoading &&
            !store.dwrcEnable &&
            store.songServer &&
            store.lyricSource === null
          ) {
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
      const dwrc = store.dwrcTemp as DWRCItem[];
      if (dwrc !== lastDwrcArrRef) {
        lastDwrcArrRef = dwrc;
        lastDwrcArrSorted = isTupleTimestampsSorted(dwrc);
        lastDwrcArrCursor = -1;
      }
      const foundIndex = findActiveTupleIndex(
        dwrc,
        lineSwitchNow,
        lastDwrcArrSorted,
        lastDwrcArrCursor,
      );
      lastDwrcArrCursor = foundIndex;

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
      if (currentLine) {
        const defaultFadeOutDuration = 300;
        const longToneFadeOutDuration = 700;
        const words = currentLine[2];
        const wordCount = words.length;
        let hasWordStateChange =
          currentLine !== lastVerbatimLineRef ||
          lastWordStates.length !== wordCount ||
          lastDwrcLyricStr !== "__VERBATIM__";

        if (lastWordStates.length !== wordCount) {
          lastWordStates = new Uint8Array(wordCount);
        }

        for (let i = 0; i < wordCount; i++) {
          const [start, duration] = words[i][0];
          const end = start + duration;
          const fadeEnd =
            end + (duration > 1019 ? longToneFadeOutDuration : defaultFadeOutDuration);
          // 0: 未唱, 1: 在唱, 2: 尾音淡出, 3: 已唱完
          const state = now < start ? 0 : now <= end ? 1 : now <= fadeEnd ? 2 : 3;
          if (!hasWordStateChange && lastWordStates[i] !== state) {
            hasWordStateChange = true;
          }
          lastWordStates[i] = state;
        }

        if (hasWordStateChange) {
          const dwrcLyric = new Array(wordCount);
          for (let i = 0; i < wordCount; i++) {
            const [[start, duration], word, line, row] = words[i];
            const state = lastWordStates[i];
            const isCurrent = state === 1 || state === 2;
            const isSungLyrics = state === 3;
            const fakeLessDur = state === 1 ? 1 : -1;
            dwrcLyric[i] = [
              isCurrent,
              isSungLyrics,
              line,
              row,
              word,
              duration,
              fakeLessDur,
              "auto",
              start,
            ];
          }
          lastVerbatimLineRef = currentLine;
          lastDwrcLyricStr = "__VERBATIM__";
          store.setPlayerLrc(dwrcLyric);
        }
      } else {
        const currentAudio =
          player.value?.aplayer?.audio?.[playIndex.value] || playList.value?.[playIndex.value];
        const name = currentAudio?.name || store.getPlayerData.name || "";
        const artist = currentAudio?.artist || store.getPlayerData.artist || "";
        const placeholder =
          name && artist
            ? `${name} - ${artist}`
            : name || artist || t("components.music.lrcSearching");
        const placeholderSig = `__PLACEHOLDER__:${placeholder}`;
        if (lastDwrcLyricStr !== placeholderSig) {
          lastVerbatimLineRef = null;
          lastDwrcLyricStr = placeholderSig;
          store.setPlayerLrc([[true, 1, -1, 0, placeholder, 0, 0, "auto", 0]]);
        }
      }
    }
  } catch (error) {
    console.error(t("console.player.syncDWRCLrcError"), error);
  } finally {
    if (!isPlayerUnmounted) {
      syncDwrcRafId = requestAnimationFrame(syncDWRCLrc);
    } else {
      showDWRCRunning = 0;
      syncDwrcRafId = null;
    }
  }
}

onBeforeUnmount(() => {
  isPlayerUnmounted = true;
  clearErrorSkipTimer();
  dwrcLoadToken++;
  if (syncDwrcRafId !== null) {
    cancelAnimationFrame(syncDwrcRafId);
    syncDwrcRafId = null;
  }
  showDWRCRunning = 0;
  try {
    player.value?.audioRef?.pause();
  } catch {}
});

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
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );

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
