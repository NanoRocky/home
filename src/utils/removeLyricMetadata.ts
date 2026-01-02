/**
 * 剔除歌词中的元数据信息
 * 支持 LRC 逐行、网易云 YRC 逐字、QQ QRC 逐字三种格式
 * @param lrcText 原始歌词文本
 * @returns 去除头部和尾部元数据后的歌词文本
 */
export function removeLyricMetadata(lrcText: string): string {
    if (!lrcText || typeof lrcText !== 'string') {
        return '';
    }

    const lines = lrcText.split('\n');

    // 元数据关键词列表
    const metadataKeywords = [
        '作词', '作曲', '编曲', '制作', '混音', '录音', '吉他', '贝斯', '鼓',
        '钢琴', '键盘', '和声', '监制', '出品', '发行', '鸣谢', '制作人',
        '工作室', '人声', '编辑', '演唱', '合作', '宣传', '策划', '版权',
        '商务', '公司', 'OP:', 'ED:', 'SP:', '授权', '翻唱', '字幕', '现金', '词:', '曲:',
        '词：', '曲：', '词 :', '曲 :', '封面', '统筹', '导演', '执行', '出品', 'Remix', 'DJ:', '文化', 'OP :', 'DJ :', 'studio',
        '配唱', '录音师', '混音师', '母带',
        'Lyrics', 'Composed', 'Produced', 'Mixed', 'Mastered', 'Arranged'
    ];

    /**
     * 判断一行是否是元数据行
     * 创建临时变量，移除所有括号内的内容，保留纯字符进行判断
     */
    const isMetadataLine = (line: string): boolean => {
        // 忽略处理元数据标签行 [ti:][ar:][al:][by:][offset:][ch:] 等
        if (/^\[(?:ti|ar|al|by|offset|ch):/i.test(line.trim())) {
            return false; // 这些行本身就不会被输出，不需要处理
        }

        // 创建临时变量，移除所有中括号、大括号、小括号里的内容
        const temp = line.replace(/[\[\{]\w+[:\d,]*[\]\}]/g, '').replace(/\(\d+(?:,\d+)*\)/g, '');
        const pureText = temp.trim();

        // 检查纯字符是否包含任何元数据关键词
        for (const keyword of metadataKeywords) {
            if (pureText.includes(keyword)) {
                return true;
            }
        }

        return false;
    };

    // 从头部向下扫描，找到第一行非元数据的歌词行
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 跳过空行
        if (!line) {
            continue;
        }

        // 跳过元数据标签行
        if (/^\[(?:ti|ar|al|by|offset|ch):/i.test(line)) {
            continue;
        }

        // 检查是否是歌词行（必须有时间标签）
        if (!/^\[[\d,:.\s]+\]/.test(line)) {
            continue;
        }

        // 检查是否是元数据行
        if (isMetadataLine(line)) {
            continue;
        }

        // 找到第一行非元数据的歌词行，停止
        startIndex = i;
        break;
    }

    // 从尾部向上扫描，找到最后一行非元数据的歌词行
    let endIndex = lines.length - 1;
    for (let i = lines.length - 1; i >= startIndex; i--) {
        const line = lines[i].trim();

        // 跳过空行
        if (!line) {
            endIndex = i;
            continue;
        }

        // 跳过元数据标签行
        if (/^\[(?:ti|ar|al|by|offset|ch):/i.test(line)) {
            endIndex = i;
            continue;
        }

        // 检查是否是歌词行
        if (!/^\[[\d,:.\s]+\]/.test(line)) {
            endIndex = i;
            continue;
        }

        // 检查是否是元数据行
        if (isMetadataLine(line)) {
            endIndex = i;
            continue;
        }

        // 找到最后一行非元数据的歌词行，停止
        endIndex = i;
        break;
    }

    // 返回清理后的歌词（startIndex 到 endIndex 之间的所有行，保留原样格式）
    return lines.slice(startIndex, endIndex + 1).join('\n');
}