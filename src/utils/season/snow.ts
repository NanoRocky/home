import { mainStore } from "@/store";
let animationFrameId: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let canvas: HTMLCanvasElement | null = null;
let snowflakeCount: number = 0;

const snowflakes: {
  x: number;
  y: number;
  opacity: number;
  speedX: number;
  speedY: number;
  radius: number;
  angle: number;
}[] = [];

const resizeCanvas = () => {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
};

const createCanvas = () => {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.id = "snowCanvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "0";
  canvas.style.willChange = "transform";
  document.body.appendChild(canvas);
};

const initSnowfall = () => {
  const store = mainStore();
  store.showSnowfall = true;
  if (animationFrameId || intervalId) {
    closeSnowfall();
  };
  createCanvas();
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;
  const createSnowflakes = () => {
    snowflakes.length = 0;
    const deviceType = detectDevice();
    snowflakeCount = deviceType === "mobile" ? 28 : 60;
    for (let i = 0; i < snowflakeCount; i++) {
      snowflakes.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        opacity: Math.random() * 0.3 + 0.2,
        speedX: Math.random() * 0.3 + 0.2,
        speedY: Math.random() * 1.2 + 0.3,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
      });
    };
  };
  const drawSnowflakes = () => {
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    snowflakes.forEach((flake) => {
      ctx.beginPath();
      ctx.globalAlpha = flake.opacity;
      ctx.fillStyle = "white";
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    moveSnowflakes();
  };
  const moveSnowflakes = () => {
    for (let flake of snowflakes) {
      flake.angle += 0.02;
      flake.x += flake.speedX + Math.sin(flake.angle) * 0.3;
      flake.y += flake.speedY;
      if (
        flake.y > canvas!.height ||
        flake.x > canvas!.width + 50 ||
        flake.x < -50
      ) {
        flake.x = Math.random() * canvas!.width;
        flake.y = -flake.radius;
        flake.speedX = Math.random() * 0.6 + 0.2;
        flake.speedY = Math.random() * 1.5 + 0.5;
        flake.radius = Math.random() * 2 + 1;
        flake.opacity = Math.random() * 0.7 + 0.3;
        flake.angle = Math.random() * Math.PI * 2;
      };
    };
  };
  const updateSnowflakes = () => {
    drawSnowflakes();
    animationFrameId = requestAnimationFrame(updateSnowflakes);
  };
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  createSnowflakes();
  updateSnowflakes();
  intervalId = setInterval(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      updateSnowflakes();
    };
  }, 1000 / 30);
};

const detectDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|windows phone/.test(userAgent)) {
    if (/ipad|tablet|playbook|silk|kindle/.test(userAgent)) {
      return "tablet";
    } else {
      return "mobile";
    };
  } else {
    return "pc";
  };
};

const closeSnowfall = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  };
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  };
  if (canvas && canvas.parentNode === document.body) {
    document.body.removeChild(canvas);
    canvas = null;
  };
  snowflakes.length = 0;
  window.removeEventListener("resize", resizeCanvas);
  const store = mainStore();
  store.showSnowfall = false;
};

export { initSnowfall, closeSnowfall };
