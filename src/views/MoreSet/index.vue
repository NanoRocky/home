<template>
  <div class="mobileset" v-if="store.mobileOpenState" @mouseenter="closeShow = true" @mouseleave="closeShow = false"
    @click.stop>
    <transition name="el-fade-in-linear">
      <close-one class="close" theme="filled" size="28" fill="#ffffff60" v-show="closeShow"
        @click="store.setOpenState = false" />
    </transition>
    <el-row>
      <el-col class="left">
        <div class="logo text-hidden">
          <span class="bg">{{ siteUrl[0] }}</span>
          <span class="sm">.{{ siteUrl[1] }}</span>
        </div>
        <!-- 移动端设置菜单 -->
        <div class="title">
          <setting-two theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全局设置</span>
        </div>
        <div class="mobileset-scrollable">
          <Set />
        </div>
        <div class="version">
          <div class="num" @dblclick="toggleVer">v&nbsp;{{ config.version }}</div>
          <github-one class="github" theme="outline" size="24" @click="jumpTo(config.github)" />
          <file-editing-one class="github" theme="outline" size="24" @click="jumpTo(config.efug)" />
        </div>
      </el-col>
    </el-row>
  </div>
  <div class="set" v-else @mouseenter="closeShow = true" @mouseleave="closeShow = false" @click.stop>
    <transition name="el-fade-in-linear">
      <close-one class="close" theme="filled" size="28" fill="#ffffff60" v-show="closeShow"
        @click="store.setOpenState = false" />
    </transition>
    <el-row :gutter="40">
      <el-col :span="12" class="left">
        <div class="logo text-hidden">
          <span class="bg">{{ siteUrl[0] }}</span>
          <span class="sm">.{{ siteUrl[1] }}</span>
        </div>
        <div class="version">
          <el-tooltip content="Version" placement="top" :show-arrow="false">
            <div class="num" @dblclick="toggleVer">v&nbsp;{{ config.version }}</div>
          </el-tooltip>
          <el-tooltip content="Powered by imsyy" placement="top" :show-arrow="false">
            <github-one class="github" theme="outline" size="24" @click="jumpTo(config.github)" />
          </el-tooltip>
          <el-tooltip content="Extension Function Updates by NanoRocky" placement="top" :show-arrow="false">
            <file-editing-one class="github" theme="outline" size="24" @click="jumpTo(config.efug)" />
          </el-tooltip>
        </div>
      </el-col>
      <!-- 桌面端设置菜单 -->
      <el-col :span="12" class="right">
        <div class="title">
          <setting-two theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全局设置</span>
        </div>
        <div class="set-scrollable">
          <Set />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo, GithubOne, AddOne, Bug, FileEditingOne } from "@icon-park/vue-next";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { mainStore } from "@/store";
import Set from "@/components/Set.vue";
import config from "@/../package.json";

const store = mainStore();
const closeShow = ref(false);
let chuover = 0;

// 站点链接
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "nanorocky.top".split(".");
  // 判断协议前缀
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const urlFormat = url.replace(/^(https?:\/\/)/, "");
    return urlFormat.split(".");
  }
  return url.split(".");
});

const toggleVer = () => {
  chuover = chuover + 1;
  if (chuover > 4) {
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: `怎么还在戳哇喂！有那么神秘喵...？`,
    });
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("戳戳版本.mp3");
    store.setV = true;
  } else {
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: `诶？是在找...什喵神秘的东西嘛？`,
    });
    stopSpeech();
    const voice = import.meta.env.VITE_TTS_Voice;
    const vstyle = import.meta.env.VITE_TTS_Style;
    SpeechLocal("戳版本.mp3");
  };
};

