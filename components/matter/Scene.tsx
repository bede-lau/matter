"use client";
import { createApplication, type Application } from "./models/Applications";
import { createBehavior, type Behavior } from "./models/Behaviors";
import { SoftwareRenderer } from "./SoftwareRenderer";
import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createLattice } from "@/lib/matter/geometry";
export type SceneProps = {
  kind: string;
  variant: number;
  count: number;
  thickness: number;
  color: string;
  secondaryColor?: string;
  blend?: number;
  playing: boolean;
  mode: string;
  wire: boolean;
  section: boolean;
  reset: number;
  explode: number;
  labels: boolean;
  speed: number;
  playNonce: number;
};
export default function Scene(p: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
  }, [p]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: T.WebGLRenderer | SoftwareRenderer;
    let software = false;
    let fallback: HTMLDivElement | undefined;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      renderer = new SoftwareRenderer();
      software = true;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    container.appendChild(renderer.domElement);
    if (software) {
      fallback = document.createElement("div");
      fallback.className = "scene-fallback";
      fallback.textContent = "Software 3D preview · Enable WebGL for full lighting";
      container.appendChild(fallback);
    }
    renderer.domElement.setAttribute(
      "aria-label",
      `${p.kind} interactive three-dimensional lattice`,
    );
    const scene = new T.Scene();
    scene.background = new T.Color(0x111820);
    scene.environmentIntensity = 0.45;
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(8, 6, 9);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    let pmrem: T.PMREMGenerator | undefined,
      env: T.WebGLRenderTarget | undefined;
    if (!software) {
      pmrem = new T.PMREMGenerator(renderer as T.WebGLRenderer);
      const room = new RoomEnvironment();
      env = pmrem.fromScene(room, 0.04);
      scene.environment = env.texture;
      room.dispose();
    }
    scene.add(new T.HemisphereLight(0xe5f6ff, 0x20252a, 1.1));
    const key = new T.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new T.DirectionalLight(0xa8caff, 1.25);
    rim.position.set(-5, 2, -5);
    scene.add(rim);
    const ground = new T.Mesh(
      new T.PlaneGeometry(200, 200),
      new T.MeshStandardMaterial({
        color: 0x111820,
        roughness: 0.85,
        metalness: 0.15,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.45;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.fog = new T.Fog(0x111820, 16, 45);
    const root = createLattice(p, software);
    scene.add(root);
    const step = 3.5 / p.count;
    let application: Application | undefined;
    let behavior: Behavior | undefined;
    if (p.mode === "application") {
      application = createApplication(
        p.kind,
        p.variant,
        root,
        p.color,
        p.count,
        p.thickness,
      );
      scene.add(application.group);
      camera.position.set(...(application.camera as [number, number, number]));
      controls.target.set(...(application.target as [number, number, number]));
    }
    if (p.mode === "deform") {
      behavior = createBehavior(p, root);
      if (behavior) {
        scene.add(behavior.group);
        if (behavior.camera)
          camera.position.set(...(behavior.camera as [number, number, number]));
        if (behavior.target)
          controls.target.set(...(behavior.target as [number, number, number]));
      }
    }
    // Project product annotations from component anchors; they follow orbit and exploded motion.
    const overlay = document.createElement("div");
    overlay.className = "scene-annotations";
    container.appendChild(overlay);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "callout-lines");
    overlay.appendChild(svg);
    const calloutNodes = (application?.callouts ?? []).map((c) => {
      const label = document.createElement("div");
      label.className = `scene-callout scene-callout--${c.side}`;
      label.textContent = c.label;
      label.tabIndex = 0;
      label.setAttribute("role", "button");
      label.setAttribute("aria-label", "Define " + c.label);
      const explain = () =>
        window.dispatchEvent(
          new CustomEvent("matter:explain", {
            detail: {
              text: c.label,
              rect: label.getBoundingClientRect(),
              source: label,
            },
          }),
        );
      label.addEventListener("click", explain);
      label.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          explain();
        }
      });
      overlay.appendChild(label);
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline",
      );
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#d4e4e999");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      const dot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      dot.setAttribute("r", "3");
      dot.setAttribute("fill", p.color);
      svg.appendChild(dot);
      return { c, label, line, dot };
    });
    const motionLabel = document.createElement("div");
    motionLabel.className = "motion-phase";
    if (application || behavior) container.appendChild(motionLabel);
    const updateCallouts = () => {
      overlay.style.display = latest.current.labels ? "block" : "none";
      const w = container.clientWidth,
        h = container.clientHeight;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      const compact = w < 760;
      const leftInset = compact ? 8 : 24;
      // This is an actual protected lane, not just a visual offset. It keeps
      // prose clear of the orbit/reset/full-screen tool strip at every size.
      const rightInset = compact ? 76 : 152;
      const labelWidth = compact
        ? Math.min(
            116,
            Math.max(78, Math.floor((w - leftInset - rightInset - 12) / 2)),
          )
        : Math.min(218, Math.max(172, Math.floor(w * 0.16)));
      const projected = calloutNodes.map((entry) => {
        const { c, label } = entry;
        const v = c.anchor.getWorldPosition(new T.Vector3()).project(camera);
        const px = ((v.x + 1) * w) / 2,
          py = ((1 - v.y) * h) / 2;
        const visible = v.z > -1 && v.z < 1 && px > -40 && px < w + 40 && py > -40 && py < h + 40;
        const labelX =
          c.side === "left"
            ? leftInset
            : Math.max(leftInset, w - labelWidth - rightInset);
        label.style.left = labelX + "px";
        label.style.width = labelWidth + "px";
        label.style.visibility = visible ? "visible" : "hidden";
        return { ...entry, px, py, labelX, visible, labelY: 0 };
      });
      // Header material chips and the motion badge occupy their own protected
      // bands. Sort anchors within each side lane and give labels measured
      // vertical spacing so they never collide with each other or the footer.
      const safeTop = compact ? Math.max(150, h * 0.27) : Math.max(165, h * 0.27);
      const safeBottom = h - (compact ? 142 : 156);
      for (const side of ["left", "right"] as const) {
        const entries = projected
          .filter((entry) => entry.visible && entry.c.side === side)
          .sort((a, b) => a.py - b.py || a.c.slot - b.c.slot);
        const gap = compact ? 9 : 16;
        const heights = entries.map((entry) => Math.max(44, entry.label.offsetHeight));
        const total = heights.reduce((sum, height) => sum + height, 0) + Math.max(0, entries.length - 1) * gap;
        const anchorCenter = entries.length
          ? entries.reduce((sum, entry) => sum + entry.py, 0) / entries.length
          : safeTop;
        let y = Math.max(safeTop, Math.min(safeBottom - total, anchorCenter - total * 0.46));
        for (let i = 0; i < entries.length; i++) {
          entries[i].labelY = y;
          y += heights[i] + gap;
        }
      }
      for (const { c, label, line, dot, px, py, labelX, labelY, visible } of projected) {
        if (!visible) {
          line.style.display = "none";
          dot.style.display = "none";
          continue;
        }
        line.style.display = "block";
        dot.style.display = "block";
        label.style.top = labelY + "px";
        const edge = c.side === "left" ? labelX + labelWidth : labelX;
        line.setAttribute(
          "points",
          `${edge},${labelY + label.offsetHeight / 2} ${edge + (c.side === "left" ? 16 : -16)},${labelY + label.offsetHeight / 2} ${px},${py}`,
        );
        dot.setAttribute("cx", String(px));
        dot.setAttribute("cy", String(py));
      }
    };
    const clip = new T.Plane(new T.Vector3(-1, 0, 0), 0.3);
    renderer.localClippingEnabled = true;
    if (p.section)
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => (m.clippingPlanes = [clip]));
        }
      });
    let firstRender = true,
      lastDraw = 0;
    const resize = () => {
      firstRender = true;
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    let frame = 0,
      time = 0,
      last = performance.now();
    let previousExplode = p.explode,
      previousLabels = p.labels;
    const baseScale = root.scale.clone();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.15);
      last = now;
      const active = latest.current.playing && !reduced;
      if (active) time += dt * latest.current.speed;
      if (
        previousExplode !== latest.current.explode ||
        previousLabels !== latest.current.labels
      ) {
        firstRender = true;
        previousExplode = latest.current.explode;
        previousLabels = latest.current.labels;
      }
      controls.autoRotate = active && p.mode === "structure";
      controls.autoRotateSpeed = 0.35;
      const cameraChanged = controls.update();
      if (p.mode === "deform") {
        if (behavior) {
          root.scale.copy(baseScale);
        } else {
          const wave = reduced ? 0 : (1 - Math.cos(time * 2.6)) / 2;
          root.scale.y = baseScale.y * (1 - wave * 0.22);
          root.scale.x =
            baseScale.x * (1 + (p.kind === "auxetic" ? -1 : 1) * wave * 0.1);
        }
        if (p.kind === "resonator" && !behavior) {
          root.scale.copy(baseScale);
          root.traverse((o) => {
            if (o.userData.resonator) {
              const dy = reduced
                ? 0
                : Math.sin(time * 4 + o.userData.phase) * step * 0.12;
              o.position.y = o.userData.restY + dy;
              o.userData.spring.scale.y = 1 + dy / (step * 0.5);
            }
          });
        }
      }
      if (application)
        motionLabel.textContent = application.update(
          time,
          latest.current.explode / 100,
        );
      if (behavior) motionLabel.textContent = behavior.update(time);
      if (
        (active || cameraChanged || firstRender) &&
        (!software || firstRender || now - lastDraw > 180)
      ) {
        renderer.render(scene, camera);
        if (application) updateCallouts();
        firstRender = false;
        lastDraw = performance.now();
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      const disposedMaterials = new Set<T.Material>();
      const disposedTextures = new Set<T.Texture>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (disposedMaterials.has(m)) continue;
            disposedMaterials.add(m);
            for (const value of Object.values(m))
              if (value instanceof T.Texture && !disposedTextures.has(value)) {
                disposedTextures.add(value);
                value.dispose();
              }
            m.dispose();
          }
        }
      });
      env?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      if (!software) (renderer as T.WebGLRenderer).forceContextLoss();
      renderer.domElement.remove();
      fallback?.remove();
      overlay.remove();
      motionLabel.remove();
    };
  }, [
    p.kind,
    p.variant,
    p.count,
    p.thickness,
    p.color,
    p.secondaryColor,
    p.blend,
    p.mode,
    p.wire,
    p.section,
    p.reset,
    p.playNonce,
  ]);
  return (
    <div className="scene">
      <div ref={host} className="scene-canvas-host" />
    </div>
  );
}
