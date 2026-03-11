<template>
  <div class="setting">
    <el-collapse class="collapse" v-model="activeName" accordion>
      <el-collapse-item :title="$t('setting.tabs.personalWallpaper')" name="1">
        <div class="bg-set">
          <el-radio-group v-model="coverType" text-color="#ffffff" @change="radioChange">
            <el-radio :value="0" size="large" border>{{$t('setting.backgrounds.0')}}</el-radio>
            <el-radio :value="1" size="large" border>{{$t('setting.backgrounds.1')}}</el-radio>
            <el-radio :value="2" size="large" border>{{$t('setting.backgrounds.2')}}</el-radio>
            <el-radio :value="3" size="large" border>{{$t('setting.backgrounds.3')}}</el-radio>
            <el-radio :value="4" size="large" border>{{$t('setting.backgrounds.4')}}</el-radio>
            <el-radio :value="5" size="large" border>{{$t('setting.backgrounds.5')}}</el-radio>
            <el-radio :value="6" size="large" border>{{$t('setting.backgrounds.6')}}</el-radio>
          </el-radio-group>
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.themeSettings')" name="2">
        <div class="item">
          <span class="text">{{ $t('setting.themes.text') }}</span><br /><br />
          <el-radio-group v-model="theme" size="small" text-color="#FFFFFF">
            <el-radio value="system" border>{{ $t('setting.themes.system') }}</el-radio>
            <el-radio value="time" border>{{ $t('setting.themes.time') }}</el-radio>
            <el-radio value="bg" border>{{ $t('setting.themes.bg') }}</el-radio>
            <el-radio value="light" border>{{ $t('setting.themes.light') }}</el-radio>
            <el-radio value="dark" border>{{ $t('setting.themes.dark') }}</el-radio>
          </el-radio-group>
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.personalization')" name="3">
        <div class="item">
          <span class="text">{{ $t('setting.personalization.siteStartShow') }}</span>
          <el-switch
            v-model="siteStartShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.personalization.musicClick') }}</span>
          <el-switch
            v-model="musicClick"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.personalization.seasonalEffects') }}</span>
          <el-switch
            v-model="seasonalEffects"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.personalization.footerBlur') }}</span>
          <el-switch
            v-model="footerBlur"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.personalization.footerProgressBar') }}</span>
          <el-switch
            v-model="footerProgressBar"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.playerConfig')" name="4">
        <div class="item">
          <span class="text">{{ $t('setting.player.autoplay') }}</span>
          <el-switch
            v-model="playerAutoplay"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.player.randomOrder') }}</span>
          <el-switch
            v-model="playerOrder"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
            active-value="random"
            inactive-value="list"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.player.loopMode') }}</span>
          <el-radio-group v-model="playerLoop" size="small" text-color="#FFFFFF">
            <el-radio value="all" border>{{ $t('setting.player.loopAll') }}</el-radio>
            <el-radio value="one" border>{{ $t('setting.player.loopOne') }}</el-radio>
            <el-radio value="none" border>{{ $t('setting.player.loopNone') }}</el-radio>
          </el-radio-group>
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.lyricSettings')" name="5">
        <div class="item">
          <span class="text">{{ $t('setting.lyric.showFooterLyric') }}</span>
          <el-switch
            v-model="playerLrcShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div v-if="playerLrcShow" class="item">
          <span class="text" white-space="pre"
            >{{ $t('setting.lyric.useAMLL') }}<br />&nbsp;&nbsp;&nbsp;{{ $t('setting.lyric.amllNetworkWarning') }}</span
          >
          <el-switch
            v-model="playerDWRCATDB"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div v-if="playerLrcShow && playerDWRCATDB" class="item">
          <span class="text" white-space="pre">{{ $t('setting.lyric.useAMLLMirror') }}</span>
          <el-switch
            v-model="playerDWRCATDBF"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div v-if="playerLrcShow" class="item">
          <span class="text">{{ $t('setting.lyric.enableDWRC') }}</span>
          <el-switch
            v-model="playerDWRCShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div v-if="playerLrcShow && playerDWRCShow" class="item">
          <span class="text">{{ $t('setting.lyric.enableDWRCPro') }}</span>
          <el-switch
            v-model="playerDWRCShowPro"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.lyric.removeMetadata') }}</span>
          <el-switch
            v-model="playerRMMetadata"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.lyric.pilfer') }}</span>
          <el-switch
            v-model="playerDWRCPilfer"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">{{ $t('setting.lyric.translate') }}</span>
          <el-switch
            v-model="playerTrLrc"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.voiceSettings')" name="6">
        <div class="item">
          <span class="text">{{ $t('setting.voice.enableSwitch') }}</span>
          <el-switch
            v-model="webSpeech"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div v-if="webSpeech" class="item">
          <span class="text">{{ $t('setting.voice.announceSongName') }}</span>
          <el-switch
            v-model="playerSpeechName"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item :title="$t('setting.tabs.otherSettings')" name="7">
        <div class="text">{{ $t('setting.noMoreOptions') }}</div>
      </el-collapse-item>
      <el-collapse-item v-if="setV" :title="$t('setting.tabs.devSettings')" name="8">
        <DevSet />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CheckSmall, CloseSmall, SuccessPicture } from "@icon-park/vue-next";
