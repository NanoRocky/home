<template>
    <div class="devsettings">
        <el-collapse class="collapse" v-model="activeName" accordion>
            <el-collapse-item title="季节特效" name="1">
                <div class="item">
                    <el-button plain class="el-button" :class="{ 'active': store.showSnowfall }"
                        @click="toggleEffect('snow')">{{ store.showSnowfall ? "禁用" : "启用" }}冬日飘雪</el-button>
                    <el-button plain class="el-button" :class="{ 'active': store.showFirefly }"
                        @click="toggleEffect('firefly')">{{ store.showFirefly ? "禁用" : "启用" }}秋萤火虫</el-button>
                    <el-button plain class="el-button" :class="{ 'active': store.showLantern }"
                        @click="toggleEffect('lantern')">{{ store.showLantern ? "禁用" : "启用" }}春节灯笼</el-button>
                </div>
            </el-collapse-item>
            <el-collapse-item title="壁纸调整" name="2">
                <div class="item">
                    <div class="upver">使用内置壁纸时临时指定壁纸</div>
                </div>
                <div class="item">
                    <el-form :model="form" style="max-width: 120px" label-width="auto"
                        @submit.prevent="handleSetWallpaper">
                        <el-form-item prop="wallpaperId" :rules="[
                            { required: true, message: '壁纸号不能为空', trigger: 'blur' },
                            { pattern: /^\d+$/, message: '壁纸号必须为纯数字', trigger: ['blur', 'change'] }
                        ]">
                            <el-input v-model="form.wallpaperId" type="text" autocomplete="off" clearable />
                            <el-button plain class="el-button" native-type="submit"
                                :disabled="!form.wallpaperId">确定</el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </el-collapse-item>
            <el-collapse-item title="个性化设置" name="3">
                <div class="item">
                    <span class="text">信息区域显示自定义名</span>
                    <el-switch v-model="msgNameShow" inline-prompt :active-icon="CheckSmall"
                        :inactive-icon="CloseSmall" />
                </div>
            </el-collapse-item>
            <el-collapse-item title="壁纸高级设置" name="4">
                <div class="item">
                    <span class="text">壁纸自动切换</span><br><br>
                    <el-radio-group v-model="autoBGSwitchInterval" size="small" text-color="#FFFFFF">
                        <el-radio :value="0" border>禁用</el-radio>
                        <el-radio :value="1" border>15 秒</el-radio>
                        <el-radio :value="2" border>30 秒</el-radio>
                        <el-radio :value="3" border>45 秒</el-radio>
                    </el-radio-group>
                </div>
            </el-collapse-item>
            <el-collapse-item title="重置" name="5">
                <div class="item">
                    <el-button plain class="el-button" @click="resetSettings()">重置所有设置</el-button>
                </div>
            </el-collapse-item>
            <el-collapse-item title="检查版本更新" name="6">
                <div class="item">
                    <div class="upver">版本号 v{{ versionInfo.version }}，{{ versTypeT }}，{{ versionInfo.channel }} 渠道，by {{
                        versionInfo.upa }} 。
                    </div>
                </div>
                <div class="item">
                    <el-button plain class="el-button" @click="checkUpdate()">检查更新</el-button>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { CheckSmall, CloseSmall, SuccessPicture } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";
import { initSnowfall, closeSnowfall } from "@/utils/season/snow";
import { initFirefly, closeFirefly } from "@/utils/season/firefly";
import { initLantern, closeLantern } from "@/utils/season/lantern";
import { parseVersion } from "@/utils/ver";
import { checkForUpdate } from "@/utils/updatecheck";
import config from "@/../package.json";
const activeName = ref("0");
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
    playerDWRCShow,
    playerDWRCShowPro,
    playerDWRCATDB,
    playerDWRCATDBF,
    footerProgressBar,
    seasonalEffects,
    setV,
    theme,
    msgNameShow,
    playerDWRCPilfer,
    autoBGSwitchInterval
} = storeToRefs(store);

const versionInfo = parseVersion(config.version);
let chuores = 0;
const versTypeT = computed(() => {
    switch (versionInfo.type) {
        case 'preview':
            return '预览版';
        case 'development':
            return '开发版';
        case 'beta':
            return '尝鲜版';
        case 'release':
            return '正式版';
        default:
            return '未知版本';
    };
});

