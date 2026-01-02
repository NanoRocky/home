import { PiniaPluginContext } from "pinia";
import { Speech, stopSpeech, SpeechLocal } from "@/utils/speech";

// Pinia 变量验证规则
export const validationRules = {
    coverType: {
        allowed: [0, 1, 2, 3, 4, 5],
        defaultValue: 1,
    },
    playerLoop: {
        allowed: ["all", "one", "none"],
        defaultValue: "all",
    },
    playerOrder: {
        allowed: ["list", "random"],
        defaultValue: "random",
    },
    theme: {
        allowed: ["system", "time", "bg", "light", "dark"],
        defaultValue: "system",
    },
    autoBGSwitchInterval: {
        allowed: [0, 1, 2, 3],
        defaultValue: 0,
    },
};

/**
 * Pinia 数据验证插件
 * @param context
 */
export const validationPlugin = ({ store }: PiniaPluginContext) => {
    store.$subscribe((mutation) => {
        if (mutation.type !== "direct") return;
        const event = Array.isArray(mutation.events) ? mutation.events[0] : mutation.events;
        if (!event || !("key" in event) || !("newValue" in event) || !("oldValue" in event)) {
            return;
        };
        const { key, newValue, oldValue } = event;
        if (Object.prototype.hasOwnProperty.call(validationRules, key)) {
            const rule = validationRules[key];
            let coercedValue = newValue;
            if (rule.allowed.length > 0 && typeof rule.allowed[0] === "number") {
                coercedValue = Number(newValue);
            };
            if (!rule.allowed.includes(coercedValue)) {
                store.$patch({ [key]: oldValue });
                console.error(`不支持将变量 '${String(key)}' 的值设置为 '${newValue}'，已阻止更改。`);
                ElMessage({
                    dangerouslyUseHTMLString: true,
                    message: `不支持将变量 '${String(key)}' 的值设置为 '${newValue}'，已阻止更改。`,
                });
                setTimeout(() => {
                    if (store.webSpeech) {
                        stopSpeech();
                        const voice = envConfig.VITE_TTS_Voice;
                        const vstyle = envConfig.VITE_TTS_Style;
                        SpeechLocal("变量异常.mp3");
                    };
                }, 300);
            };
        };
    });
};
