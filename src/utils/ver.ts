import config from "@/../package.json";

export type VersionType = "preview" | "development" | "beta" | "release";

export interface VersionInfo {
  version: string;
  type: VersionType;
  channel: string;
  upa: string;
}

/**
 * 解析项目版本号
 * 格式如: "4.4.1.dev [EFU]" -> { version: "4.4.1", type: "development", channel: "EFU", upa: "NanoRocky" }
 */
export const parseVersion = (ver: string): VersionInfo => {
  const versionMatch = ver.match(/^(\d+\.\d+\.\d+)/);
  const channelMatch = ver.match(/\[([^\]]+)\]$/);

  let type: VersionType = "release";
  if (/\.pre\b/i.test(ver)) {
    type = "preview";
  } else if (/\.dev\b/i.test(ver)) {
    type = "development";
  } else if (/\.beta\b/i.test(ver)) {
    type = "beta";
  }

  const channel = channelMatch?.[1] || "imsyy";
  const upa = channel !== "imsyy" ? config.efua : config.author;

  return {
    version: versionMatch?.[1] || "0.0.0",
    type,
    channel,
    upa,
  };
};
