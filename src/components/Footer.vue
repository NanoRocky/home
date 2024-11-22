<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <Transition name="fade" mode="out-in">
      <div v-if="!store.playerState || !store.playerLrcShow" class="power">
        <span>
          <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="startYear < fullYear" class="site-start">
            {{ startYear }}
            -
          </span>
          {{ fullYear }}
          <a :href="siteUrl">{{ siteAuthor }}</a>
        </span>
        <!-- 以下信息请不要修改哦 -->
        <span class="hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">
            {{ config.author }}
          </a>
        </span>
        <!-- 站点备案 -->
        <span>
          &amp;
          <a v-if="siteIcp" href="https://beian.miit.gov.cn" target="_blank">
            {{ siteIcp }}
          </a>
          &amp;
          <!-- 这备那备的真的很扫（bushi） -->
          <a v-if="siteMps" href="https://beian.mps.gov.cn" target="_blank">
            {{ siteMps }}
          </a>
        </span>
      </div>
      <div v-else class="lrc">
        <Transition name="fade" mode="out-in" :id="`lrc-line-${store.playerLrc[0][2]}`"
          v-if="!(!store.yrcEnable || store.yrcTemp.length == 0 || store.yrcLoading)">
          <!-- &amp; -->
          <!-- 逐字模块山 -->
          <div class="lrc-all"
            :key="store.playerLrc.length != 0 ? `lrc-line-${store.playerLrc[0][2]}` : `lrc-line-null`">
            <music-one theme="filled" size="18" fill="#efefef" />
            <span class="yrc-box">
              <span class="yrc-2 lrc-text text-hidden" id="yrc-2-wrap">
                <span v-for="i in store.playerLrc" :key="`lrc-over-char-${i[2]}-${i[3]}`" v-html="i[4]">
                </span>
              </span>
              <span class="yrc-1 lrc-text text-hidden" id="yrc-1-wrap">
                <span v-for="i in store.playerLrc" :key="`lrc-char-${i[2]}-${i[3]}`"
                  :style="`opacity: ${i[1] ? '1' : '0.6'}`"
                  :class="`yrc-char ${i[0] ? 'fade-in' : 'fade-in-start'} ${i[0] > 1.5 ? 'long-tone' : 'fade-in-start'}`"
                  :id="`lrc-char-${i[2]}-${i[3]}`" v-html="i[4]">
                </span>
              </span>
            </span>
            <music-one theme="filled" size="18" fill="#efefef" />
          </div>
        </Transition>
        <Transition name="fade" mode="out-in" v-else>
          <!-- 逐行模块 -->
          <div class="lrc-all" :key="store.getPlayerLrc">
            <music-one theme="filled" size="18" fill="#efefef" />
            <span class="lrc-text text-hidden" v-html="store.getPlayerLrc[0][4]" :class="`lrc-char`" />
            <music-one theme="filled" size="18" fill="#efefef" />
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { MusicOne } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";

const store = mainStore();
const fullYear = new Date().getFullYear();

// 加载配置数据
// const siteStartDate = ref(import.meta.env.VITE_SITE_START);
const startYear = ref(
  import.meta.env.VITE_SITE_START?.length >= 4 ?
    import.meta.env.VITE_SITE_START.substring(0, 4) : null
);
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://www.imsyy.top";
  // 判断协议前缀
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  };
  return url;
});
</script>

<style lang="scss" scoped>
// 逐字模块1
.yrc-char {
  display: inline-block;
  opacity: 0.3;
  transform: translateY(1px);
  background-clip: text;
  -webkit-background-clip: text;
  font-family: MiSans-Regular;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear;

  &.fade-in-start {
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
    opacity: 0.3; // 初始显示的透明度
    transform: translateY(1px);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-in {
    opacity: 1;
    transform: translateY(-1px);
    animation: colorFade 0.7s ease-in-out forwards;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-enter-active {
    animation: float-up 0.3s linear forwards;
  }

  &.long-tone {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
    animation: pulse 1.5s infinite alternate;
  }
}

@keyframes float-up {
  from {
    transform: translateY(1px);
  }

  to {
    transform: translateY(-1px);
  }
}

@keyframes colorFade {
  from {
    color: #dfd9d9;
    opacity: 0.6;
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
  }

  to {
    color: rgba(255, 255, 255, 0.8);
    opacity: 1;
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  }
}

@keyframes pulse {
  from {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.4);
  }

  to {
    text-shadow: 0 0 15px rgba(255, 255, 255, 1),
      0 0 25px rgba(255, 255, 255, 0.8),
      0 0 35px rgba(255, 255, 255, 0.6);
  }
}

// 逐字模块2
#yrc-2-wrap>span {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  width: 0;
}

#yrc-2-wrap {
  display: inline-block;
  position: absolute;
  width: auto;
  opacity: 0.5;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  font-family: MiSans-Regular;
  overflow: hidden;
  white-space: nowrap;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear,
    width 0.3s linear;
}

// 逐行部分
.lrc-char {
  display: inline;
  opacity: 1;
  background-clip: text;
  -webkit-background-clip: text;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  font-family: MiSans-Regular;
  transition:
    opacity 0.3s linear,
    color 0.5s linear;
}

// End

#footer {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 16px;
  // 文字不换行
  word-break: keep-all;
  white-space: nowrap;

  .power {
    animation: fade 0.3s;
  }

  .lrc {
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    z-index: 1;
    justify-content: flex-start;

    .lrc-all {
      width: 98%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      white-space: nowrap;

      .lrc-text {
        margin: 0 8px;
      }

      .i-icon {
        width: 18px;
        height: 18px;
        display: inherit;
      }

      .yrc-box {
        justify-content: flex-start;
        position: relative;
        white-space: nowrap;
        align-items: center;
        width: auto;
        height: auto;
        z-index: 0;

        .yrc-1,
        .yrc-2 {
          white-space: nowrap;
        }

        .yrc-1 {
          z-index: 1;
        }

        .yrc-2 {
          position: absolute;
          z-index: 1000;
        }
      }
    }
  }

  &.blur {
    backdrop-filter: blur(10px);
    background: rgb(0 0 0 / 25%);
    font-size: 16px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease-in-out;
  }

  @media (max-width: 720px) {
    font-size: 0.9rem;

    &.blur {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
