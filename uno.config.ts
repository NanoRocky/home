import { defineConfig, presetAttributify, presetIcons, presetMini, presetTypography } from 'unocss';
import presetWind3 from '@unocss/preset-wind3';

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