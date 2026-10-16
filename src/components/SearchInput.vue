<template>
  <Transition name="search-float">
    <div
      v-if="store.searchOpenState"
      class="search-wrapper"
      ref="searchWrapperRef"
      :style="{ top: `${searchTop}px` }"
      @click.stop
    >
      <!-- 搜索引擎选择下拉弹窗 -->
      <Transition name="engine-menu">
        <div v-if="showEngineMenu" class="engine-dropdown" ref="engineMenuRef">
          <div
            v-for="item in engines"
            :key="item.key"
            class="engine-item"
            :class="{ active: item.key === currentEngine.key }"
            @click.stop="selectEngine(item)"
          >
            <span class="engine-icon" v-html="item.icon"></span>
            <span class="engine-name">{{ item.name }}</span>
            <span v-if="item.key === currentEngine.key" class="check-mark">✓</span>
          </div>
        </div>
      </Transition>
      <!-- 搜索框主体 -->
      <div class="search-box" :class="{ 'is-focused': isFocused }">
        <div class="search-blur-bg"></div>
        <!-- 引擎切换按钮 -->
        <div class="engine-btn" @click.stop="showEngineMenu = !showEngineMenu">
          <span class="engine-icon" v-html="currentEngine.icon"></span>
          <svg
            class="arrow-icon"
            :class="{ 'is-open': showEngineMenu }"
            viewBox="0 0 1024 1024"
            width="10"
            height="10"
          >
            <path
              d="M840.4 300H183.6c-19.7 0-30.7 22.8-18.4 37.4l328.4 389.3c9.8 11.6 27 11.6 36.8 0l328.4-389.3c12.3-14.6 1.3-37.4-18.4-37.4z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div class="divider"></div>
        <!-- 输入框 -->
        <input
          ref="inputRef"
          v-model="keyword"
          type="text"
          class="search-input"
          :placeholder="placeholderText"
          autocomplete="off"
          spellcheck="false"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown.enter="handleSearch"
          @keydown="handleInputKeyDown"
          @keydown.space.stop
        />
        <!-- 清空按钮 -->
        <button v-if="keyword" class="action-btn clear-btn" @click.stop="clearInput" type="button">
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 613.4l-50.8 50.8L512 562.8l-114.6 115.4-50.8-50.8L461.2 512 346.6 397.4l50.8-50.8L512 461.2l114.6-114.6 50.8 50.8L562.8 512l114.6 115.4z"
              fill="currentColor"
            />
          </svg>
        </button>
        <!-- 搜索确认按钮 -->
        <button class="action-btn search-btn" @click.stop="handleSearch" type="button">
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M909.6 854.5L649.9 594.8C690.2 537.8 714 468.5 714 393 714 205.5 561.5 53 374 53S34 205.5 34 393s152.5 340 340 340c75.5 0 144.8-23.8 201.8-64.1l259.7 259.7c15.1 15.1 39.5 15.1 54.6 0l19.5-19.5c15-15.1 15-39.6 0-54.6zM374 653c-143.6 0-260-116.4-260-260s116.4-260 260-260 260 116.4 260 260-116.4 260-260 260z"
              fill="currentColor"
            />
          </svg>
        </button>
        <!-- 快捷键标签 -->
        <span class="shortcut-tag" @click="closeSearch"> Alt Q </span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { mainStore } from "@/store";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";

const store = mainStore();
const { t } = useI18n();
const keyword = ref("");
const isFocused = ref(false);
const showEngineMenu = ref(false);
const searchTop = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);

interface SearchEngine {
  name: string;
  key: string;
  url: string;
  icon: string;
}