const checkUpdate = async () => {
    const updinfo = await checkForUpdate(versionInfo);
    if (updinfo.status == 'true') {
        ElMessage({
            message: `当前已是最新版本！ v${versionInfo.version} ， ${versionInfo.type} 。`,
            grouping: true,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("检查更新-已是最新版本.mp3");
        };
    } else if (updinfo.status == 'false') {
        ElMessage({
            message: `发现新版本 v${updinfo.latestVersion}，${updinfo.isPreview == 'true' ? "预览版" : "正式版"}，${updinfo.versionType} ，快来体验吧！`,
            grouping: true,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("检查更新-发现新版本.mp3");
        };
    } else {
        ElMessage({
            message: `版本检测异常，稍后再试试叭~`,
            grouping: true,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("检查更新-检测异常.mp3");
        };
    };
};

const toggleEffect = (type: 'snow' | 'firefly' | 'lantern') => {
    switch (type) {
        case 'snow':
            store.showSnowfall ? closeSnowfall() : initSnowfall();
            break;
        case 'firefly':
            store.showFirefly ? closeFirefly() : initFirefly();
            break;
        case 'lantern':
            store.showLantern ? closeLantern() : initLantern();
            break;
    }
};

const form = reactive({
    wallpaperId: ''
})

const resetSettings = () => {
    chuores = chuores + 1;
    if (chuores === 3) {
        ElMessage({
            dangerouslyUseHTMLString: true,
            message: `正在恢复默认配置，请稍后...`,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("重置2.mp3");
        };
        store.resetStore();
    } else if (chuores > 3) {
        ElMessage({
            dangerouslyUseHTMLString: true,
            message: `正在加载初始设置，请稍后...`,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("重置3.mp3");
        };
    } else {
        ElMessage({
            dangerouslyUseHTMLString: true,
            message: `确定要重置所有设置吗？操作将在点击 3 次后执行。`,
        });
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("重置1.mp3");
        };
    };
};

const handleSetWallpaper = () => {
    if (store.coverType != 0) {
        ElMessage.error('当前使用非内置壁纸，不支持该功能！');
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("壁纸ID设置失败.mp3");
        };
        return;
    };
    if (!form.wallpaperId.trim()) {
        ElMessage.error('壁纸号不能为空！');
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("壁纸ID设置失败.mp3");
        };
        return;
    };
    if (!/^\d+$/.test(form.wallpaperId)) {
        ElMessage.error('壁纸号必须为纯数字！');
        if (store.webSpeech) {
            stopSpeech();
            const voice = envConfig.VITE_TTS_Voice;
            const vstyle = envConfig.VITE_TTS_Style;
            SpeechLocal("壁纸ID设置失败.mp3");
        };
        return;
    };
    const wallpaperId = parseInt(form.wallpaperId, 10);
    store.setSBGCount(Number(wallpaperId));
    ElMessage.success(`已设置壁纸ID: ${wallpaperId}`);
    if (store.webSpeech) {
        stopSpeech();
        const voice = envConfig.VITE_TTS_Voice;
        const vstyle = envConfig.VITE_TTS_Style;
        SpeechLocal("壁纸ID设置成功.mp3");
    };
    form.wallpaperId = '';
};
</script>

<style lang="scss" scoped>
.devsettings {
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
            padding-left: 15px;
            border-color: transparent;
        }

        :deep(.el-collapse-item__wrap) {
            border-color: transparent;

            .el-collapse-item__content {
                padding: 18px;

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

                    .el-button {
                        margin: 8px 12px;
                        border: 2px solid transparent;
                        border-radius: 6px;
                        border-color: transparent;
                        background-color: var(--set-radio-bg-ck-color);
                        transition: all 0.1s ease;
                        position: relative;
                        overflow: hidden;
                        transform: scale(1);
                        color: var(--text-color);
                    }

                    .el-button.active {
                        border-color: transparent;
                        background-color: var(--set-radio-bg-ck-color);
                        border: 2px solid var(--set-radio-border-color) !important;
                        transition: all 0.1s ease;
                        position: relative;
                        overflow: hidden;
                        transform: scale(1);
                        color: var(--text-color);
                    }

                    .el-button:active {
                        transform: scale(0.9);
                        color: var(--text-color);
                        border: 1.5px solid rgba(176, 224, 230, 1) !important;
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

                    .el-input {
                        border-color: transparent;
                        background-color: #ffffff30;
                    }

                    .upver {
                        font-size: 0.75rem;
                        font-family: MiSans VF;
                        color: var(--text-color);
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
                            background: var(--set-radio-bg-ck-color) !important;
                            border: 2px solid var(--set-radio-border-color) !important;
                        }

                        .is-checked {
                            .el-radio__inner {
                                background-color: var(--set-radio-bg-ck-color) !important;
                                border-color: var(--set-radio-border-ck-color) !important;
                            }

                            &+.el-radio__label {
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