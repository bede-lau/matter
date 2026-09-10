"use client";
import { memo, useEffect, useRef } from "react";
import type { ResearchRow } from "@/lib/matter/research";

/** Hundreds of marks are batched into one canvas draw, outside React reconciliation. */
export default memo(function ResearchPlot({
  sample,
  target,
  width,
  best,
}: {
  sample: ResearchRow[];
  target: number;
  width: number;
  best?: ResearchRow;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let raf = 0;
    const draw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth,
          h = el.clientHeight,
          dpr = Math.min(devicePixelRatio, 2);
        const bitmapWidth = Math.round(w * dpr),
          bitmapHeight = Math.round(h * dpr);
        if (el.width !== bitmapWidth || el.height !== bitmapHeight) {
          el.width = bitmapWidth;
          el.height = bitmapHeight;
        }
        const c = el.getContext("2d");
        if (!c) return;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, h);
        const left = 43,
          right = w - 17,
          top = 16,
          bottom = h - 35;
        const x = (v: number) => left + (v / 2000) * (right - left),
          y = (v: number) => bottom - (v / 500) * (bottom - top);
        c.font = "12px Inter, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "top";
        for (const n of [0, 500, 1000, 1500, 2000]) {
          c.strokeStyle = "#2b3a47";
          c.beginPath();
          c.moveTo(x(n), top);
          c.lineTo(x(n), bottom);
          c.stroke();
          c.fillStyle = "#aebeca";
          c.fillText(String(n), x(n), bottom + 12);
        }
        c.textAlign = "right";
        c.textBaseline = "middle";
        for (const n of [0, 250, 500]) {
          c.fillStyle = "#aebeca";
          c.fillText(String(n), left - 9, y(n));
          c.strokeStyle = "#24343f";
          c.beginPath();
          c.moveTo(left, y(n));
          c.lineTo(right, y(n));
          c.stroke();
        }
        for (const eligible of [false, true]) {
          c.beginPath();
          for (const r of sample)
            if (r[1] <= 2000 && r[2] <= 500 && r[2] >= width === eligible) {
              c.moveTo(x(r[1]) + 2.1, y(r[2]));
              c.arc(x(r[1]), y(r[2]), 2.1, 0, Math.PI * 2);
            }
          c.fillStyle = eligible ? "#b8e776aa" : "#64829466";
          c.fill();
        }
        c.strokeStyle = "#d3e3b6";
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(x(target), top);
        c.lineTo(x(target), bottom);
        c.stroke();
        c.setLineDash([]);
        if (best && best[1] <= 2000 && best[2] <= 500) {
          c.beginPath();
          c.arc(x(best[1]), y(best[2]), 6, 0, Math.PI * 2);
          c.fillStyle = "#f5ffe8";
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = "#c2ef72";
          c.stroke();
        }
      });
    };
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    draw();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [sample, target, width, best]);
  return (
    <canvas
      ref={canvas}
      className="research-canvas"
      role="img"
      aria-label={`Sample of band-gap center versus width. Target ${target} Hz, minimum width ${width} Hz.${best ? ` Selected design: center ${best[1]} Hz and width ${best[2]} Hz.` : ""}`}
    />
  );
});