const engines: SearchEngine[] = [
  {
    name: "Bing",
    key: "bing",
    url: "https://www.bing.com/search?q={query}",
    icon: `<svg viewBox="0 0 256 388" width="18" height="18" fill="currentColor"><path d="M129.424 122.047c-7.133.829-12.573 6.622-13.079 13.928-.218 3.147-.15 3.36 6.986 21.722 16.233 41.774 20.166 51.828 20.827 53.243 1.603 3.427 3.856 6.65 6.672 9.544 2.16 2.22 3.585 3.414 5.994 5.024 4.236 2.829 6.337 3.61 22.818 8.49 16.053 4.754 24.824 7.913 32.381 11.664 9.791 4.86 16.623 10.387 20.944 16.946 3.1 4.706 5.846 13.145 7.04 21.64.468 3.321.47 10.661.006 13.663-1.008 6.516-3.021 11.976-6.101 16.545-1.638 2.43-1.068 2.023 1.313-.939 6.74-8.379 13.605-22.7 17.108-35.687 4.24-15.718 4.817-32.596 1.66-48.57-6.147-31.108-25.786-57.955-53.444-73.06-1.738-.95-8.357-4.42-17.331-9.085a1633 1633 0 0 1-4.127-2.154c-.907-.477-2.764-1.447-4.126-2.154-1.362-.708-5.282-2.75-8.711-4.539l-8.528-4.446a6021 6021 0 0 1-8.344-4.357c-8.893-4.655-12.657-6.537-13.73-6.863-1.125-.343-3.984-.782-4.701-.723-.152.012-.838.088-1.527.168" fill-opacity="0.75"/><path d="M148.81 277.994c-.493.292-1.184.714-1.537.938-.354.225-1.137.712-1.743 1.083a8315 8315 0 0 0-13.204 8.137 2848 2848 0 0 0-8.07 4.997 388 388 0 0 1-3.576 2.198c-.454.271-2.393 1.465-4.31 2.654a2652 2652 0 0 1-7.427 4.586 3958 3958 0 0 0-8.62 5.316 3011 3011 0 0 1-7.518 4.637c-1.564.959-3.008 1.885-3.21 2.058-.3.257-14.205 8.87-21.182 13.121-5.3 3.228-11.43 5.387-17.705 6.235-2.921.395-8.45.396-11.363.003-7.9-1.067-15.176-4.013-21.409-8.666-2.444-1.826-7.047-6.425-8.806-8.8-4.147-5.598-6.829-11.602-8.218-18.396-.32-1.564-.622-2.884-.672-2.935-.13-.13.105 2.231.528 5.319.44 3.211 1.377 7.856 2.387 11.829 7.814 30.743 30.05 55.749 60.15 67.646 8.668 3.424 17.415 5.582 26.932 6.64 3.576.4 13.699.56 17.43.276 17.117-1.296 32.02-6.334 47.308-15.996 1.362-.86 3.92-2.474 5.685-3.585a877 877 0 0 0 4.952-3.14c.958-.615 2.114-1.341 2.567-1.614a91 91 0 0 0 2.018-1.268c.656-.424 3.461-2.2 6.235-3.944l11.092-7.006 3.809-2.406.137-.086.42-.265.199-.126 2.804-1.771 9.69-6.121c12.348-7.759 16.03-10.483 21.766-16.102 2.392-2.342 5.997-6.34 6.176-6.848.037-.104.678-1.092 1.424-2.197 3.036-4.492 5.06-9.995 6.064-16.484.465-3.002.462-10.342-.005-13.663-.903-6.42-2.955-13.702-5.167-18.339-3.627-7.603-11.353-14.512-22.453-20.076-3.065-1.537-6.23-2.943-6.583-2.924-.168.009-10.497 6.322-22.954 14.03-12.457 7.71-23.268 14.4-24.025 14.87s-2.056 1.263-2.888 1.764z" fill-opacity="0.9"/><path d="m.053 241.013.054 53.689.695 3.118c2.172 9.747 5.937 16.775 12.482 23.302 3.078 3.07 5.432 4.922 8.768 6.896 7.06 4.177 14.657 6.238 22.978 6.235 8.716-.005 16.256-2.179 24.025-6.928 1.311-.801 6.449-3.964 11.416-7.029l9.032-5.572v-127.4l-.002-58.273c-.002-37.177-.07-59.256-.188-60.988-.74-10.885-5.293-20.892-12.948-28.461-2.349-2.323-4.356-3.875-10.336-7.99a25160 25160 0 0 1-12.104-8.336L28.617 5.835C22.838 1.85 22.386 1.574 20.639.949 18.367.136 15.959-.163 13.67.084 6.998.804 1.657 5.622.269 12.171.053 13.191.013 26.751.01 100.35l-.003 86.975H0z"/></svg>`,
  },
  {
    name: "Google",
    key: "google",
    url: "https://www.google.com/search?q={query}",
    icon: `<svg viewBox="0 0 255.878 261.1" width="18" height="18" fill="currentColor"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/></svg>`,
  },
  {
    name: "Bilibili",
    key: "bilibili",
    url: "https://search.bilibili.com/all?keyword={query}",
    icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.813 4.653h.854q2.266.08 3.773 1.574Q23.946 7.72 24 9.987v7.36q-.054 2.266-1.56 3.773c-1.506 1.507-2.262 1.524-3.773 1.56H5.333q-2.266-.054-3.773-1.56C.053 19.614.036 18.858 0 17.347v-7.36q.054-2.267 1.56-3.76t3.773-1.574h.774l-1.174-1.12a1.23 1.23 0 0 1-.373-.906q0-.534.373-.907l.027-.027q.4-.373.92-.373t.92.373L9.653 4.44q.107.106.187.213h4.267a.8.8 0 0 1 .16-.213l2.853-2.747q.4-.373.92-.373c.347 0 .662.151.929.4s.391.551.391.907q0 .532-.373.906zM5.333 7.24q-1.12.027-1.88.773-.76.748-.786 1.894v7.52q.026 1.146.786 1.893t1.88.773h13.334q1.12-.026 1.88-.773t.786-1.893v-7.52q-.026-1.147-.786-1.894t-1.88-.773zM8 11.107q.56 0 .933.373.375.374.4.96v1.173q-.025.586-.4.96-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q0-.56.386-.947.387-.386.947-.386m8 0q.56 0 .933.373.375.374.4.96v1.173q-.025.586-.4.96-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q.025-.586.4-.96.373-.373.933-.373"/></svg>`,
  },
  {
    name: "GitHub",
    key: "github",
    url: "https://github.com/search?q={query}",
    icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  },
  {
    name: "Steam",
    key: "steam",
    url: "https://store.steampowered.com/search/?term={query}",
    icon: `<svg viewBox="0 0 256 259" width="18" height="18" fill="currentColor"><path d="M127.779 0C60.42 0 5.24 52.412 0 119.014l68.724 28.674a35.812 35.812 0 0 1 20.426-6.366c.682 0 1.356.019 2.02.056l30.566-44.71v-.626c0-26.903 21.69-48.796 48.353-48.796 26.662 0 48.352 21.893 48.352 48.796 0 26.902-21.69 48.804-48.352 48.804-.37 0-.73-.009-1.098-.018l-43.593 31.377c.028.582.046 1.163.046 1.735 0 20.204-16.283 36.636-36.294 36.636-17.566 0-32.263-12.658-35.584-29.412L4.41 164.654c15.223 54.313 64.673 94.132 123.369 94.132 70.818 0 128.221-57.938 128.221-129.393C256 57.93 198.597 0 127.779 0zM80.352 196.332l-15.749-6.568c2.787 5.867 7.621 10.775 14.033 13.47 13.857 5.83 29.836-.803 35.612-14.799a27.555 27.555 0 0 0 .046-21.035c-2.768-6.79-7.999-12.086-14.706-14.909-6.67-2.795-13.811-2.694-20.085-.304l16.275 6.79c10.222 4.3 15.056 16.145 10.794 26.46-4.253 10.314-15.998 15.195-26.22 10.895zm121.957-100.29c0-17.925-14.457-32.52-32.217-32.52-17.769 0-32.226 14.595-32.226 32.52 0 17.926 14.457 32.512 32.226 32.512 17.76 0 32.217-14.586 32.217-32.512zm-56.37-.055c0-13.488 10.84-24.42 24.2-24.42 13.368 0 24.208 10.932 24.208 24.42 0 13.488-10.84 24.421-24.209 24.421-13.359 0-24.2-10.933-24.2-24.42z"/></svg>`,
  },
  {
    name: "YouTube",
    key: "youtube",
    url: "https://www.youtube.com/results?search_query={query}",
    icon: `<svg viewBox="1.376 1.326 243.258 170.273" width="18" height="18" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M239.564 27.912c-2.786-10.449-11.03-18.69-21.516-21.516-18.962-5.07-95.043-5.07-95.043-5.07s-76.042 0-95.043 5.07c-10.448 2.786-18.692 11.03-21.516 21.516-5.07 18.962-5.07 58.55-5.07 58.55s0 39.59 5.07 58.551c2.786 10.45 11.029 18.691 21.516 21.516 19 5.07 95.043 5.07 95.043 5.07s76.08 0 95.043-5.07c10.449-2.786 18.69-11.029 21.516-21.516 5.07-18.962 5.07-58.55 5.07-58.55s0-39.589-5.07-58.55zM98.703 122.955l63.194-36.493-63.194-36.492z"/></svg>`,
  },
  {
    name: "X",
    key: "x",
    url: "https://x.com/search?q={query}&src=typed_query",
    icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  },
  {
    name: "DuckDuckGo",
    key: "duckduckgo",
    url: "https://duckduckgo.com/?q={query}",
    icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 .984C18.083.984 23.016 5.916 23.016 12S18.084 23.016 12 23.016.984 18.084.984 12C.984 5.917 5.916.984 12 .984zm0 .938C6.434 1.922 1.922 6.434 1.922 12c0 4.437 2.867 8.205 6.85 9.55-.237-.82-.776-2.753-1.6-6.052-1.184-4.741-2.064-8.606 2.379-9.813.047-.011.064-.064.03-.093-.514-.467-1.382-.548-2.233-.38a.06.06 0 0 1-.07-.058c0-.011 0-.023.011-.035.205-.286.572-.507.822-.64a1.843 1.843 0 0 0-.607-.335c-.059-.022-.059-.12-.006-.144.006-.006.012-.012.024-.012 1.749-.233 3.586.292 4.49 1.448.011.011.023.017.035.023 2.968.635 3.509 4.837 3.328 5.998a9.607 9.607 0 0 0 2.346-.576c.746-.286 1.008-.222 1.101-.053.1.193-.018.513-.28.81-.496.567-1.393 1.01-2.974 1.137-.546.044-1.029.024-1.445.006-.789-.035-1.339-.059-1.633.39-.192.298-.041.998 1.487 1.22 1.09.157 2.078.047 2.798-.034.643-.07 1.073-.118 1.172.069.21.402-.996 1.207-3.066 1.224-.158 0-.315-.006-.467-.011-1.283-.065-2.227-.414-2.816-.735a.094.094 0 0 1-.035-.017c-.105-.059-.31.045-.188.267.07.134.444.478 1.004.776-.058.466.087 1.184.338 2l.088-.016c.041-.009.087-.019.134-.025.507-.082.775.012.926.175.717-.536 1.913-1.294 2.03-1.154.583.694.66 2.332.53 2.99-.004.012-.017.024-.04.035-.274.117-1.783-.296-1.783-.511-.059-1.075-.26-1.173-.493-1.225h-.156c.006.006.012.018.018.03l.052.12c.093.257.24 1.063.13 1.26-.112.199-.835.297-1.284.303-.443.006-.543-.158-.637-.408-.07-.204-.103-.675-.103-.95a.857.857 0 0 1 .012-.216c-.134.058-.333.193-.397.281-.017.262-.017.682.123 1.149.07.221-1.518 1.164-1.74.99-.227-.181-.634-1.952-.459-2.67-.187.017-.338.075-.42.191-.367.508.093 2.933.582 3.248.257.169 1.54-.553 2.176-1.095.105.145.305.158.553.158.326-.012.782-.06 1.103-.158.192.45.423.972.613 1.388 4.47-1.032 7.803-5.037 7.803-9.82 0-5.566-4.512-10.078-10.078-10.078zm1.791 5.646c-.42 0-.678.146-.795.332-.023.047.047.094.094.07.14-.075.357-.161.701-.156.328.006.516.09.67.159l.023.01c.041.017.088-.03.059-.065-.134-.18-.332-.35-.752-.35zm-5.078.198a1.24 1.24 0 0 0-.522.082c-.454.169-.67.526-.67.76 0 .051.112.057.141.011.081-.123.21-.31.617-.478.408-.17.73-.146.951-.094.047.012.083-.041.041-.07a.989.989 0 0 0-.558-.211zm5.434 1.423a.651.651 0 0 0-.655.647.652.652 0 0 0 1.307 0 .646.646 0 0 0-.652-.647zm.283.262h.008a.17.17 0 0 1 .17.17c0 .093-.077.17-.17.17a.17.17 0 0 1-.17-.17c0-.09.072-.165.162-.17zm-5.358.076a.752.752 0 0 0-.758.758c0 .42.338.758.758.758s.758-.337.758-.758a.756.756 0 0 0-.758-.758zm.328.303h.01c.112 0 .2.089.2.2 0 .11-.088.197-.2.197a.195.195 0 0 1-.197-.198c0-.107.082-.194.187-.199z"/></svg>`,
  },
  {
    name: "Baidu",
    key: "baidu",
    url: "https://www.baidu.com/s?wd={query}",
    icon: `<svg viewBox="0 0 64 64" width="18" height="18" fill="currentColor"><path d="M15.7 33.382c5.533-1.2 4.78-7.803 4.614-9.25-.27-2.23-2.894-6.122-6.452-5.816-4.478.4-5.132 6.87-5.132 6.87-.607 2.992 1.45 9.382 6.97 8.195zm10.272-11.1c3.055 0 5.525-3.518 5.525-7.867s-2.47-7.862-5.525-7.862-5.54 3.504-5.54 7.862 2.487 7.867 5.54 7.867m13.162.52c4.086.53 6.712-3.83 7.234-7.12.534-3.3-2.102-7.12-4.996-7.792s-6.518 3.98-6.847 7.005c-.396 3.7.53 7.396 4.606 7.92zm16.194 5.54c0-1.58-1.3-6.33-6.183-6.33-4.88 0-5.53 4.493-5.53 7.668 0 3.032.254 7.263 6.315 7.128s5.397-6.866 5.397-8.455zM21.586 44.875c-.162.452-.523 1.655-.2 2.7a3.07 3.07 0 0 0 2.636 2.428h2.897V42.9h-3.103a3.4 3.4 0 0 0-2.219 1.967zm27.57-2.652s-6.32-4.9-10-10.175c-5-7.793-12.095-4.634-14.483-.66-2.366 3.963-6.053 6.47-6.58 7.12S10.46 42.996 12.037 50s7.114 6.9 7.114 6.9a31 31 0 0 0 8.818-.659 18.6 18.6 0 0 1 8.817.262c2.875.794 11.064 3.705 14.1-3.43s-1.7-10.833-1.7-10.833zM30.222 52.85h-7.18c-3.106-.618-4.344-2.74-4.5-3.1s-1.032-2.07-.567-4.97c1.343-4.344 5.173-4.657 5.173-4.657h3.83v-4.706l3.26.05zm13.397-.05h-8.28c-3.207-.827-3.357-3.106-3.357-3.106v-9.156l3.357-.054v8.23c.203.877 1.295 1.035 1.295 1.035h3.4v-9.2h3.572z"/></svg>`,
  },
];

