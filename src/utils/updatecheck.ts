import config from "@/../package.json";
import i18n from "@/locales";
import type { VersionInfo } from "@/utils/ver";
// 这是一个“飞屋”模块，用于检测是否存在新版本。由于酪灰懒的一批，这个一点儿都不重要的模块由 AI 全权负责（？），酪灰只是瞅了几眼，就睡着了。所以有 BUG 记得用 issue 轰炸他！

export interface UpdateCheckResult {
  status: "true" | "false" | "error";
  latestVersion: string;
  isPreview: "true" | "false";
  versionType: string;
}

/**
 * 提取 GitHub 仓库所有者与仓库名
 */
const extractRepoInfo = (url: string): { owner: string; repo: string } | null => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, "").replace(/\/$/, ""),
  };
};

/**
 * 从 Release Tag 提取版本类型
 */
const extractVersionType = (tag: string, isPrerelease: boolean): string => {
  const lowerTag = tag.toLowerCase();
  if (/\bdev\b|\.dev/i.test(lowerTag)) return "dev";
  if (/\bpre\b|\.pre|preview/i.test(lowerTag)) return "pre";
  if (/\bbeta\b|\.beta/i.test(lowerTag)) return "beta";
  if (/\balpha\b|\.alpha/i.test(lowerTag)) return "alpha";
  return isPrerelease ? "pre" : "release";
};

/**
 * 清洗并标准化版本号为 major.minor.patch
 */
const cleanVersion = (version: string): string => {
  const match = version.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = match[1];
    const minor = match[2];
    const patch = match[3] || "0";
    return `${major}.${minor}.${patch}`;
  }
  return "0.0.0";
};

/**
 * 语义化比对两个三段式版本号
 * 返回: 1 (v1 > v2), -1 (v1 < v2), 0 (v1 === v2)
 */
const compareVersions = (v1: string, v2: string): number => {
  const p1 = v1.split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = v2.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

/**
 * 检查是否存在新版本
 */
export const checkForUpdate = async (versionInfo: VersionInfo): Promise<UpdateCheckResult> => {
  try {
    const repoUrl =
      versionInfo.upa === config.author || versionInfo.channel === "imsyy"
        ? config.github
        : config.efug;
    const repoInfo = extractRepoInfo(repoUrl);
    if (!repoInfo) {
      throw new Error(i18n.global.t("console.update.invalidGithubUrl"));
    }

    // 优先拉取最近的 Releases 列表（包含正式版与预发布版，最多拉取 10 条）
    const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases?per_page=10`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`${i18n.global.t("console.update.githubApiError")}${response.status}`);
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      // 仓库暂无 Release，视为当前版本
      return {
        status: "true",
        latestVersion: versionInfo.version,
        isPreview: versionInfo.type === "release" ? "false" : "true",
        versionType: versionInfo.type,
      };
    }

    const isCurrentPreview = versionInfo.type !== "release";

    // 智能筛选匹配的 Release:
    // 如果当前为正式版用户，优先匹配最新的非草稿、非预发布版；
    // 如果当前为预览/开发版用户，匹配最新的非草稿版本（支持获取更新的预览版或已发布的正式版）
    const targetRelease = isCurrentPreview
      ? releases.find((r: any) => !r.draft) || releases[0]
      : releases.find((r: any) => !r.draft && !r.prerelease) || releases[0];

    const latestTag = targetRelease.tag_name || "";
    const isLatestPrerelease = Boolean(targetRelease.prerelease);
    const extractedType = extractVersionType(latestTag, isLatestPrerelease);

    const cleanedLatestVersion = cleanVersion(latestTag);
    const cleanedCurrentVersion = cleanVersion(versionInfo.version);

    const cmp = compareVersions(cleanedCurrentVersion, cleanedLatestVersion);

    let hasUpdate = false;
    if (cmp < 0) {
      // 远端版本号更高
      if (isLatestPrerelease && !isCurrentPreview) {
        // 正式版用户不提示预发布版更新
        hasUpdate = false;
      } else {
        hasUpdate = true;
      }
    } else if (cmp === 0) {
      // 版本号数值相同（例如 4.4.1.dev 与 4.4.1 正式版）
      if (isCurrentPreview && !isLatestPrerelease) {
        // 当前是开发/尝鲜版，远端已发布同版本号的正式版，提示更新
        hasUpdate = true;
      }
    }

    const isLatest = !hasUpdate;

    return {
      status: isLatest ? "true" : "false",
      latestVersion: cleanedLatestVersion,
      isPreview: isLatestPrerelease ? "true" : "false",
      versionType: extractedType,
    };
  } catch (error) {
    console.error(i18n.global.t("console.update.updateCheckFailed"), error);
    return {
      status: "error",
      latestVersion: "0.0.0",
      isPreview: "false",
      versionType: "error",
    };
  }
};
