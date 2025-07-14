import { parseVersion } from "@/utils/ver";
import config from "@/../package.json";

// 这是一个“飞屋”模块，用于检测是否存在新版本。由于酪灰懒的一批，这个一点儿都不重要的模块由 AI 全权负责（？），酪灰只是瞅了几眼，就睡着了。所以有 BUG 记得用 issue 轰炸他！

const extractRepoInfo = (url: string): { owner: string; repo: string } | null => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match || match.length < 3) return null;
    return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
    };
};

const extractVersionType = (tag: string): string => {
    const cleanTag = tag.replace(/^v/i, '').replace(/\.[a-z]+$/i, '');
    const typeMatch = cleanTag.match(/\.([a-z]+)\.?/i);
    if (typeMatch && typeMatch[1]) {
        return typeMatch[1].toLowerCase();
    };
    if (cleanTag.includes('.pre')) return 'pre';
    if (cleanTag.includes('.beta')) return 'beta';
    if (cleanTag.includes('.dev')) return 'dev';
    if (cleanTag.includes('.alpha')) return 'alpha';
    return 'release';
};

const cleanVersion = (version: string): string => {
    let cleaned = version.replace(/^[^\d]+/i, '');
    const versionParts: string[] = [];
    const parts = cleaned.split('.');
    for (const part of parts) {
        const numMatch = part.match(/\d+/);
        if (numMatch) {
            versionParts.push(numMatch[0]);

            if (versionParts.length >= 3) break;
        };
    };

    while (versionParts.length < 3) {
        versionParts.push('0');
    };
    return versionParts.slice(0, 3).join('.');
};

export const checkForUpdate = async (
    versionInfo: {
        upa: string;
        channel: string;
        version: string;
        type: string;
    }
): Promise<{
    status: string;
    latestVersion: string;
    isPreview: string;
    versionType: string;
}> => {
    try {
        const repoUrl = versionInfo.upa === 'imsyy' ? config.github : config.efug;
        const repoInfo = extractRepoInfo(repoUrl);
        if (!repoInfo) {
            throw new Error('无效的 GitHub 仓库 URL');
        };
        const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases/latest`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`GitHub API 错误: ${response.status}`);
        };
        const releaseData = await response.json();
        const latestTag = releaseData.tag_name;
        const isPrerelease = releaseData.prerelease;
        const targetCommitish = releaseData.target_commitish?.toLowerCase() || '';
        const currentChannel = versionInfo.channel.toLowerCase();
        if (targetCommitish !== '' && targetCommitish !== currentChannel) {
            return {
                status: 'true',
                latestVersion: versionInfo.version,
                isPreview: versionInfo.type === 'release' ? 'false' : 'true',
                versionType: versionInfo.type
            };
        };
        const extractedType = extractVersionType(latestTag);
        const isConsistent =
            (isPrerelease && ['pre', 'beta', 'dev', 'alpha'].includes(extractedType)) ||
            (!isPrerelease && extractedType === 'release');
        if (!isConsistent) {
            return {
                status: 'true',
                latestVersion: versionInfo.version,
                isPreview: versionInfo.type === 'release' ? 'false' : 'true',
                versionType: versionInfo.type
            };
        };
        const cleanedLatestVersion = cleanVersion(latestTag);
        const cleanedCurrentVersion = cleanVersion(versionInfo.version);
        const compareVersions = (v1: string, v2: string): number => {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const num1 = parts1[i] || 0;
                const num2 = parts2[i] || 0;

                if (num1 < num2) return -1;
                if (num1 > num2) return 1;
            };
            return 0;
        };
        const versionComparison = compareVersions(cleanedCurrentVersion, cleanedLatestVersion);
        const isCurrentPreview = versionInfo.type !== 'release';
        let isLatest = false;
        if (versionComparison === 0) {
            if (isCurrentPreview && !isPrerelease) {
                isLatest = false;
            } else if (!isCurrentPreview && isPrerelease) {
                isLatest = true;
            } else {
                isLatest = true;
            };
        } else if (versionComparison > 0) {
            isLatest = true;
        } else {
            if (isPrerelease && !isCurrentPreview) {
                isLatest = true;
            } else {
                isLatest = false;
            };
        };
        return {
            status: isLatest ? 'true' : 'false',
            latestVersion: cleanedLatestVersion,
            isPreview: isPrerelease ? 'true' : 'false',
            versionType: extractedType
        };
    } catch (error) {
        console.error('更新检查失败:', error);
        return {
            status: 'error',
            latestVersion: '0.0.0',
            isPreview: 'false',
            versionType: 'error'
        };
    }
};