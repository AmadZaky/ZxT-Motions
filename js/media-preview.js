/* Media-only illustrative previews. No dependency on the Text/SolidGen renderers. */
window.MediaPreview = (() => {
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
    // Stylized raster sample. This canvas is illustrative, never an AE render.
    if (id === "slide-up")
      ctx.translate(0, ((1 - progress) * (params.distance ?? 120) * w) / 480);
    if (id === "pop-in") {
      const v =
        ((params.startScale ?? 50) +
          (100 - (params.startScale ?? 50)) * progress) /
        100;
      ctx.scale(v, v);
      if (params.fadeIn === "on") ctx.globalAlpha = progress;
    }
    if (id === "blur-reveal")
      ctx.filter =
        "blur(" + ((params.amount ?? 20) * (1 - progress) * w) / 480 + "px)";
    const paint = () => {
      ctx.fillRect(-w * 0.27, -h * 0.22, w * 0.54, h * 0.44);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-w * 0.12, -h * 0.08, w * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, h * 0.17);
      ctx.lineTo(0, -h * 0.05);
      ctx.lineTo(w * 0.22, h * 0.17);
      ctx.closePath();
      ctx.fill();
    };
    paint();
    if (id === "rgb-split" && (params.amount ?? 10) > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.35;
      ctx.filter = "blur(" + ((params.amount ?? 10) * w) / 480 + "px)";
      ctx.fillStyle = "#f05060";
      ctx.strokeStyle = "#3080ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(-w * 0.27, -h * 0.22, w * 0.54, h * 0.44);
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
    }
  };
})();
