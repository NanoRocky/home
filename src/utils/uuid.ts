/** 公开 UUID 版本号 */
export const PUBLIC_UUID_VERSION = 4;

/** 当前程序序列号版本 */
export const CLIENT_UUID_SERIAL_VERSION = 2;

/** 第一段暗号 */
export const MAGIC_PREFIX = "6e72";

/** 第二段暗号 */
export const MAGIC_MID = "686f";


const calcChecksum = (payload: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const folded = ((hash >>> 16) ^ (hash & 0xffff)) >>> 0;
  return folded.toString(16).padStart(4, "0");
};


const getRandomHex = (len: number): string => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(Math.ceil(len / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, len);
  }
  let s = "";
  for (let i = 0; i < len; i++) {
    s += Math.floor(Math.random() * 16).toString(16);
  }
  return s;
};


const getRandomVariantChar = (): string => {
  const chars = ["8", "9", "a", "b"];
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    return chars[buf[0] & 0x3];
  }
  return chars[Math.floor(Math.random() * 4)];
};

export const generateClientUUID = (): string => {
  const r1 = getRandomHex(4);
  const r2 = getRandomHex(2);
  const v = getRandomVariantChar();
  const r3 = getRandomHex(3);
  const r4 = getRandomHex(8);
  const prefix = `${MAGIC_PREFIX}${r1}-${MAGIC_MID}-${PUBLIC_UUID_VERSION}${CLIENT_UUID_SERIAL_VERSION}${r2}-${v}${r3}-${r4}`;
  const checksum = calcChecksum(prefix);
  return `${prefix}${checksum}`;
};

const VALID_UUID_REGEX = new RegExp(
  `^${MAGIC_PREFIX}[0-9a-f]{4}-${MAGIC_MID}-${PUBLIC_UUID_VERSION}${CLIENT_UUID_SERIAL_VERSION}[0-9a-f]{2}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
  "i"
);


export const isValidClientUUID = (uuid: unknown): boolean => {
  if (typeof uuid !== "string" || uuid.length !== 36) {
    return false;
  }
  const clean = uuid.toLowerCase();
  if (!VALID_UUID_REGEX.test(clean)) {
    return false;
  }
  const payload = clean.slice(0, 32);
  const checksum = clean.slice(32);
  return calcChecksum(payload) === checksum;
};

export const ensureClientUUID = (currentUUID?: string | null): string => {
  if (isValidClientUUID(currentUUID)) {
    return currentUUID as string;
  }
  return generateClientUUID();
};
