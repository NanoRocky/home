let currentAudio = null;
let audioQueue = [];
let isPlaying = false;
let controller = null; // 用于取消请求

export function Speech(
  // 该功能原为 Azure 设计，理应兼容大部分使用 post 传参的 api 。请自行根据要求修改！
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

// 添加停止播放的函数
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

export function SpeechLocal(fileName) {
  // 考虑到生成延迟，所以加了这个，仅必要模块调用 api 实时生成，其它模块使用预先生成好的音频
  return new Promise((resolve, reject) => {
    if (!fileName) {
      reject(new Error("No file name provided"));
      return;
    }

    const audioUrl = `/speechlocal/${fileName}`;

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
