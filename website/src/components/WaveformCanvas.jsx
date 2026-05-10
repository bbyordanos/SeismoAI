import React, { useRef, useEffect } from 'react';

export default function WaveformCanvas({ data, alertLevel, height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f1729';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(30,45,69,0.7)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 4) * i);
      ctx.lineTo(w, (h / 4) * i);
      ctx.stroke();
    }
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 10) * i, 0);
      ctx.lineTo((w / 10) * i, h);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = 'rgba(90,110,138,0.5)';
    ctx.font = '9px Space Mono, monospace';
    ctx.fillText('+1g', 4, 12);
    ctx.fillText(' 0g', 4, h / 2 + 4);
    ctx.fillText('-1g', 4, h - 4);

    if (!data || data.length < 2) return;

    const isAlert = alertLevel === 'moderate' || alertLevel === 'strong';
    const waveColor = alertLevel === 'strong' ? '#ff0033'
      : alertLevel === 'moderate' ? '#ff4757'
      : alertLevel === 'mild'     ? '#ffa502'
      : '#00e5c3';

    // Waveform fill area
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h / 2 - v * (h * 0.38);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fillStyle = waveColor.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', '').length > 9
      ? `${waveColor}14` : `${waveColor}14`;
    ctx.fill();

    // Waveform line
    ctx.beginPath();
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, `${waveColor}00`);
    grad.addColorStop(0.15, `${waveColor}cc`);
    grad.addColorStop(1, waveColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h / 2 - v * (h * 0.38);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Scan head (rightmost point)
    const lastV = data[data.length - 1];
    const headY = h / 2 - lastV * (h * 0.38);
    ctx.beginPath();
    ctx.arc(w - 2, headY, 3, 0, Math.PI * 2);
    ctx.fillStyle = waveColor;
    ctx.fill();

    // Alert flash overlay
    if (isAlert) {
      const flashAlpha = (Math.sin(Date.now() / 200) + 1) * 0.03;
      ctx.fillStyle = `rgba(255,71,87,${flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }, [data, alertLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height, borderRadius: 6, background: '#0f1729' }}
    />
  );
}
