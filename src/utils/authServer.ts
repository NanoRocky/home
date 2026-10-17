/**
 * authServer
 * Made by NanoRocky
 * 这个模块除了腾讯地图的签名认证外，其余函数并不对其他人有任何鸟用（大概叭）
 * 涉及到接口加密的东西怎么能不整点代码混淆，对叭对叭~（x）
 * 该说不说写点答辩还挺有意思嘟（bushi）
 */

import { md5 as md } from "@noble/hashes/legacy.js";
import { bytesToHex as byt, utf8ToBytes as ut } from "@noble/hashes/utils.js";
import { mainStore as ms } from "@/store";

let x: number | null = null,
  y: number | null = null,
  ud: string | null = null;
const d = (msg: string) => byt(md(ut(msg)));
const f = () => Math.floor(Date.now() / 1000),
  o = (v: number) => v.toString(16),
  c = (q: URLSearchParams) => (q.delete("sig"), q.delete("sign"));

function gud(): string {
  if (ud) {
    return ud;
  }
  try {
    const sre = ms();
    if (sre.clientUUID) {
      ud = sre.clientUUID;
      return sre.clientUUID;
    }
    return "";
  } catch {
    return "";
  }
}

async function gst() {
  // 为什么这里要整一个模块用于获取网络时间呢...
  // 因为客户端时间不可信，即使客户端会自动对时，也很难避免差个几十秒的情况...
  // 而下面的签名 Token，有效期设置的都是几秒级别，所以优先使用网络时间。
  if (!x || !y) {
    try {
      const { timestamp: t } = await (await fetch("https://api.nanorocky.top/time/")).json();
      x = t as number;
      y = f() as number;
    } catch (error) {
      x = y = f() as number;
    }
  }
  return x + (f() - y);
}

export async function gwp(u: string, s: string, b: Record<string, any>) {
  // 备注：POST 方法需要传入 body ！
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    ui = gud();
  if (ui) b.uuid = ui;
  delete b.sig;
  delete b.sign;
  c(q);
  q.set(
    "sig",
    d(
      `${p}?${Object.keys(b)
        .sort()
        .map((k) => `${k}=${JSON.stringify(b[k])}`)
        .join("&")}${s}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gwg(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    ui = gud();
  if (ui) q.set("uuid", ui);
  c(q);
  q.set(
    "sig",
    d(
      `${p}?${[...q.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")}${s}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gwgt(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    ui = gud();
  q.set("time", (await gst()).toString());
  if (ui) q.set("uuid", ui);
  c(q);
  q.set(
    "sig",
    d(
      `${p}?${[...q.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")}${s}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gwggd(u: string, s: string) {
  const ul = new URL(u),
    q = ul.searchParams,
    ui = gud();
  if (ui) q.set("uuid", ui);
  c(q);
  q.set(
    "sig",
    d(
      `${[...q.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")}${s}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gwggdt(u: string, s: string) {
  const ul = new URL(u),
    q = ul.searchParams,
    ui = gud();
  q.set("time", (await gst()).toString());
  if (ui) q.set("uuid", ui);
  c(q);
  q.set(
    "sig",
    d(
      `${[...q.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")}${s}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gwggt(u: string) {
  const ul = new URL(u),
    q = ul.searchParams,
    ui = gud();
  q.set("time", (await gst()).toString());
  if (ui) q.set("uuid", ui);
  c(q);
  q.set(
    "sig",
    d(
      `${[...q.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")}`,
    ).toLowerCase(),
  );
  return ul.toString();
}

export async function gasA(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    t = await gst(),
    r = Math.random().toString(36).substring(2, 12),
    ui = gud();
  if (ui) q.set("uuid", ui);
  c(q);
  q.set("sign", [t, r, "0", d(`${p}-${t}-${r}-0-${s}`)].join("-"));
  return ul.toString();
}

export async function gasB(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname.replace(/^\/?\d{12}\/[0-9a-f]{32}\//i, "").replace(/^\//, ""),
    q = ul.searchParams,
    ui = gud(),
    t = new Date((await gst()) * 1000 + 8 * 3600 * 1000)
      .toISOString()
      .replace(/[-T:]|(\..*)/g, "")
      .substring(0, 12);
  if (ui) q.set("uuid", ui);
  c(q);
  return `${ul.origin}/${t}/${d(`${s}${t}/${p}`)}/${p}${q.toString() ? `?${q.toString()}` : ""}`;
}

export async function gasC(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname.replace(/^\/?[0-9a-f]{32}\/[0-9a-f]+\//i, "").replace(/^\//, ""),
    q = ul.searchParams,
    ui = gud(),
    t = o(await gst());
  if (ui) q.set("uuid", ui);
  c(q);
  return `${ul.origin}/${d(`${s}/${p}${t}`)}/${t}/${p}${q.toString() ? `?${q.toString()}` : ""}`;
}

export async function gasDH(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    t = await gst(),
    ui = gud();
  if (ui) q.set("uuid", ui);
  c(q);
  q.set("sign", d(`${s}/${p.startsWith("/") ? p.slice(1) : p}${t}`));
  q.set("t", t.toString());
  return ul.toString();
}

export async function gasDI(u: string, s: string) {
  const ul = new URL(u),
    p = ul.pathname,
    q = ul.searchParams,
    t = o(await gst()),
    ui = gud();
  if (ui) q.set("uuid", ui);
  c(q);
  q.set("sign", d(`${s}/${p.startsWith("/") ? p.slice(1) : p}${t}`));
  q.set("t", t.toString());
  return ul.toString();
}