const currentEngine = computed(() => {
  return engines.find((e) => e.key === store.searchEngine) || engines[0];
});

const selectEngine = (engine: SearchEngine) => {
  store.searchEngine = engine.key;
  showEngineMenu.value = false;
  inputRef.value?.focus();
};

const placeholderText = computed(() => {
  return t("components.search.placeholder");
});

const calculatePosition = () => {
  const leftEl = document.querySelector(".page-container .left") as HTMLElement | null;
  const rightEl = (document.querySelector(".page-container .right") ||
    document.querySelector(".page-container .box")) as HTMLElement | null;
  const footerEl = document.querySelector("#footer") as HTMLElement | null;
  const leftBottom = leftEl ? leftEl.getBoundingClientRect().bottom : 0;
  const rightBottom = rightEl ? rightEl.getBoundingClientRect().bottom : 0;
  const contentBottom = Math.max(leftBottom, rightBottom);
  const footerTop = footerEl ? footerEl.getBoundingClientRect().top : window.innerHeight - 46;
  const availableGap = footerTop - contentBottom;
  const minRequiredGap = 62;

  if (availableGap < minRequiredGap || window.innerHeight < 550) {
    return {
      canOpen: false,
      centerY: 0,
      gap: availableGap,
    };
  }

  return {
    canOpen: true,
    centerY: Math.round((contentBottom + footerTop) / 2),
    gap: availableGap,
  };
};

