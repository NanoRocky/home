import { gasA, gasC } from "@/utils/authServer";

let currentAudio: HTMLAudioElement | null = null;
let audioQueue: string[] = [];
let isPlaying = false;
let controller: AbortController | null = null;
let timeoutId: NodeJS.Timeout | null = null;
let speechapiUrlS: string | null = null;
let audioUrlS: string | null = null;

/**
 * Speech
 * Made by NanoRocky
 * 使用指定参数生成语音并播放音频。
 * 该功能原为 Azure 设计，理应兼容大部分使用 post 传参的 api 。请自行根据要求修改！如果也使用 Azure ，您可直接使用 https://github.com/NanoRocky/AzureSpeechAPI-by-PHP 完成 API 部署
 * https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 *
 * @param {string} text - 朗读的文本
 * @param {string} [voice="zh-CN-YunxiaNeural"] - 音色（默认为“zh-CN-YunxiaNeural”）
 * @param {string} [style="cheerful"] - 声音特定的讲话风格（默认为“cheerful”）
 * @param {string} [role="Boy"] - 讲话角色扮演（默认为“Boy”）
 * @param {string} [rate="1"] - 语速（默认为“1”）
 * @param {string} [volume="100"] - 音量（默认为“100”）
 * @param {number} [delay=1500] - 等待时间【毫秒】后发出请求，防止频繁点击产生请求洪水（默认为等待1500毫秒）
 * @returns {Promise<void>} - 一个 Promise，在语音播放完成时解析或出现错误时拒绝
 */
export function Speech(
  text,
  voice = "zh-CN-YunxiaNeural",
  style = "cheerful",
  role = "Boy",
  rate = "1",
  volume = "100",
  delay = 1500,
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    // 如果有现有的等待，取消之前的 timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    };
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    };
    // 创建新的 AbortController 实例，并中断旧请求
    if (controller) {
      controller.abort();
    };
    controller = new AbortController();
    const { signal } = controller;
    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice", voice);
    formData.append("style", style);
    formData.append("role", role);
    formData.append("rate", rate);
    formData.append("volume", volume);
    // 在指定的 delay 后开始请求
    timeoutId = setTimeout(async () => {
      try {
        const speechapi = import.meta.env.VITE_TTS_API;
        const key = import.meta.env.VITE_TTS_SKEY;
        if (!key) {
          speechapiUrlS = speechapi;
        } else {
          const speechapiurl = new URL(speechapi);
          const path = speechapiurl.pathname;
          const sign = await gasA(path, key);
          speechapiUrlS = `${speechapi}?sign=${sign}`;
        };
        const response = await fetch(speechapiUrlS, {
          method: "POST",
          body: formData,
          signal, // 传递 AbortSignal
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        };

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);

        // 将新的音频对象添加到队列
        audioQueue.push(audioUrl);

        if (!isPlaying) {
          playNext(resolve, reject);
        };

      } catch (error) {
        const err = error as Error;
        if (err.name === "AbortError") {
          console.log("Request canceled");
        } else {
          console.error("Error:", err.message);
          reject(err);
        };
      };
    }, delay);
  });
}

function playNext(
  resolve: () => void,
  reject: (reason?: any) => void
) {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  };

  isPlaying = true;

  const nextAudioUrl = audioQueue.shift();
  if (!nextAudioUrl) {
    isPlaying = false;
    return;
  };
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  };

  const audio = new Audio();
  audio.src = nextAudioUrl;
  audio.play();

  // 在音频播放结束时解析 Promise
  audio.onended = () => {
    resolve();
    playNext(resolve, reject);
  };

  // 如果发生错误，拒绝 Promise
  audio.onerror = (error) => {
    reject(error);
    playNext(resolve, reject);
  };

  // 将当前播放的语音赋值给全局变量
  currentAudio = audio;
};

/**
 * 停止当前播放的语音，并清空播放队列。
 */
export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  };
  audioQueue = [];
  isPlaying = false;
  if (controller) {
    controller.abort();
    controller = null;
  };
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  };
};

/**
 * SpeechLocal
 * Made by NanoRocky
 * 播放本地预生成的语音音频。
 * 考虑到生成延迟，所以加了这个，仅必要模块调用 api 实时生成，其它模块使用预先生成好的音频。记得根据需求更换自己的音频文件哇！
 *
 * @param {string} fileName - 音频文件名 + 文件拓展名（请将文件放在指定路径）
 * @param {number} [delay=0] - 等待时间【毫秒】后发出请求，防止频繁点击产生请求洪水（默认提前生成的不等待）
 * @returns {Promise<void>} - 一个 Promise，在语音播放完成时解析或出现错误时拒绝
 */
export function SpeechLocal(
  fileName: string,
  delay = 0
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    if (!fileName) {
      reject(new Error("No file name provided"));
      return;
    };

    const audioUrl = `https://filep.nanorocky.top/home/speechlocal/${fileName}`;
    const key = import.meta.env.VITE_SFILE_SKEY;
    if (key) {
      const fileUrl = audioUrl;
      audioUrlS = await gasC(fileUrl, key);
    } else {
      audioUrlS = audioUrl;
    };
    if (!audioUrlS) {
      reject(new Error("Failed to generate audio URL"));
      return;
    };
    // 如果有现有的等待，取消之前的 timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    };
    // 清除之前的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    };
    timeoutId = setTimeout(async () => {
      // 停止当前正在播放的语音
      audioQueue = [];
      isPlaying = false;
      if (controller) {
        controller.abort();
        controller = null;
      };

      // 添加新音频到队列并播放
      audioQueue.push(audioUrlS!);
      if (!isPlaying) {
        playNextLocal(resolve, reject);
      };
    }, delay);
  });
};

function playNextLocal(
  resolve: () => void,
  reject: (reason?: any) => void
) {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  };
  isPlaying = true;
  const nextAudioUrl = audioQueue.shift();
  if (!nextAudioUrl) {
    isPlaying = false;
    return;
  };
  const audio = new Audio();
  audio.src = nextAudioUrl;

  // 确保新的音频对象没有被中途替换
  audio.oncanplaythrough = () => {
    if (currentAudio) {
      currentAudio.pause();
    };
    currentAudio = audio;
    currentAudio.play();
  };

  // 在音频播放结束时解析 Promise
  audio.onended = () => {
    resolve();
    playNextLocal(resolve, reject);
  };

  // 如果发生错误，拒绝 Promise
  audio.onerror = (error) => {
    reject(error);
    playNextLocal(resolve, reject);
  };
};
