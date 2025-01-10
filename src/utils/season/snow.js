const initSnowfall = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'snowfallCanvas';
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
  const snowflakes = [];
  let animationFrameId;

  const createSnowflakes = () => {
    const snowflakeCount = 50; // 减少雪花数量
    for (let i = 0; i < snowflakeCount; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        opacity: Math.random(),
        speedX: Math.random() * 1.5 - 0.75, // 减少速度
        speedY: Math.random() * 1.5 + 0.5, // 减少速度
        radius: Math.random() * 2.5 + 1, // 减小半径
      });
    }
  };

  const drawSnowflakes = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    snowflakes.forEach((snowflake) => {
      ctx.moveTo(snowflake.x, snowflake.y);
      ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2, true);
    });
    ctx.fill();
    moveSnowflakes();
  };

  const moveSnowflakes = () => {
    snowflakes.forEach((snowflake) => {
      snowflake.x += snowflake.speedX;
      snowflake.y += snowflake.speedY;

      if (snowflake.y > canvas.height) {
        snowflake.x = Math.random() * canvas.width;
        snowflake.y = 0;
      }
    });
  };

  const updateSnowfall = () => {
    drawSnowflakes();
    animationFrameId = requestAnimationFrame(updateSnowfall);
  };

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  createSnowflakes();
  updateSnowfall();

  // 降低帧率
  setInterval(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    updateSnowfall();
  }, 1000 / 30); // 30 FPS
};

export default initSnowfall;