let justOpened = false;

const openSearch = () => {
  if (
    store.mobileOpenState ||
    store.mobileFuncState ||
    store.setOpenState ||
    store.backgroundShow ||
    store.musicBoxOpenState ||
    (store.innerWidth != null && store.innerWidth <= 720)
  ) {
    store.searchOpenState = false;
    return;
  }

  const { canOpen, centerY } = calculatePosition();
  if (!canOpen) {
    store.searchOpenState = false;
    ElMessage({
      message: t("components.search.noSpace"),
      type: "warning",
      grouping: true,
      duration: 2500,
    });
    if (store.webSpeech) {
      stopSpeech();
      const voice = import.meta.env.VITE_TTS_Voice;
      const vstyle = import.meta.env.VITE_TTS_Style;
      SpeechLocal("搜索框分辨率不足.mp3");
    }
    return;
  }

  searchTop.value = centerY;
  store.searchOpenState = true;
  justOpened = true;
  setTimeout(() => {
    justOpened = false;
  }, 120);

  nextTick(() => {
    inputRef.value?.focus();
  });
};

const closeSearch = () => {
  store.searchOpenState = false;
  showEngineMenu.value = false;
};

const clearInput = () => {
  keyword.value = "";
  inputRef.value?.focus();
};

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
};

const isPrivateIPv6 = (ip: string): boolean => {
  const clean = ip
    .replace(/^\[|\]$/g, "")
    .split("%")[0]
    .toLowerCase();
  if (clean === "::1" || clean === "0:0:0:0:0:0:0:1") return true;
  if (clean === "::" || clean === "0:0:0:0:0:0:0:0") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(clean) || clean.startsWith("fc:") || clean.startsWith("fd:"))
    return true;
  if (/^fe[89ab][0-9a-f]:/i.test(clean) || clean.startsWith("fe80:")) return true;
  if (clean.startsWith("::ffff:")) {
    const v4 = clean.replace("::ffff:", "");
    return isPrivateIPv4(v4);
  }
  return false;
};

