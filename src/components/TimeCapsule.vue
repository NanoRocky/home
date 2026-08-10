<template>
  <div class="time-capsule">
    <div class="title">
      <hourglass-full
        theme="two-tone"
        size="24"
        :fill="['var(--time-icon-one-color)', 'var(--time-icon-two-color)']"
      />
      <span>{{ $t("components.timeCapsule.title") }}</span>
    </div>
    <div v-if="timeData" class="all-capsule">
      <div v-for="(item, tag, index) in timeData" :key="index" class="capsule-item">
        <div class="item-title">
          <span class="percentage">
            {{ $t(`components.timeCapsule.${tag}`) }}{{ $t("components.timeCapsule.passed") }}
            <strong>{{ item.passed }}</strong>
            {{
              tag === "day" ? $t("components.timeCapsule.hours") : $t("components.timeCapsule.days")
            }}
          </span>
          <span class="remaining">
            {{ $t("components.timeCapsule.remaining") }}&nbsp;{{ item.remaining }}&nbsp;{{
              tag === "day" ? $t("components.timeCapsule.hours") : $t("components.timeCapsule.days")
            }}
          </span>
        </div>
        <el-progress :text-inside="true" :stroke-width="20" :percentage="Number(item.percentage)" />
      </div>
      <!-- 建站日期 -->
      <div v-if="store.siteStartShow && startDateText" class="capsule-item start">
        <div class="item-title">
          {{
            $t("components.timeCapsule.sitePassed", {
              years: startDateText[0],
              months: startDateText[1],
              days: startDateText[2],
            })
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HourglassFull } from "@icon-park/vue-next";
import { getTimeCapsule, siteDateStatistics } from "@/utils/getTime.js";
import { mainStore } from "@/store";
import { onMounted, onBeforeUnmount, ref } from "vue";
const store = mainStore();

// 进度条数据
const timeData = ref(getTimeCapsule());
const startDate = ref(envConfig.VITE_SITE_START);
const startDateText = ref<number[] | null>(null);
const timeInterval = ref<number | null>(null);

onMounted(() => {
  timeInterval.value = window.setInterval(() => {
    timeData.value = getTimeCapsule();
    if (startDate.value) startDateText.value = siteDateStatistics(new Date(startDate.value));
  }, 1000);
});

onBeforeUnmount(() => {
  if (timeInterval.value !== null) {
    clearInterval(timeInterval.value);
    timeInterval.value = null;
  }
});
</script>

<style lang="scss" scoped>
.time-capsule {
  width: 100%;

  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0.2rem 0 1.5rem;
    font-size: 1.1rem;

    .i-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 6px;
    }
  }

  .all-capsule {
    .capsule-item {
      margin-bottom: 1rem;

      .item-title {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin: 1rem 0rem 0.5rem 0rem;
        font-size: 0.95rem;

        .remaining {
          opacity: 0.6;
          font-size: 0.85rem;
          font-style: oblique;
        }
      }

      &:last-child {
        margin-bottom: 0;
      }

      &.start {
        .item-title {
          justify-content: center;
          opacity: 0.8;
          font-size: 0.85rem;
        }
      }
    }
  }
}
</style>
