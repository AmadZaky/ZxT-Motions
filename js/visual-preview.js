/* Shape-only illustrative previews. No dependency on the Text/SolidGen renderers. */
window.ShapePreview = (() => {
  const active = new Map();
  let suspended = false;
  function draw(canvas, id, progress = 1, params = {}) {
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle =
      getComputedStyle(document.documentElement).getPropertyValue("--input") ||
      "#18181a";
    ctx.fillRect(0, 0, w, h);
    const color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#ff963b";
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w / 45;
    if (id === "glow") {
      ctx.shadowColor = color;
      ctx.shadowBlur = ((params.radius || 25) * w) / 240;
      ctx.strokeRect(-w * 0.23, -h * 0.23, w * 0.46, h * 0.46);
    } else if (id === "blur-pulse" || id === "gaussian-blur") {
      ctx.filter =
        "blur(" +
        ((params.amount ?? 20) * (id === "blur-pulse" ? Math.sin(progress * Math.PI) : 1) * w) / 240 +
        "px)";
      ctx.fillRect(-w * 0.22, -h * 0.22, w * 0.44, h * 0.44);
    } else if (id === "drop-shadow") {
      const angle = ((params.direction ?? 135) - 90) * Math.PI / 180,
        distance = (params.distance ?? 10) * w / 240;
      ctx.shadowColor = "rgba(0,0,0," + (params.opacity ?? 50) / 100 + ")";
      ctx.shadowBlur = (params.softness ?? 10) * w / 240;
      ctx.shadowOffsetX = Math.cos(angle) * distance;
      ctx.shadowOffsetY = Math.sin(angle) * distance;
      ctx.fillRect(-w * 0.22, -h * 0.22, w * 0.44, h * 0.44);
    } else if (id === "trim-in") {
      const size = w * 0.46;
      const start = (params.start ?? 0) / 100,
        end = (params.end ?? 100) / 100,
        total = size * 4;
      ctx.setLineDash([total * Math.max(0, end - start) * progress, total]);
      ctx.lineDashOffset = -total * (start + (params.offset ?? 0) / 360);
      ctx.strokeRect(-size / 2, -size / 2, size, size);
    } else {
      const turbulent = id === "turbulent-displace",
        frequency = turbulent ? Math.max(2, 240 / (params.size ?? 50)) * (params.complexity ?? 2) : 7,
        phase = turbulent ? (params.evolution ?? 0) * Math.PI / 180 : progress * Math.PI * 2;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2,
          r =
            w * 0.24 +
            (Math.sin(a * frequency + phase) *
              (params.amount ?? (turbulent ? 25 : 10)) *
              w) /
              240;
        const x = Math.cos(a) * r,
          y = Math.sin(a) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  function stop(canvas) {
    const frame = active.get(canvas);
    if (frame) cancelAnimationFrame(frame);
    active.delete(canvas);
  }
  function play(canvas, id, params = {}, once = false) {
    stop(canvas);
    if (["gaussian-blur", "drop-shadow", "turbulent-displace"].includes(id)) {
      draw(canvas, id, 1, params);
      return;
    }
    if (suspended || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(canvas, id, 1, params);
      return;
    }
    const start = performance.now(),
      duration = (params.duration || 1) * 1000;
    function frame(now) {
      if (suspended || !canvas.isConnected) {
        stop(canvas);
        return;
      }
      const t = (now - start) / duration;
      draw(canvas, id, Math.min(1, once ? t : t % 1), params);
      if (!once || t < 1) active.set(canvas, requestAnimationFrame(frame));
      else active.delete(canvas);
    }
    active.set(canvas, requestAnimationFrame(frame));
  }
  return {
    draw,
    play,
    stop,
    suspend(on) {
      suspended = on;
      if (on) for (const canvas of [...active.keys()]) stop(canvas);
    },
    clear() {
      for (const canvas of [...active.keys()]) stop(canvas);
    },
  };
})();
