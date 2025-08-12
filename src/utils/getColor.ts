/**
 * Get Color
 * Made by NanoRocky and Google Jules
 * 这个模块用于从背景图片实时获取主色调以变更背景色
 * @description
 * @param {HTMLImageElement} img
 * @returns {Promise<'light' | 'dark'>}
 */
export const getColor = (img: HTMLImageElement): Promise<'light' | 'dark'> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            return reject(new Error('无法获取 canvas 的 2d context'));
        };
        canvas.width = img.width;
        canvas.height = img.height;
        try {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let light = 0;
            let dark = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                if (brightness < 128) {
                    dark++;
                } else {
                    light++;
                };
            };
            resolve(light > dark ? 'light' : 'dark');
        } catch (e) {
            reject(new Error('无法处理图片以获取颜色'));
        };
    });
};
