export type VersionType = "preview" | "development" | "beta" | "release";

export interface VersionInfo {
  version: string;
  type: VersionType;
  channel: string;
  upa: string;
}

export interface UpdateCheckResult {
  status: "true" | "false" | "error";
  latestVersion: string;
  isPreview: "true" | "false";
  versionType: string;
}
