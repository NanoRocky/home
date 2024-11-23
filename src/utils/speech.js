let currentAudio = null;
let audioQueue = [];
let isPlaying = false;
let controller = null; // 用于取消请求

/**
 * Speech
 * Made by NanoRocky
 * 使用指定参数生成语音并播放音频。
 * 该功能原为 Azure 设计，理应兼容大部分使用 post 传参的 api 。请自行根据要求修改！
 * https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
 * 
 * @param {string} text - 朗读的文本
 * @param {string} [voice="zh-CN-YunxiaNeural"] - 音色（默认为“zh-CN-YunxiaNeural”）
 * @param {string} [style="cheerful"] - 声音特定的讲话风格（默认为“cheerful”）
 * @param {string} [role="Boy"] - 讲话角色扮演（默认为“Boy”）
 * @param {string} [rate="1"] - 语速（默认为“1”）
 * @param {string} [volume="100"] - 音量（默认为“100”）
 * @returns {Promise<void>} - 一个 Promise，在语音播放完成时解析或出现错误时拒绝
 */
export function Speech(
  text,
  voice = "zh-CN-YunxiaNeural",
  style = "cheerful",
  role = "Boy",
  rate = "1",
  volume = "100",
) {
  return new Promise(async (resolve, reject) => {
    // 创建新的 AbortController 实例，并中断旧请求
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();
    const { signal } = controller;

    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice", voice);
    formData.append("style", style);
    formData.append("role", role);
    formData.append("rate", rate);
    formData.append("volume", volume);

    try {
      const speechapi = import.meta.env.VITE_TTS_API;
      const response = await fetch(speechapi, {
        method: "POST",
        body: formData,
        signal, // 传递 AbortSignal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // 将新的音频对象添加到队列
      audioQueue.push(audioUrl);

      if (!isPlaying) {
        playNext();
      }

      function playNext() {
        if (audioQueue.length === 0) {
          isPlaying = false;
          return;
        }

        isPlaying = true;

        const nextAudioUrl = audioQueue.shift();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio = null;
        }

        const audio = new Audio();
        audio.src = nextAudioUrl;
        audio.play();

        // 在音频播放结束时解析 Promise
        audio.onended = () => {
          resolve();
          playNext();
        };

        // 如果发生错误，拒绝 Promise
        audio.onerror = (error) => {
          reject(error);
          playNext();
        };

        // 将当前播放的语音赋值给全局变量
        currentAudio = audio;
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request canceled");
      } else {
        console.error("Error:", error.message);
        reject(error);
      }
    }
  });
}

/**
 * 停止当前播放的语音，并清空播放队列。
 */
export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  audioQueue = [];
  isPlaying = false;
  if (controller) {
    controller.abort();
    controller = null;
  }
}

/**
 * SpeechLocal
 * Made by NanoRocky
 * 播放本地预生成的语音音频。
 * 考虑到生成延迟，所以加了这个，仅必要模块调用 api 实时生成，其它模块使用预先生成好的音频。记得根据需求更换自己的音频文件哇！
 * 
 * @param {string} fileName - 音频文件名 + 文件拓展名（请将文件放在指定路径）
 * @returns {Promise<void>} - 一个 Promise，在语音播放完成时解析或出现错误时拒绝
 */
export function SpeechLocal(fileName) {
  return new Promise((resolve, reject) => {
    if (!fileName) {
      reject(new Error("No file name provided"));
      return;
    }

    const audioUrl = `https://file.nanorocky.top/home/speechlocal/${fileName}`;

    // 清除之前的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // 停止当前正在播放的语音
    audioQueue = [];
    isPlaying = false;
    if (controller) {
      controller.abort();
      controller = null;
    }

    // 添加新音频到队列并播放
    audioQueue.push(audioUrl);
    if (!isPlaying) {
      playNext();
    }

    function playNext() {
      if (audioQueue.length === 0) {
        isPlaying = false;
        return;
      }

      isPlaying = true;

      const nextAudioUrl = audioQueue.shift();
      const audio = new Audio();
      audio.src = nextAudioUrl;

      // 确保新的音频对象没有被中途替换
      audio.oncanplaythrough = () => {
        currentAudio = audio;
        currentAudio.play();
      };

      // 在音频播放结束时解析 Promise
      audio.onended = () => {
        resolve();
        playNext();
      };

      // 如果发生错误，拒绝 Promise
      audio.onerror = (error) => {
        reject(error);
        playNext();
      };
    }
  });
}
