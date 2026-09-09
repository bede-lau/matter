"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createLattice } from "@/lib/matter/geometry";
import { SoftwareRenderer } from "./SoftwareRenderer";

/** Demand-rendered previews share the studio's real topology. Off-screen cards do no work. */
export default function MiniLattice({
  kind,
  color,
  logo = false,
}: {
  kind: string;
  color: string;
  logo?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || cleanup) return;
        let renderer: T.WebGLRenderer | SoftwareRenderer;
        let software = false;
        try {
          renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
        } catch {
          renderer = new SoftwareRenderer();
          software = true;
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        el.appendChild(renderer.domElement);
        const scene = new T.Scene();
        scene.background = new T.Color(0x151f28);
        const camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
        camera.position.set(7, 5, 8);
        scene.add(new T.HemisphereLight(0xeaf6ff, 0x253546, 2));
        const key = new T.DirectionalLight(0xffffff, 2.8);
        key.position.set(2, 7, 5);
        scene.add(key);
        const rim = new T.DirectionalLight(color, 1.1);
        rim.position.set(-4, 1, -4);
        scene.add(rim);
        const lattice = createLattice(
          {
            kind,
            count: logo ? 1 : 2,
            variant: 0,
            thickness: logo ? 1.65 : 1.3,
            color,
          },
          true,
        );
        scene.add(lattice);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableRotate = !logo;
        controls.enableDamping = false;
        let raf = 0;
        const draw = () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => renderer.render(scene, camera));
        };
        const resize = new ResizeObserver(() => {
          const w = el.clientWidth,
            h = el.clientHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          draw();
        });
        resize.observe(el);
        controls.addEventListener("change", draw);
        const rotate = () => {
          lattice.rotation.y += 0.35;
          draw();
        };
        const keyboard = (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            lattice.rotation.y += e.key === "ArrowRight" ? 0.25 : -0.25;
            draw();
          }
        };
        el.addEventListener("keydown", keyboard);
        if (logo) el.addEventListener("pointerenter", rotate);
        draw();
        cleanup = () => {
          cancelAnimationFrame(raf);
          resize.disconnect();
          controls.dispose();
          el.removeEventListener("keydown", keyboard);
          el.removeEventListener("pointerenter", rotate);
          scene.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.geometry.dispose();
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(
                (m) => m.dispose(),
              );
            }
          });
          renderer.dispose();
          if (!software) (renderer as T.WebGLRenderer).forceContextLoss();
          renderer.domElement.remove();
        };
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [kind, color, logo]);
  return (
    <div
      ref={host}
      className={logo ? "lattice-logo" : "lattice-preview"}
      role={logo ? undefined : "img"}
      tabIndex={logo ? undefined : 0}
      aria-hidden={logo ? true : undefined}
      aria-label={
        logo
          ? undefined
          : `${kind} 3D structure. Drag or use left and right arrow keys to rotate.`
      }
    />
  );
}
