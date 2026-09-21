"use client";

import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createLattice } from "@/lib/matter/geometry";
import { createApplication, type Application } from "./models/Applications";
import { createBehavior, type Behavior } from "./models/Behaviors";
import { SoftwareRenderer } from "./SoftwareRenderer";

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

type SceneRuntime = {
  rebuild: (props: SceneProps) => void;
  setWireframe: (enabled: boolean) => void;
  setSection: (enabled: boolean) => void;
  resetView: () => void;
  restartMotion: () => void;
  invalidate: (labelsChanged?: boolean) => void;
};

type ModelState = {
  root: T.Group;
  application?: Application;
  behavior?: Behavior;
  baseScale: T.Vector3;
  step: number;
};

type CalloutNode = {
  c: Application["callouts"][number];
  label: HTMLDivElement;
  line: SVGPolylineElement;
  dot: SVGCircleElement;
  height: number;
};

let rendererSerial = 0;

function disposeObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  root.traverse((object) => {
    const geometry = (object as T.Mesh).geometry as T.BufferGeometry | undefined;
    if (geometry && !geometries.has(geometry)) {
      geometries.add(geometry);
      geometry.dispose();
    }
    const source = (object as T.Mesh).material as
      | T.Material
      | T.Material[]
      | undefined;
    if (!source) return;
    for (const material of Array.isArray(source) ? source : [source]) {
      if (materials.has(material)) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof T.Texture && !textures.has(value)) {
          textures.add(value);
          value.dispose();
        }
      }
      material.dispose();
    }
  });
}