// 跳转源代码仓库
const jumpTo = (url) => {
  window.open(url);
};
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: rgb(255 255 255 / 40%);
  border-radius: 6px;
  padding: 40px;

  .close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(1);
    }
  }

  .el-row {
    height: 100%;
    flex-wrap: nowrap;

    .left {
      height: 100%;
      padding-left: 40px !important;
      padding-bottom: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .logo {
        transform: translateY(-8%);
        font-family: "字魂元气酪酪体";
        padding-left: 22px;
        width: 100%;
        height: 260px;
        min-height: 140px;

        .bg {
          font-size: 5rem;
        }

        .sm {
          margin-left: 6px;
          font-size: 2rem;
        }

        @media (max-width: 990px) {
          .bg {
            font-size: 4.5rem;
          }

          .sm {
            font-size: 1.7rem;
          }
        }

        @media (max-width: 825px) {
          .bg {
            font-size: 3.8rem;
          }

          .sm {
            font-size: 1.3rem;
          }
        }
      }

      .version {
        display: flex;
        flex-direction: row;
        align-items: center;

        .num {
          font-size: 1rem;
          font-family: "字魂萌趣软糖体";
        }

        .github {
          width: 24px;
          height: 24px;
          margin-left: 12px;
          margin-top: 6px;

          &:hover {
            transform: scale(1.2);
          }
        }
      }

      .update {
        margin-top: 30px;
        height: 100%;

        :deep(.el-card__body) {
          height: 100%;

          .upnote {
            padding: 20px;
            height: calc(100% - 56px);
            overflow-y: auto;

            .uptext {
              display: flex;
              flex-direction: row;
              align-items: center;
              padding-bottom: 16px;

              &:nth-last-of-type(1) {
                padding: 0;
              }

              .i-icon {
                width: 22px;
                height: 22px;
                margin-right: 8px;
              }
            }
          }
        }
      }
    }

    .right {
      height: 100%;
      padding-right: 40px !important;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .title {
        display: flex;
        align-items: center;
        flex-direction: row;
        font-size: 18px;
        margin-bottom: 16px;

        .i-icon {
          width: 28px;
          height: 28px;
          margin-right: 6px;
        }
      }

      .set-scrollable {
        flex: 1;
        overflow-y: auto;
      }
    }
  }
}

.mobileset {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 82%;
  height: 86%;
  background: rgb(255 255 255 / 40%);
  border-radius: 6px;
  padding: 36px;

  .close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(1);
    }
  }

  .el-row {
    height: 100%;
    flex-wrap: nowrap;

    .left {
      height: 100%;
      padding-left: 24px !important;
      padding-bottom: 24px;
      display: flex;
      flex-direction: column;
      // justify-content: space-between;

      .logo {
        transform: translateY(-8%);
        font-family: "字魂元气酪酪体";
        padding-left: 6px;
        width: 72%;
        height: auto;

        .bg {
          font-size: 2rem;
        }

        .sm {
          margin-left: 6px;
          font-size: 1.2rem;
        }
      }

      .title {
        display: flex;
        align-items: center;
        flex-direction: row;
        font-size: 18px;
        margin-bottom: 16px;
        padding-top: 18px;

        .i-icon {
          width: 28px;
          height: 28px;
          margin-right: 6px;
        }
      }

      .mobileset-scrollable {
        flex: 1;
        overflow-y: auto;
      }

      .version {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-top: auto;

        .num {
          font-size: 1rem;
          font-family: "字魂萌趣软糖体";
        }

        .github {
          width: 24px;
          height: 24px;
          margin-left: 12px;
          margin-top: 6px;

          &:hover {
            transform: scale(1.2);
          }
        }
      }

      .update {
        margin-top: 30px;
        height: 100%;

        :deep(.el-card__body) {
          height: 100%;

          .upnote {
            padding: 20px;
            height: calc(100% - 56px);
            overflow-y: auto;

            .uptext {
              display: flex;
              flex-direction: row;
              align-items: center;
              padding-bottom: 16px;

              &:nth-last-of-type(1) {
                padding: 0;
              }

              .i-icon {
                width: 22px;
                height: 22px;
                margin-right: 8px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
