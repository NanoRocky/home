import {
    ElMessage,
    ElMessageBox,
    ElNotification
} from "element-plus";

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $message: typeof ElMessage;
        $notify: typeof ElNotification;
        $msgbox: typeof ElMessageBox;
        $alert: typeof ElMessageBox.alert;
        $confirm: typeof ElMessageBox.confirm;
        $prompt: typeof ElMessageBox.prompt;
    }
}

// 全局变量声明
declare global {
    const ElMessage: typeof ElMessage;
    const ElNotification: typeof ElNotification;
    const ElMessageBox: typeof ElMessageBox;
}