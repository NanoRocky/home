const initFirefly = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'fireflyCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0'; // 调整层级
  canvas.style.willChange = 'transform'; // 提示浏览器优化 GPU 渲染
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const fireflies = [];
  let animationFrameId;

  const createFireflies = () => {
    const fireflyCount = 48; // 萤火虫数量
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        opacity: Math.random(),
        speedX: Math.random() * 1.5 - 0.75,
        speedY: Math.random() * 1.5 - 0.75,
        radius: Math.random() * 2 + 1,
      });
    }
  };

  const drawFireflies = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.beginPath();
    fireflies.forEach((firefly) => {
      ctx.moveTo(firefly.x, firefly.y);
      ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2, true);
    });
    ctx.fill();
    moveFireflies();
  };

  const moveFireflies = () => {
    fireflies.forEach((firefly) => {
      firefly.x += firefly.speedX;
      firefly.y += firefly.speedY;

      if (firefly.x > canvas.width || firefly.x < 0) {
        firefly.speedX *= -1;
      }
      if (firefly.y > canvas.height || firefly.y < 0) {
        firefly.speedY *= -1;
      }
    });
  };

  const updateFireflies = () => {
    drawFireflies();
    animationFrameId = requestAnimationFrame(updateFireflies);
  };

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  createFireflies();
  updateFireflies();

  // 降低帧率
  setInterval(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    updateFireflies();
  }, 1000 / 30); // 30 FPS
};

export default initFirefly;
