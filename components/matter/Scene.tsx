"use client";
import { SoftwareRenderer } from "./SoftwareRenderer";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
export type SceneProps = {
  kind: string;
  variant: number;
  count: number;
  thickness: number;
  color: string;
  playing: boolean;
  mode: string;
  wire: boolean;
  section: boolean;
  reset: number;
};
export default function Scene(p: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(p);
  latest.current = p;
  const [error, setError] = useState("");
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: T.WebGLRenderer | SoftwareRenderer;
    let software = false;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      renderer = new SoftwareRenderer();
      software = true;
      setError("Software 3D preview · Enable WebGL for full lighting");
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      `${p.kind} interactive three-dimensional lattice`,
    );
    const scene = new T.Scene();
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
    scene.add(new T.HemisphereLight(0xe5f6ff, 0x20252a, 2));
    const key = new T.DirectionalLight(0xffffff, 4);
    key.position.set(4, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new T.DirectionalLight(0xa8caff, 3);
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
    const root = new T.Group();
    scene.add(root);
    const material = new T.MeshPhysicalMaterial({
      color: p.color,
      metalness: 0.28,
      roughness: 0.28,
      clearcoat: 0.22,
      wireframe: p.wire,
      side: T.DoubleSide,
    });
    const addMesh = (
      geo: T.BufferGeometry,
      mat: T.Material = material,
      parent: T.Group = root,
    ) => {
      const m = new T.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const segments: { a: number[]; b: number[]; r: number }[] = [];
    const rod = (
      a: number[],
      b: number[],
      r: number,
      parent: T.Group = root,
      mat: T.Material = material,
    ) => {
      if (parent === root && mat === material) {
        segments.push({ a, b, r });
        return;
      }
      const va = new T.Vector3(...(a as [number, number, number])),
        vb = new T.Vector3(...(b as [number, number, number]));
      const m = addMesh(
        new T.CylinderGeometry(r, r, va.distanceTo(vb), 8),
        mat,
        parent,
      );
      m.position.copy(va.add(vb).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        new T.Vector3(...(b as [number, number, number]))
          .sub(new T.Vector3(...(a as [number, number, number])))
          .normalize(),
      );
    };
    const n = p.count,
      step = 3.5 / n,
      r = (step * p.thickness) / 20;
    const edgeKeys = new Set<string>();
    const edge = (a: number[], b: number[]) => {
      const key = [
        a.map((x) => x.toFixed(3)).join(","),
        b.map((x) => x.toFixed(3)).join(","),
      ]
        .sort()
        .join("|");
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      const mid = (a[1] + b[1]) / 2;
      const graded =
        (p.variant === 2 && p.kind !== "octet") ||
        (p.variant === 1 && p.kind === "octet");
      const radius =
        r *
        (graded ? 1 + (0.3 * mid) / 2 : 1) *
        (p.variant === 1 && p.kind === "kelvin" ? 1.3 : 1);
      rod(a, b, radius);
    };
    if (p.kind === "gyroid") {
      const res = software
        ? Math.min(48, 24 + n * 6)
        : Math.min(90, 38 + n * 9);
      const mc = new MarchingCubes(res, material, false, false, 250000);
      mc.isolation = 0;
      mc.scale.setScalar(1.9);
      mc.castShadow = true;
      mc.receiveShadow = true;
      const freq = n * Math.PI;
      for (let z = 0; z < res; z++)
        for (let y = 0; y < res; y++)
          for (let x = 0; x < res; x++) {
            const xx = ((x / (res - 1)) * 2 - 1) * freq,
              yy = ((y / (res - 1)) * 2 - 1) * freq,
              zz = ((z / (res - 1)) * 2 - 1) * freq;
            const g =
              Math.sin(xx) * Math.cos(yy) +
              Math.sin(yy) * Math.cos(zz) +
              Math.sin(zz) * Math.cos(xx);
            const boundary =
              Math.min(x, y, z, res - 1 - x, res - 1 - y, res - 1 - z) - 1.5;
            const thick =
              0.2 +
              p.thickness * 0.18 +
              (p.variant === 2 ? (y / res) * 0.3 : 0);
            mc.field[x + y * res + z * res * res] = Math.min(
              p.variant === 1 ? g + 0.35 : thick - Math.abs(g),
              boundary,
            );
          }
      mc.update();
      mc.geometry.setDrawRange(0, mc.count);
      root.add(mc);
    } else if (p.kind === "kelvin") {
      const verts: number[][] = [];
      for (let a = 0; a < 3; a++)
        for (let s of [-1, 1])
          for (let t of [-1, 1]) {
            const v = [0, 0, 0];
            v[(a + 1) % 3] = s;
            v[(a + 2) % 3] = 2 * t;
            verts.push(v);
            const w = [0, 0, 0];
            w[(a + 1) % 3] = 2 * s;
            w[(a + 2) % 3] = t;
            verts.push(w);
          }
      const scale = step / 4;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          for (let k = 0; k < n; k++)
            for (let offset of [0, 0.5]) {
              const c = [
                (i - (n - 1) / 2 + offset) * step,
                (j - (n - 1) / 2 + offset) * step,
                (k - (n - 1) / 2 + offset) * step,
              ];
              for (let a = 0; a < verts.length; a++)
                for (let b = a + 1; b < verts.length; b++)
                  if (
                    Math.abs(
                      verts[a].reduce(
                        (s, v, d) => s + (v - verts[b][d]) ** 2,
                        0,
                      ) - 2,
                    ) < 0.001
                  ) {
                    const pa = verts[a].map((v, d) => v * scale + c[d]),
                      pb = verts[b].map((v, d) => v * scale + c[d]);
                    if (
                      pa.every((v) => Math.abs(v) <= 1.76) &&
                      pb.every((v) => Math.abs(v) <= 1.76)
                    )
                      edge(pa, pb);
                  }
            }
    } else if (p.kind === "honeycomb" || p.kind === "auxetic") {
      for (let z = 0; z < n; z++)
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            let pts: number[][] = [];
            const zz = (z - (n - 1) / 2) * step;
            if (p.kind === "honeycomb") {
              const rad = step * 0.57,
                elong = p.variant === 1 ? 1.4 : 1;
              for (let a = 0; a < 6; a++) {
                const angle = (Math.PI / 3) * a;
                pts.push([
                  Math.cos(angle) * rad + (x - (n - 1) / 2) * 1.5 * rad,
                  (Math.sin(angle) * rad +
                    (y - (n - 1) / 2) * Math.sqrt(3) * rad +
                    (x % 2) * Math.sqrt(3) * rad * 0.5) *
                    elong,
                  zz,
                ]);
              }
            } else {
              const a = step * 0.42,
                h = step * 0.48,
                b = step * (p.variant === 1 ? 0.08 : 0.22);
              const cx = (x - (n - 1) / 2) * 2 * a + (y % 2) * a,
                cy = (y - (n - 1) / 2) * (h + b);
              pts = [
                [-a, -h],
                [0, -b],
                [a, -h],
                [a, h],
                [0, b],
                [-a, h],
              ].map((v) => [v[0] + cx, v[1] + cy, zz]);
            }
            for (let a = 0; a < 6; a++) {
              edge(pts[a], pts[(a + 1) % 6]);
              if (z < n - 1)
                edge(pts[a], [pts[a][0], pts[a][1], pts[a][2] + step]);
            }
          }
    } else if (p.kind === "octet") {
      // FCC nearest-neighbor graph: tetrahedral/octahedral space frame.
      const points = new Map<string, number[]>();
      for (let x = 0; x <= 2 * n; x++)
        for (let y = 0; y <= 2 * n; y++)
          for (let z = 0; z <= 2 * n; z++)
            if ((x + y + z) % 2 === 0) points.set(`${x},${y},${z}`, [x, y, z]);
      const offsets: number[][] = [];
      for (let zero = 0; zero < 3; zero++)
        for (let a of [-1, 1])
          for (let b of [-1, 1]) {
            const v = [0, 0, 0];
            v[(zero + 1) % 3] = a;
            v[(zero + 2) % 3] = b;
            offsets.push(v);
          }
      points.forEach((v) => {
        for (const off of offsets) {
          const q = v.map((a, i) => a + off[i]);
          if (points.has(q.join(",")))
            edge(
              v.map(
                (a, i) =>
                  (a - n) *
                  step *
                  0.5 *
                  (p.variant === 2 && i === 1 ? 1.25 : 1),
              ),
              q.map(
                (a, i) =>
                  (a - n) *
                  step *
                  0.5 *
                  (p.variant === 2 && i === 1 ? 1.25 : 1),
              ),
            );
        }
      });
    } else {
      for (let x = 0; x < n; x++)
        for (let y = 0; y < n; y++)
          for (let z = 0; z < n; z++) {
            const c = [
              (x - (n - 1) / 2) * step,
              (y - (n - 1) / 2) * step,
              (z - (n - 1) / 2) * step,
            ];
            const v: number[][] = [];
            for (let a of [-0.5, 0.5])
              for (let b of [-0.5, 0.5])
                for (let d of [-0.5, 0.5])
                  v.push([c[0] + a * step, c[1] + b * step, c[2] + d * step]);
            for (let a = 0; a < 8; a++)
              for (let b = a + 1; b < 8; b++)
                if (
                  v[a].filter((q, i) => Math.abs(q - v[b][i]) > 0.001)
                    .length === 1
                )
                  edge(v[a], v[b]);
            for (let mass = 0; mass < (p.variant === 1 ? 2 : 1); mass++) {
              const radius =
                step * (p.variant === 2 ? 0.13 + 0.08 * (y / n) : 0.18);
              const m = addMesh(
                new T.SphereGeometry(radius, 16, 12),
                new T.MeshStandardMaterial({
                  color: 0xd5e6ed,
                  metalness: 0.8,
                  roughness: 0.22,
                }),
              );
              m.position.set(
                c[0] + (p.variant === 1 ? (mass - 0.5) * step * 0.4 : 0),
                c[1],
                c[2],
              );
              m.userData.resonator = true;
              m.userData.restY = c[1];
              m.userData.phase = x + y + mass;
              const coilPoints = [];
              for (let j = 0; j <= 48; j++) {
                const t = j / 48,
                  angle = t * Math.PI * 12;
                coilPoints.push(
                  new T.Vector3(
                    Math.sin(angle) * step * 0.06,
                    t * step * 0.5,
                    Math.cos(angle) * step * 0.06,
                  ),
                );
              }
              const spring = addMesh(
                new T.TubeGeometry(
                  new T.CatmullRomCurve3(coilPoints),
                  48,
                  r * 0.42,
                  5,
                  false,
                ),
                material,
              );
              spring.position.set(m.position.x, c[1] - step * 0.5, c[2]);
              m.userData.spring = spring;
            }
          }
    }
    if (segments.length) {
      const cylinders = new T.InstancedMesh(
        new T.CylinderGeometry(1, 1, 1, software ? 6 : 12),
        material,
        segments.length,
      );
      const dummy = new T.Object3D(),
        up = new T.Vector3(0, 1, 0);
      segments.forEach((seg, i) => {
        const a = new T.Vector3(...(seg.a as [number, number, number])),
          b = new T.Vector3(...(seg.b as [number, number, number]));
        dummy.position.copy(a).add(b).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
        dummy.scale.set(seg.r, a.distanceTo(b), seg.r);
        dummy.updateMatrix();
        cylinders.setMatrixAt(i, dummy.matrix);
      });
      cylinders.castShadow = true;
      cylinders.receiveShadow = true;
      root.add(cylinders);
    }
    const app = new T.Group();
    scene.add(app);
    const dark = new T.MeshStandardMaterial({
      color: 0x293746,
      roughness: 0.55,
      metalness: 0.3,
    });
    const white = new T.MeshStandardMaterial({
      color: 0xe4e8df,
      roughness: 0.7,
    });
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: T.Material = dark,
    ) => {
      const m = addMesh(new T.BoxGeometry(w, h, d), mat, app);
      m.position.set(x, y, z);
      return m;
    };
    let runner: T.Group | null = null;
    if (p.mode === "application") {
      if (p.kind === "gyroid") {
        root.scale.set(1.1, 0.22, 0.48);
        root.position.set(0, -1.8, 0);
        box(4.5, 0.16, 1.85, 0, -2.27, 0, white);
        const shape = new T.Shape();
        shape.moveTo(-2, -1.55);
        shape.bezierCurveTo(-1.8, -0.8, -1.3, -0.6, -0.7, -0.8);
        shape.lineTo(0.2, -1.18);
        shape.bezierCurveTo(1, -1.05, 2.3, -1.45, 2.2, -1.65);
        shape.lineTo(-2, -1.65);
        const upper = addMesh(
          new T.ExtrudeGeometry(shape, {
            depth: 1.45,
            bevelEnabled: true,
            bevelThickness: 0.12,
            bevelSize: 0.12,
            bevelSegments: 4,
            steps: 1,
            curveSegments: 24,
          }),
          dark,
          app,
        );
        upper.position.z = -0.72;
        for (let i = 0; i < 5; i++)
          rod(
            [-0.6 + i * 0.23, -1.05 - i * 0.045, -0.55],
            [-0.6 + i * 0.23, -1.05 - i * 0.045, 0.55],
            0.028,
            app,
            white,
          );
        runner = new T.Group();
        app.add(runner);
        runner.position.set(3, -0.85, -0.5);
        runner.scale.setScalar(0.9);
        const head = addMesh(new T.SphereGeometry(0.22, 24, 16), white, runner);
        head.position.set(0, 1.1, 0);
        rod([0, 0.83, 0], [0.1, 0, 0], 0.18, runner, dark);
        const legs: T.Group[] = [],
          knees: T.Group[] = [],
          arms: T.Group[] = [];
        for (let side of [-1, 1]) {
          const leg = new T.Group();
          leg.position.set(0.1, 0, side * 0.15);
          runner.add(leg);
          rod([0, 0, 0], [0, -0.62, 0], 0.09, leg, dark);
          const knee = new T.Group();
          knee.position.y = -0.62;
          leg.add(knee);
          rod([0, 0, 0], [0, -0.6, 0], 0.065, knee, white);
          const shoe = addMesh(
            new T.CapsuleGeometry(0.105, 0.29, 5, 10),
            dark,
            knee,
          );
          shoe.rotation.z = Math.PI / 2;
          shoe.position.set(0.08, -0.62, 0);
          const sole = addMesh(
            new T.BoxGeometry(0.48, 0.06, 0.23),
            material,
            knee,
          );
          sole.position.set(0.08, -0.71, 0);
          legs.push(leg);
          knees.push(knee);
          const arm = new T.Group();
          arm.position.set(0, 0.72, side * 0.24);
          runner.add(arm);
          rod([0, 0, 0], [0, -0.42, 0], 0.065, arm, white);
          rod([0, -0.42, 0], [0.35, -0.48, 0], 0.055, arm, white);
          arms.push(arm);
        }
        runner.userData.legs = legs;
        runner.userData.knees = knees;
        runner.userData.arms = arms;
        camera.position.set(9, 4.5, 11);
        controls.target.set(0.7, -0.4, 0);
      } else if (p.kind === "octet" || p.kind === "honeycomb") {
        root.scale.y = 0.38;
        box(4.2, 0.12, 4.2, 0, 0.84, 0, white);
        box(4.2, 0.12, 4.2, 0, -0.84, 0, white);
      } else {
        box(4.4, 0.15, 4.4, 0, 2.1, 0, white);
        box(4.4, 0.15, 4.4, 0, -2.1, 0, dark);
      }
    }
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
    const baseScale = root.scale.clone();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const active = latest.current.playing && !reduced;
      if (active) time += dt;
      controls.autoRotate = active && p.mode === "structure";
      controls.autoRotateSpeed = 0.35;
      const cameraChanged = controls.update();
      if (p.mode === "deform" || p.mode === "application") {
        const wave = reduced ? 0 : (1 - Math.cos(time * 2.6)) / 2;
        root.scale.y = baseScale.y * (1 - wave * 0.22);
        root.scale.x =
          baseScale.x * (1 + (p.kind === "auxetic" ? -1 : 1) * wave * 0.1);
        if (p.kind === "resonator") {
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
        if (runner) {
          runner.rotation.z = -0.12;
          runner.position.y = -0.85 + Math.abs(Math.sin(time * 3.5)) * 0.12;
          runner.userData.legs.forEach((leg: T.Group, i: number) => {
            const phase = time * 3.5 + i * Math.PI;
            leg.rotation.z = Math.sin(phase) * 0.75;
            runner!.userData.knees[i].rotation.z =
              -Math.max(0, Math.cos(phase)) * 0.95;
            runner!.userData.arms[i].rotation.z = -Math.sin(phase) * 0.8;
          });
        }
      }
      if (
        (active || cameraChanged || firstRender) &&
        (!software || firstRender || now - lastDraw > 160)
      ) {
        renderer.render(scene, camera);
        firstRender = false;
        lastDraw = now;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      env?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [
    p.kind,
    p.variant,
    p.count,
    p.thickness,
    p.color,
    p.mode,
    p.wire,
    p.section,
    p.reset,
  ]);
  return (
    <div ref={host} className="scene">
      {error && <div className="scene-fallback">{error}</div>}
    </div>
  );
}
