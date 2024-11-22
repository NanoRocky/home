<template>
  <APlayer v-if="playList[0]" ref="player" :audio="playList" :autoplay="store.playerAutoplay" :theme="theme"
    :autoSwitch="false" :loop="store.playerLoop" :order="store.playerOrder" :volume="volume" :showLrc="true"
    :listFolded="listFolded" :listMaxHeight="listMaxHeight" :noticeSwitch="false" @play="onPlay" @pause="onPause"
    @timeupdate="onTimeUp" @error="loadMusicError" />
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { decodeYrc } from "../utils/decodeYrc";

const store = mainStore();
let lastTimestamp = Date.now();

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
    default: "7452421335",
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
        message: "播放器加载失败",
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

let nowLineStart = -1
// 音频时间更新事件
function showYrc() {
  // 至于为什么所有源的逐字都叫 YRC 呢...因为逐字功能本来是打算写网易云音乐独占的，但好像有些偏心了（bushi）...看了一下 qrc 和 yrc 没什么大区别，就顺带捏一起了。但是就懒得改变量名了！
  try {
    // 至于为什么要 try 呢？问得好！因为网易云接口时不时会返回一些令人费解的东西，比如没有时间轴、时间轴为负数（[20720,-4200]）、时间轴乱码，这些东西会造成模块直接卡死，除非刷新页面。暂时没有那么多纠错逻辑，为了防止模块死掉，就先加个 try 在这里复活自己。咕咕咕！
    if (player.value == null) {
      return requestAnimationFrame(showYrc);
    }
    const aplayer = player.value.aplayer;
    const lyrics = aplayer.lyrics[playIndex.value];
    if (store.playerYrcShow != true) {
      store.yrcEnable = false;
      store.yrcTemp = [];
      store.yrcLoading = false;
    }
    else {
      if (store.yrcIndex != playIndex.value) {
        const yrcUrl = aplayer.audio[aplayer.index]["lrc"] + "&yrc=true";
        store.yrcIndex = playIndex.value;
        store.yrcLoading = true;
        fetch(yrcUrl)
          .then((i) => {
            if (i.status < 200 || i.status >= 400) {
              throw i.text();
            };
            return i.text();
          })
          .then((i) => {
            store.yrcIndex = playIndex.value;
            if (i.startsWith("[ch:0]")) {
              store.yrcEnable = true;
              store.yrcTemp = decodeYrc(i);
              store.yrcLoading = false;
              return;
            } else if (!store.playerYrcATDB) {
              store.yrcEnable = false;
              store.yrcTemp = [];
              store.yrcLoading = false;
              return;
            };
            // 接入 AMLL TTML Database
            const songUrlInf = new URLSearchParams(new URL(yrcUrl).search)
            const songId = songUrlInf.get('id')
            const songServer = songUrlInf.get("server");
            if (!songId) {
              return;
            };
            const songUrlInfUrl = {
              'netease': `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songId}.yrc`,
              'tencent': `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songId}.qrc`
            };
            if (!['netease', 'tencent'].includes(songServer)) {
              return;
            };
            const amllUrl = songUrlInfUrl[songServer]
            return fetch(amllUrl)
              .then((response) => {
                if (!response.ok) {
                  throw response.text()
                };
                return response.text();
              }).then((amllyrcfile) => {
                store.yrcEnable = true;
                store.yrcTemp = decodeYrc(amllyrcfile);
                store.yrcLoading = false;
              });
          }).catch(() => {
            store.yrcEnable = false;
            store.yrcTemp = [];
            store.yrcLoading = false;
          });
      };
    };
    if (!store.yrcEnable || store.yrcTemp.length == 0 || store.yrcLoading) {
      // 逐行模块
      let lyricIndex = player.value.aplayer.lyricIndex;
      if (lyrics === undefined || lyrics[lyricIndex] === undefined) {
        return requestAnimationFrame(showYrc);
      }
      let lrc = lyrics[lyricIndex][1];
      if (lrc === "Loading") {
        lrc = "歌词加载中...";
      } else if (lrc === "Not available") {
        if (store.playerYrcATDB) {
          // 哈哈哈又是你（）
          const songUrlInfw = new URLSearchParams(new URL(yrcUrl).search)
          const songIdlrc = songUrlInfw.get('id')
          const songServerlrc = songUrlInfw.get("server");
          if (songIdlrc) {
            const songUrlInfwurl = {
              'netease': `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${songIdlrc}.lrc`,
              'tencent': `https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/qq-lyrics/${songIdlrc}.lrc`
            };
            if (!['netease', 'tencent'].includes(songServerlrc)) {
              return;
            };
            const amllUrllrc = songUrlInfwurl[songServerlrc].replace('${songIdlrc}', songIdlrc);
            fetch(amllUrllrc)
              .then((response) => {
                if (response.status === 404 || !response.ok) {
                  lrc = "歌词加载失败";
                  return;
                } else {
                  return response.text();
                }
              })
              .catch(() => {
                lrc = "歌词加载失败";
              });
          }
        } else {
          lrc = "歌词加载失败";
        };
      }
      const output = [[true, 1, lyricIndex, 0, lrc]];
      if (store.playerLrc.toString() != output.toString()) {
        store.setPlayerLrc(output);
      };
      return requestAnimationFrame(showYrc);
    };
    // 逐字模块
    const now = player.value.audioStatus.playedTime * 1000;
    const yrcFiltered = store.yrcTemp.filter((i) => i[0] < now);
    let animationTmp = [];
    const yrcLyric =
      yrcFiltered.length > 0
        ? yrcFiltered.slice(-1)[0][2].map((it) => {
          const [[start, duration], word, line, row] = it;
          const isCurrent = now >= start && now <= start + duration;
          const isSungLyrics = start + duration < now;
          return [isCurrent, isSungLyrics, line, row, word, "auto"];
        })
        : [[true, 1, 0, 0, `${store.playerTitle} - ${store.playerArtist}`]];
    if (store.playerLrc.toString() != yrcLyric.toString()) {
      store.setPlayerLrc(yrcLyric);
    };
    if (store.playerYrcShowPro) {
      // 这个增强模块虽然能跑，但还有 N 个漏洞要修。对于这些概率性事件，还毫无头绪（）
      if (yrcFiltered.length === 0) {
        return requestAnimationFrame(showYrc);
      };
      const lineStart = yrcFiltered.slice(-1)[0][0];
      if (nowLineStart == lineStart) {
        return requestAnimationFrame(showYrc);
      };
      const yrc2 = document.getElementsByClassName("yrc-box")[0];
      if (yrc2 == undefined) {
        return requestAnimationFrame(showYrc);
      };
      const outputDom = yrc2.querySelectorAll("#yrc-2-wrap span");
      const inputDom = yrc2.querySelectorAll("#yrc-1-wrap span");
      if (inputDom.length == 0 || outputDom.length == 0) {
        return requestAnimationFrame(showYrc);
      };
      const nowLineWord = yrcFiltered.slice(-1)[0][2];
      for (let i = 0; i < nowLineWord.length; i++) {
        const [[start, duration], _a, _b, _c] = nowLineWord[i];
        const intputItem = inputDom[i];
        if (!intputItem || intputItem.hasAttribute('data-start')) {
          return requestAnimationFrame(showYrc);
        };
        const computedStyle = window.getComputedStyle(intputItem);
        const width = parseFloat(computedStyle.width);
        const outputItem = outputDom[i];
        const animateOptions = {
          delay: Math.max(0, start - now),
          duration: duration,
          fill: "forwards",
          easing: "linear",
        };
        outputItem.style.transform = "translateY(-1px)"
        const outputAnimate = outputItem.animate(
          [
            { width: 0, },
            { width: `${width}px` },
          ],
          animateOptions,
        );
        animationTmp.push(outputAnimate);
        outputAnimate.onfinish = () => {
          outputItem.style.transform = "translateY(1px)";
          animationTmp = animationTmp.filter(a => a !== outputAnimate);
        };
      };
      nowLineStart = yrcFiltered.slice(-1)[0][0];
    };
    requestAnimationFrame(showYrc);
  } catch (error) {
    requestAnimationFrame(showYrc);
  };
};
requestAnimationFrame(showYrc);

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
    notice = "播放歌曲出现错误，播放器将在 2s 后进行下一首";
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("歌曲加载失败.mp3");
    };
  } else {
    notice = "播放歌曲出现错误";
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("播放器未知异常.mp3");
    };
  }
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
    "播放歌曲: " + player.value.aplayer.audio[player.value.aplayer.index].name + " 出现错误",
  );
};

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
        mask: linear-gradient(#fff 15%,
            #fff 85%,
            hsla(0deg, 0%, 100%, 0.6) 90%,
            hsla(0deg, 0%, 100%, 0));
        -webkit-mask: linear-gradient(#fff 15%,
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
