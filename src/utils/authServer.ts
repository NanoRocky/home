/**
 * authServer
 * Made by NanoRocky
 * 这个模块除了腾讯地图的签名认证外，其余函数并不对其他人有任何鸟用（大概叭）
 * 涉及到接口加密的东西怎么能不整点代码混淆，对叭对叭~（x）
 * 该说不说写点答辩还挺有意思嘟（bushi）
 */


import { md5 as d } from "js-md5";

let x: number | null = null, y: number | null = null;
const f = () => Math.floor(Date.now() / 1000), o = (v) => v.toString(16);

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
        };
    };
    return x + (f() - y);
};

export async function gwp(u:string, s:string, b:Record<string, any>) {
    // 备注：POST 方法需要传入 body ！
    const { origin: ul, pathname: p } = new URL(u);
    return `${ul}${p}?sig=${d(`${p}?${Object.keys(b).sort().map(key => `${key}=${JSON.stringify(b[key])}`).join("&")}${s}`).toLowerCase()}`;
};

export async function gwg(u:string, s:string) {
    const { origin: ul, pathname: p } = new URL(u), q = new URLSearchParams(new URL(u).search);
    q.set("sig", d(`${p}?${[...q.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&")}${s}`).toLowerCase());
    return `${ul}${p}?${q.toString()}`;
};

export async function gwgt(u:string, s:string) {
    // 脱裤子放屁，这个模块硬加一个时间戳参与计算签名使得每次调用时的签名密钥看起来不一样，但只是看起来有用。
    // 因为鹅厂位置服务不校验时间戳，也不关心签名有效期，所以只是纯看起来有用而已（）
    // 看它啥时候能良心发现叭（）
    const { origin: ul, pathname: p } = new URL(u), q = new URLSearchParams(new URL(u).search);
    q.set("time", (await gst()).toString());
    q.set("sig", d(`${p}?${[...q.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&")}${s}`).toLowerCase());
    return `${ul}${p}?${q.toString()}`;
};

export async function gasA(p:string, s:string) {
    const t = await gst(), r = Math.random().toString(36).substring(2, 12);
    return [t, r, "0", d(`${p}-${t}-${r}-0-${s}`)].join("-");
};

export async function gasB(u:string, s:string) {
    const { origin: ul, pathname: p } = new URL(u), t = new Date((await gst()) * 1000 + 8 * 3600 * 1000).toISOString().replace(/[-T:]|(\..*)/g, "").substring(0, 12);
    return `${ul}/${t}/${d(`${s}${t}/${p.startsWith('/') ? p.slice(1) : p}`)}/${p.startsWith('/') ? p.slice(1) : p}`;
};

export async function gasC(u:string, s:string) {
    const { origin: ul, pathname: p } = new URL(u), t = o((await gst()));
    return `${ul}/${d(`${s}/${p.startsWith('/') ? p.slice(1) : p}${t}`)}/${t}/${p.startsWith('/') ? p.slice(1) : p}`;
};

export async function gasDH(u:string, s:string) {
    const ul = new URL(u), p = ul.pathname, t = await gst();
    ul.searchParams.set("sign", d(`${s}/${p.startsWith('/') ? p.slice(1) : p}${t}`));
    ul.searchParams.set("t", t.toString());
    return ul.toString();
};

export async function gasDI(u:string, s:string) {
    const ul = new URL(u), p = ul.pathname, t = o(await gst());
    ul.searchParams.set("sign", d(`${s}/${p.startsWith('/') ? p.slice(1) : p}${t}`));
    ul.searchParams.set("t", t.toString());
    return ul.toString();
};