const getDirectUrl = (raw: string): string | null => {
  const query = raw.trim();
  if (
    !query ||
    query.includes(" ") ||
    (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(query) && !/^https?:\/\//i.test(query))
  ) {
    return null;
  }
  try {
    const hasExplicitProtocol = /^https?:\/\//i.test(query);
    let normalizedQuery = query;
    if (
      !hasExplicitProtocol &&
      !normalizedQuery.startsWith("[") &&
      normalizedQuery.split(":").length >= 3 &&
      /^[0-9a-fA-F:]+$/.test(normalizedQuery)
    ) {
      normalizedQuery = `[${normalizedQuery}]`;
    }
    const testUrl = hasExplicitProtocol ? normalizedQuery : `http://${normalizedQuery}`;
    const parsed = new URL(testUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const host = parsed.hostname;
    if (!host) return null;
    const isLocalhost = host === "localhost" || host.endsWith(".localhost");
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isIpv6 = host.startsWith("[") && host.endsWith("]");
    const isIp = isIpv4 || isIpv6;
    const isPrivate = isIpv4 ? isPrivateIPv4(host) : isIpv6 ? isPrivateIPv6(host) : false;
    const parts = host.split(".");
    const tld = parts[parts.length - 1];
    const isValidDomain = parts.length >= 2 && /^[a-zA-Z]{2,}$/.test(tld);
    if (!isLocalhost && !isIp && !isValidDomain) {
      return null;
    }
    if (!hasExplicitProtocol) {
      if (isLocalhost || (isIp && isPrivate)) {
        parsed.protocol = "http:";
      } else {
        parsed.protocol = "https:";
      }
    } else {
      if (isValidDomain && !isLocalhost && !isIp && parsed.protocol === "http:") {
        parsed.protocol = "https:";
      }
    }
    if (!isLocalhost && !isIp) {
      parsed.port = "";
    }
    if (!parsed.pathname || parsed.pathname === "") {
      parsed.pathname = "/";
    }
    let result = parsed.href;
    const origin = `${parsed.protocol}//${parsed.host}`;
    if (result === origin) {
      result = `${origin}/`;
    }
    return result;
  } catch {
    return null;
  }
};

const handleSearch = () => {
  const query = keyword.value.trim();
  if (!query) {
    inputRef.value?.focus();
    return;
  }

  const directUrl = getDirectUrl(query);

  if (directUrl) {
    window.open(directUrl, "_blank", "noopener,noreferrer");
  } else {
    const rawUrl = currentEngine.value.url;
    const searchUrl = /\{.*?\}/.test(rawUrl)
      ? rawUrl.replace(/\{.*?\}/g, encodeURIComponent(query))
      : `${rawUrl}${encodeURIComponent(query)}`;
    window.open(searchUrl, "_blank");
  }

  keyword.value = "";
  closeSearch();
};

const handleInputKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Delete") {
    e.preventDefault();
    clearInput();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.altKey && (e.key === "q" || e.key === "Q" || e.code === "KeyQ")) {
    e.preventDefault();
    store.searchOpenState = !store.searchOpenState;
    return;
  }
  if (e.key === "Escape" && store.searchOpenState) {
    e.preventDefault();
    closeSearch();
    return;
  }
  if (e.key === "Delete" && store.searchOpenState) {
    e.preventDefault();
    clearInput();
    return;
  }
};

