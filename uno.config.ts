import { defineConfig, presetAttributify, presetIcons, presetMini, presetTypography } from 'unocss';

export default defineConfig({
    presets: [
        presetMini(),
        presetAttributify(),
        presetIcons(),
        presetTypography(),
    ],
    rules: [
    ],
    shortcuts: [
    ],
})