import DevSet from "@/components/DevSet.vue";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import config from "@/../package.json";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";

const { t } = useI18n();
const store = mainStore();
const {
  coverType,
  siteStartShow,
  musicClick,
  playerLrcShow,
  footerBlur,
  playerAutoplay,
  playerOrder,
  playerLoop,
  webSpeech,
  playerSpeechName,
  playerTrLrc,
  playerDWRCShow,
  playerDWRCShowPro,
  playerDWRCATDB,
  playerDWRCATDBF,
  playerDWRCPilfer,
  playerRMMetadata,
  footerProgressBar,
  seasonalEffects,
  setV,
  theme,
  msgNameShow,
} = storeToRefs(store);

// 默认选中项
const activeName = ref("0");

// 壁纸切换
const radioChange = () => {
  ElMessage({
    message: t("setting.wallpaperChangeSuccess"),
    icon: h(SuccessPicture, {
      theme: "filled",
      fill: "var(--el-message-icon-color)",
    }),
  });
  if (store.webSpeech) {
    stopSpeech();
    const voice = envConfig.VITE_TTS_Voice;
    const vstyle = envConfig.VITE_TTS_Style;
    SpeechLocal("更换壁纸成功.mp3");
  }
};
</script>

<style lang="scss" scoped>
.setting {
  .text {
    color: var(--text-color);
  }

  .collapse {
    border-radius: 8px;
    --el-collapse-content-bg-color: var(--set-coll-background-ck-color);
    border-color: transparent;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
      background-color: var(--set-coll-background-color);
      color: var(--text-color);
      font-size: 15px;
      padding-left: 18px;
      border-color: transparent;
    }

    :deep(.el-collapse-item__wrap) {
      border-color: transparent;

      .el-collapse-item__content {
        padding: 20px;

        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          font-size: 14px;

          .el-switch__core {
            border-color: transparent;
            background-color: var(--set-radio-bg-ck-color);
          }

          .el-radio-group {
            .el-radio {
              margin: 2px 10px 2px 0;
              border-radius: 5px;

              &:last-child {
                margin-right: 0;
              }
            }
          }
        }

        .el-radio-group {
          justify-content: space-between;

          .el-radio {
            margin: 10px 16px;
            background: var(--set-radio-bg-color);
            border: 2px solid transparent;
            border-radius: 8px;

            .el-radio__label {
              color: var(--text-color);
            }

            .el-radio__inner {
              background: var(--set-radio-bg-color) !important;
              border: 2px solid var(--set-radio-border-color) !important;
            }

            &.is-checked {
              background: var(--set-radio-bg-color) !important;
              border: 2px solid var(--set-radio-border-color) !important;
            }

            .is-checked {
              .el-radio__inner {
                background-color: var(--set-radio-bg-ck-color) !important;
                border-color: var(--set-radio-border-ck-color) !important;
              }

              & + .el-radio__label {
                color: var(--text-color) !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>