export default function Scene(p: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(p);
  const runtime = useRef<SceneRuntime>(null);

  useEffect(() => {
    latest.current = p;
  }, [p]);

  // Keep the expensive rendering infrastructure alive. Model changes replace
  // only the content graph instead of allocating a new WebGL context, PMREM,
  // controls and animation loop for every toolbar click.
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
    renderer.domElement.dataset.rendererInstance = String(++rendererSerial);
    container.appendChild(renderer.domElement);
    if (software) {
      fallback = document.createElement("div");
      fallback.className = "scene-fallback";
      fallback.textContent =
        "Software 3D preview · Enable WebGL for full lighting";
      container.appendChild(fallback);
    }

    const scene = new T.Scene();
    scene.background = new T.Color(0x111820);
    scene.environmentIntensity = 0.45;
    scene.fog = new T.Fog(0x111820, 16, 45);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(8, 6, 9);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;

    let pmrem: T.PMREMGenerator | undefined;
    let env: T.WebGLRenderTarget | undefined;
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

    const overlay = document.createElement("div");
    overlay.className = "scene-annotations";
    container.appendChild(overlay);
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    svg.setAttribute("class", "callout-lines");
    overlay.appendChild(svg);
    const motionLabel = document.createElement("div");
    motionLabel.className = "motion-phase";
    motionLabel.hidden = true;
    container.appendChild(motionLabel);

    const clip = new T.Plane(new T.Vector3(-1, 0, 0), 0.3);
    renderer.localClippingEnabled = true;
    let model: ModelState | undefined;
    let calloutNodes: CalloutNode[] = [];
    let modelGeneration = 0;
    let layoutDirty = true;
    let dirty = true;
    let softwareRenderAfter = 0;
    let time = 0;
    let lastDraw = 0;
    let lastMotionText = "";
    let savedCamera = camera.position.clone();
    let savedTarget = controls.target.clone();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const markDirty = (deferSoftware = software) => {
      dirty = true;
      softwareRenderAfter = deferSoftware ? performance.now() + 80 : 0;
    };

    const clearCallouts = () => {
      calloutNodes.forEach(({ label }) => label.remove());
      calloutNodes = [];
      svg.replaceChildren();
    };

    const removeModel = () => {
      clearCallouts();
      if (!model) return;
      const roots = [
        model.application?.group,
        model.behavior?.group,
        model.root,
      ].filter((value): value is T.Object3D => Boolean(value));
      const disposed = new Set<T.Object3D>();
      for (const root of roots) {
        if (disposed.has(root)) continue;
        if (
          roots.some(
            (candidate) => candidate !== root && root.parent === candidate,
          )
        )
          continue;
        root.removeFromParent();
        disposeObject(root);
        disposed.add(root);
      }
      model = undefined;
      motionLabel.hidden = true;
      motionLabel.textContent = "";
      lastMotionText = "";
    };

    const setWireframe = (enabled: boolean) => {
      model?.root.traverse((object) => {
        if (!(object instanceof T.Mesh)) return;
        const source = Array.isArray(object.material)
          ? object.material
          : [object.material];
        source.forEach((material) => {
          if (material instanceof T.MeshStandardMaterial) {
            material.wireframe = enabled;
            material.needsUpdate = true;
          }
        });
      });
      markDirty();
    };

    const setSection = (enabled: boolean) => {
      scene.traverse((object) => {
        if (!(object instanceof T.Mesh)) return;
        const source = Array.isArray(object.material)
          ? object.material
          : [object.material];
        source.forEach((material) => {
          material.clippingPlanes = enabled ? [clip] : [];
          material.needsUpdate = true;
        });
      });
      markDirty();
    };

    const buildCallouts = (
      application: Application | undefined,
      color: string,
    ) => {
      clearCallouts();
      calloutNodes = (application?.callouts ?? []).map((c) => {
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
        dot.setAttribute("fill", color);
        svg.appendChild(dot);
        return { c, label, line, dot, height: 0 };
      });
      layoutDirty = true;
    };

    const updateCallouts = () => {
      const show = latest.current.labels && calloutNodes.length > 0;
      overlay.style.display = show ? "block" : "none";
      if (!show) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 1 || h < 1) return;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      const compact = w < 760;
      overlay.dataset.compact = String(compact);
      const leftInset = compact ? 16 : 24;
      const rightInset = compact ? 16 : 152;
      const labelWidth = compact
        ? Math.floor((w - 44) / 2)
        : Math.min(218, Math.max(172, Math.floor(w * 0.16)));
      const projected = calloutNodes.map((entry) => {
        const v = entry.c.anchor
          .getWorldPosition(new T.Vector3())
          .project(camera);
        const px = ((v.x + 1) * w) / 2;
        const py = ((1 - v.y) * h) / 2;
        const visible =
          v.z > -1 &&
          v.z < 1 &&
          px > -40 &&
          px < w + 40 &&
          py > -40 &&
          py < h + 40;
        const labelX =
          entry.c.side === "left"
            ? leftInset
            : Math.max(leftInset, w - labelWidth - rightInset);
        entry.label.style.left = labelX + "px";
        entry.label.style.width = labelWidth + "px";
        entry.label.style.visibility = visible ? "visible" : "hidden";
        return { ...entry, px, py, labelX, visible, labelY: 0 };
      });
      if (layoutDirty) {
        for (const entry of calloutNodes)
          entry.height = Math.max(
            compact ? 64 : 44,
            entry.label.offsetHeight,
          );
        layoutDirty = false;
      }
      const safeTop = compact ? h - 310 : Math.max(165, h * 0.27);
      const safeBottom = h - (compact ? 125 : 156);
      for (const side of ["left", "right"] as const) {
        const entries = projected
          .filter((entry) => entry.visible && entry.c.side === side)
          .sort((a, b) => a.py - b.py || a.c.slot - b.c.slot);
        const gap = compact ? 9 : 16;
        const total =
          entries.reduce((sum, entry) => sum + entry.height, 0) +
          Math.max(0, entries.length - 1) * gap;
        const anchorCenter = entries.length
          ? entries.reduce((sum, entry) => sum + entry.py, 0) /
            entries.length
          : safeTop;
        let y = Math.max(
          safeTop,
          Math.min(safeBottom - total, anchorCenter - total * 0.46),
        );
        for (const entry of entries) {
          entry.labelY = y;
          y += entry.height + gap;
        }
      }
      for (const entry of projected) {
        const { c, label, line, dot, px, py, labelX, labelY, visible } =
          entry;
        if (!visible) {
          line.style.display = "none";
          dot.style.display = "none";
          continue;
        }
        line.style.display = compact ? "none" : "block";
        dot.style.display = compact ? "none" : "block";
        label.style.top = labelY + "px";
        const edge = c.side === "left" ? labelX + labelWidth : labelX;
        const centerY = labelY + entry.height / 2;
        line.setAttribute(
          "points",
          `${edge},${centerY} ${edge + (c.side === "left" ? 16 : -16)},${centerY} ${px},${py}`,
        );
        dot.setAttribute("cx", String(px));
        dot.setAttribute("cy", String(py));
      }
    };

    const setMotionText = (text: string) => {
      if (text === lastMotionText) return;
      lastMotionText = text;
      motionLabel.textContent = text;
    };

    const updateModel = (currentTime: number) => {
      if (!model) return;
      const props = latest.current;
      const { root, application, behavior, baseScale, step } = model;
      if (props.mode === "deform") {
        if (behavior) {
          root.scale.copy(baseScale);
        } else {
          const wave = reduced
            ? 0
            : (1 - Math.cos(currentTime * 2.6)) / 2;
          root.scale.y = baseScale.y * (1 - wave * 0.22);
          root.scale.x =
            baseScale.x *
            (1 +
              (props.kind === "auxetic" ? -1 : 1) * wave * 0.1);
        }
        if (props.kind === "resonator" && !behavior) {
          root.scale.copy(baseScale);
          root.traverse((object) => {
            if (!object.userData.resonator) return;
            const dy = reduced
              ? 0
              : Math.sin(currentTime * 4 + object.userData.phase) *
                step *
                0.12;
            object.position.y = object.userData.restY + dy;
            object.userData.spring.scale.y = 1 + dy / (step * 0.5);
          });
        }
      }
      if (application)
        setMotionText(
          application.update(currentTime, props.explode / 100),
        );
      if (behavior) setMotionText(behavior.update(currentTime));
    };

    const fitApplication = (w: number, h: number) => {
      const application = model?.application;
      if (!application || !latest.current.labels || w < 1 || h < 1) return;
      application.update(0, latest.current.explode / 100);
      scene.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(application.group);
      if (box.isEmpty()) return;
      const center = box.getCenter(new T.Vector3());
      const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();
      const compact = w < 760;
      const labelWidth = Math.min(
        218,
        Math.max(172, Math.floor(w * 0.16)),
      );
      const left = compact ? 18 : 24 + labelWidth + 18;
      const right = compact ? w - 76 : w - 152 - labelWidth - 18;
      const top = compact ? 180 : 168;
      const bottom = compact ? h - 325 : h - 124;
      camera.setViewOffset(
        w,
        h,
        w / 2 - (left + right) / 2,
        h / 2 - (top + bottom) / 2,
        w,
        h,
      );
      controls.target.copy(center);
      const corners: T.Vector3[] = [];
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z])
            corners.push(new T.Vector3(x, y, z));
      for (let distance = 5; distance < 50; distance *= 1.07) {
        camera.position.copy(center).addScaledVector(direction, distance);
        camera.lookAt(center);
        camera.updateMatrixWorld();
        const fits = corners.every((point) => {
          const v = point.clone().project(camera);
          const x = ((v.x + 1) * w) / 2;
          const y = ((1 - v.y) * h) / 2;
          return x >= left && x <= right && y >= top && y <= bottom;
        });
        if (fits) break;
      }
      controls.maxDistance = Math.max(
        22,
        camera.position.distanceTo(center) * 1.5,
      );
      controls.update();
    };

    const resize = (saveView = false) => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      fitApplication(w, h);
      if (saveView) {
        savedCamera = camera.position.clone();
        savedTarget = controls.target.clone();
        controls.saveState();
      }
      layoutDirty = true;
      markDirty();
    };

    const rebuild = (props: SceneProps) => {
      const started = performance.now();
      removeModel();
      camera.clearViewOffset();
      camera.position.set(8, 6, 9);
      controls.target.set(0, 0, 0);
      controls.maxDistance = 22;
      const root = createLattice(props, software);
      scene.add(root);
      let application: Application | undefined;
      let behavior: Behavior | undefined;
      if (props.mode === "application") {
        application = createApplication(
          props.kind,
          props.variant,
          root,
          props.color,
          props.count,
          props.thickness,
        );
        scene.add(application.group);
        camera.position.set(
          ...(application.camera as [number, number, number]),
        );
        controls.target.set(
          ...(application.target as [number, number, number]),
        );
      } else if (props.mode === "deform") {
        behavior = createBehavior(props, root);
        if (behavior) {
          scene.add(behavior.group);
          if (behavior.camera)
            camera.position.set(
              ...(behavior.camera as [number, number, number]),
            );
          if (behavior.target)
            controls.target.set(
              ...(behavior.target as [number, number, number]),
            );
        }
      }
      model = {
        root,
        application,
        behavior,
        baseScale: root.scale.clone(),
        step: 3.5 / props.count,
      };
      renderer.domElement.setAttribute(
        "aria-label",
        `${props.kind} interactive three-dimensional lattice`,
      );
      renderer.domElement.dataset.modelGeneration = String(
        ++modelGeneration,
      );
      buildCallouts(application, props.color);
      motionLabel.hidden = !(application || behavior);
      time = 0;
      setWireframe(props.wire);
      setSection(props.section);
      updateModel(0);
      resize(true);
      renderer.domElement.dataset.modelBuildMs = (
        performance.now() - started
      ).toFixed(1);
      if (software) {
        markDirty(false);
      } else {
        // Let supported browsers compile shaders in parallel before the first
        // frame of a replacement model, avoiding a long synchronous click-to-
        // paint stall. Stale compiles are ignored if another model wins.
        const generation = modelGeneration;
        dirty = false;
        void (renderer as T.WebGLRenderer)
          .compileAsync(scene, camera)
          .catch(() => undefined)
          .then(() => {
            if (generation === modelGeneration) markDirty(false);
          });
      }
    };

    const resetView = () => {
      time = 0;
      camera.position.copy(savedCamera);
      controls.target.copy(savedTarget);
      controls.update();
      updateModel(0);
      layoutDirty = true;
      markDirty();
    };

    const restartMotion = () => {
      time = 0;
      model?.application?.restart?.();
      updateModel(0);
      markDirty();
    };

    runtime.current = {
      rebuild,
      setWireframe,
      setSection,
      resetView,
      restartMotion,
      invalidate: (labelsChanged = false) => {
        layoutDirty ||= labelsChanged;
        markDirty();
      },
    };

    const ro = new ResizeObserver(() => resize(false));
    ro.observe(container);
    let frame = 0;
    let last = performance.now();
    let previousExplode = latest.current.explode;
    let previousLabels = latest.current.labels;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.15);
      last = now;
      if (document.visibilityState === "hidden") return;
      const props = latest.current;
      const active = props.playing && !reduced;
      if (active) time += dt * props.speed;
      const explodeChanged = previousExplode !== props.explode;
      const labelsChanged = previousLabels !== props.labels;
      if (explodeChanged || labelsChanged) {
        previousExplode = props.explode;
        previousLabels = props.labels;
        layoutDirty ||= labelsChanged;
        markDirty();
      }
      controls.autoRotate = active && props.mode === "structure";
      controls.autoRotateSpeed = 0.35;
      const cameraChanged = controls.update();
      if (active || dirty || explodeChanged) updateModel(time);
      if (
        (active || cameraChanged || dirty) &&
        (!software || now >= softwareRenderAfter) &&
        (!software || dirty || now - lastDraw > 240)
      ) {
        renderer.render(scene, camera);
        if (model?.application) updateCallouts();
        dirty = false;
        lastDraw = performance.now();
      }
    };
    frame = requestAnimationFrame(animate);

    return () => {
      runtime.current = null;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      removeModel();
      disposeObject(scene);
      env?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      if (!software) (renderer as T.WebGLRenderer).forceContextLoss();
      renderer.domElement.remove();
      fallback?.remove();
      overlay.remove();
      motionLabel.remove();
    };
  }, []);

  useEffect(() => {
    runtime.current?.rebuild(latest.current);
  }, [
    p.kind,
    p.variant,
    p.count,
    p.thickness,
    p.color,
    p.secondaryColor,
    p.blend,
    p.mode,
  ]);
  useEffect(() => runtime.current?.setWireframe(p.wire), [p.wire]);
  useEffect(() => runtime.current?.setSection(p.section), [p.section]);
  useEffect(() => runtime.current?.resetView(), [p.reset]);
  useEffect(() => runtime.current?.restartMotion(), [p.playNonce]);
  useEffect(() => runtime.current?.invalidate(true), [p.labels]);
  useEffect(() => runtime.current?.invalidate(), [p.explode]);

  return (
    <div className="scene">
      <div ref={host} className="scene-canvas-host" />
    </div>
  );
}