const handleDocumentClick = (e: MouseEvent) => {
  if (!store.searchOpenState || justOpened) return;
  const target = e.target as HTMLElement;
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(target)) {
    closeSearch();
  }
};

const handleResize = () => {
  if (!store.searchOpenState) return;
  if (store.mobileOpenState || (store.innerWidth != null && store.innerWidth <= 720)) {
    closeSearch();
    return;
  }
  const { canOpen, centerY } = calculatePosition();
  if (!canOpen) {
    closeSearch();
  } else {
    searchTop.value = centerY;
  }
};

watch(
  () => store.searchOpenState,
  (isOpen) => {
    if (isOpen) {
      if (searchTop.value === 0 || !justOpened) {
        openSearch();
      }
    } else {
      showEngineMenu.value = false;
    }
  },
);

watch(
  () => [store.mobileOpenState, store.setOpenState, store.backgroundShow],
  ([mobile, set, bg]) => {
    if ((mobile || set || bg) && store.searchOpenState) {
      closeSearch();
    }
  },
);

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("click", handleDocumentClick);
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.search-wrapper {
  position: fixed;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 32px));
  z-index: 99;
  user-select: none;
  will-change: opacity, margin-top;
}

.search-box {
  position: relative;
  width: 100%;
  height: 44px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 8px 0 6px;
  border-radius: 22px;
  overflow: hidden;

  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.015) 100%),
    var(--search-background-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 12px 34px rgba(0, 0, 0, 0.28),
    0 2px 6px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.18);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.35);
    box-shadow:
      0 14px 38px rgba(0, 0, 0, 0.32),
      0 2px 8px rgba(0, 0, 0, 0.12),
      inset 0 1px 1px rgba(255, 255, 255, 0.22);
  }

  &.is-focused {
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow:
      0 14px 40px rgba(0, 0, 0, 0.36),
      0 0 0 2px rgba(255, 255, 255, 0.18),
      inset 0 1px 1px rgba(255, 255, 255, 0.28);
  }
}

