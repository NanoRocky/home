<template>
  <!-- 功能区域 -->
  <div :class="store.mobileFuncState ? 'function mobile' : 'function'">
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="left">
          <Hitokoto />
          <Music v-if="playerHasId" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="right cards">
          <div class="time">
            <div class="date" v-if="locale === 'zh-CN'">
              <span>{{ currentTime.year }}&nbsp;{{ $t("common.unit.year") }}&nbsp;</span>
              <span>{{ currentTime.month }}&nbsp;{{ $t("common.unit.month") }}&nbsp;</span>
              <span>{{ currentTime.day }}&nbsp;{{ $t("common.unit.day") }}&nbsp;</span>
              <span class="sm-hidden">{{ currentTime.weekday }}</span>
            </div>
            <div class="date" v-else>
              <span>{{ enDateText }}&nbsp;</span>
              <span class="sm-hidden">{{ currentTime.weekday }}</span>
            </div>
            <div class="text">
              <span v-for="(char, index) in timeText" :key="index" :class="{ 'colon': char === ':', 'num': char !== ':' }">{{ char }}</span>
            </div>
          </div>
          <Weather />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { getCurrentTime } from "@/utils/getTime";
import { mainStore } from "@/store";
import Music from "@/components/Music.vue";
import Hitokoto from "@/components/Hitokoto.vue";
import Weather from "@/components/Weather.vue";
import { useI18n } from "vue-i18n";

const store = mainStore();
const { locale } = useI18n();

interface CurrentTime {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
  second: number;
};

// 当前时间
const currentTime = ref < CurrentTime > ({
  year: 0,
  month: 0,
  day: 0,
  weekday: "",
  hour: 0,
  minute: 0,
  second: 0,
});
const timeInterval = ref < number | null > (null);

// 播放器 id
const playerHasId = envConfig.VITE_SONG_ID;

// 处理时间格式为字符串数组
const timeText = computed(() => {
  return `${currentTime.value.hour}:${currentTime.value.minute}:${currentTime.value.second}`;
});

// 英文日期格式
const enDateText = computed(() => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const mIndex = Number(currentTime.value.month) - 1;
  const monthName = months[mIndex] || '';
  return `${monthName} ${currentTime.value.day}, ${currentTime.value.year}`;
});

// 更新时间
const updateTimeData = () => {
  Object.assign(currentTime.value, getCurrentTime());
};

onMounted(() => {
  updateTimeData();
  timeInterval.value = setInterval(updateTimeData, 1000) as unknown as number;
});

onBeforeUnmount(() => {
  if (timeInterval.value !== null) {
    clearInterval(timeInterval.value);
  };
});
</script>

<style lang="scss" scoped>
.function {
  height: 165px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  &.mobile {
    .el-row {
      .el-col {
        &:nth-of-type(1) {
          display: contents;
        }

        &:nth-of-type(2) {
          display: none;
        }
      }
    }
  }

  .el-row {
    height: 100%;
    width: 100%;
    margin: 0 !important;

    .el-col {
      &:nth-of-type(1) {
        padding-left: 0 !important;
      }

      &:nth-of-type(2) {
        padding-right: 0 !important;
      }

      @media (max-width: 910px) {
        &:nth-of-type(1) {
          display: none;
        }

        &:nth-of-type(2) {
          padding: 0 !important;
          flex: none;
          max-width: none;
          width: 100%;
        }
      }
    }

    .left,
    .right {
      width: 100%;
      height: 100%;
    }

    .right {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      animation: fade 0.5s;

      .time {
        font-size: 1.1rem;
        text-align: center;

        .date {
          text-overflow: ellipsis;
          overflow-x: hidden;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .text {
          margin-top: 10px;
          font-size: 3.25rem;
          letter-spacing: 2px;
          font-family: "UnidreamLED";
          font-variant-numeric: tabular-nums;
          display: flex;
          justify-content: center;

          span {
            text-align: center;
          }
          .num {
            width: 0.48em;
          }
          .colon {
            width: 0.25em;
          }
        }

        @media (min-width: 1201px) and (max-width: 1280px) {
          font-size: 1rem;
        }

        @media (min-width: 911px) and (max-width: 992px) {
          font-size: 1rem;

          .text {
            font-size: 2.75rem;
          }
        }
      }

      .weather {
        text-align: center;
        width: 100%;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>