.search-blur-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  pointer-events: none;
  z-index: 0;
  transform: translateZ(0);
}

.engine-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-color, #fff);

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .engine-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .arrow-icon {
    opacity: 0.6;
    transition: transform 0.2s ease;

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

.divider {
  position: relative;
  z-index: 1;
  width: 1px;
  height: 18px;
  background-color: rgba(255, 255, 255, 0.18);
  margin: 0 4px;
}

.search-input {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-color, #fff);
  font-family: inherit;
  font-size: 0.95rem;
  padding: 0 8px;
  letter-spacing: 0.2px;

  &::placeholder {
    color: var(--text-color, #fff);
    opacity: 0.5;
  }
}

.action-btn {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  color: var(--text-color, #fff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.7;
  transition:
    opacity 0.2s,
    background-color 0.2s,
    transform 0.15s;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.92);
  }
}

.shortcut-tag {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-family: monospace, sans-serif;
  color: var(--text-color, #fff);
  opacity: 0.45;
  padding: 2px 7px;
  margin-left: 2px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition:
    opacity 0.2s,
    background-color 0.2s;

  &:hover {
    opacity: 0.9;
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.engine-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 170px;
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 14px;
  background-color: var(--search-dropdown-background-color);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  z-index: 101;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25);
    border-radius: 4px;
  }
}

.engine-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-color, #fff);
  font-size: 0.88rem;
  transition: background-color 0.18s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.22);
    font-weight: 500;
  }

  .engine-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }

  .engine-name {
    flex: 1;
  }

  .check-mark {
    font-size: 0.85rem;
    color: rgb(57, 159, 255);
  }
}

.search-float-enter-active {
  transition:
    opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    margin-top 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.search-float-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    margin-top 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-float-enter-from {
  opacity: 0;
  margin-top: 24px;
}

.search-float-leave-to {
  opacity: 0;
  margin-top: 12px;
}

.engine-menu-enter-active,
.engine-menu-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.engine-menu-enter-from,
.engine-menu-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
