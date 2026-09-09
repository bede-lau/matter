import * as T from "three";
/** Geometry-based fallback for environments that disable WebGL. Not a physical renderer. */
export class SoftwareRenderer {
  domElement = document.createElement("canvas");
  shadowMap = { enabled: false, type: 0 };
  toneMapping = 0;
  toneMappingExposure = 1;
  localClippingEnabled = false;
  width = 1;
  height = 1;
  last = 0;
  setPixelRatio(_n: number) {}
  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.domElement.width = w;
    this.domElement.height = h;
    this.domElement.style.width = w + "px";
    this.domElement.style.height = h + "px";
  }
  dispose() {
    this.domElement.remove();
  }
  render(scene: T.Scene, camera: T.Camera) {
    const now = performance.now();
    this.last = now;
    const ctx = this.domElement.getContext("2d");
    if (!ctx) return;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const w = this.width,
      h = this.height;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createRadialGradient(
      w * 0.5,
      h * 0.48,
      0,
      w * 0.5,
      h * 0.48,
      w * 0.7,
    );
    gradient.addColorStop(0, "#25343e");
    gradient.addColorStop(1, "#111820");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.8);
    ctx.scale(1, 0.2);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.28);
    sh.addColorStop(0, "#0008");
    sh.addColorStop(1, "#0000");
    ctx.fillStyle = sh;
    ctx.fillRect(-w * 0.4, -w * 0.4, w * 0.8, w * 0.8);
    ctx.restore();
    const triangles: {
      pts: number[];
      z: number;
      color: string;
      wire: boolean;
    }[] = [];
    const va = new T.Vector3(),
      vb = new T.Vector3(),
      vc = new T.Vector3(),
      normal = new T.Vector3(),
      ab = new T.Vector3(),
      ac = new T.Vector3();
    const normA = new T.Vector3(),
      normB = new T.Vector3(),
      normC = new T.Vector3(),
      normalMatrix = new T.Matrix3();
    const colorA = new T.Color(),
      colorB = new T.Color(),
      colorC = new T.Color(),
      phaseColor = new T.Color(),
      instanceColor = new T.Color();
    const light = new T.Vector3(-0.4, 0.8, 0.5).normalize(),
      matrix = new T.Matrix4(),
      im = new T.Matrix4();
    scene.traverseVisible((obj) => {
      if (
        !(obj instanceof T.Mesh) ||
        obj.geometry.type === "PlaneGeometry" ||
        !obj.visible
      )
        return;
      const geo = obj.geometry,
        pos = geo.attributes.position;
      if (!pos) return;
      const mat = (
        Array.isArray(obj.material) ? obj.material[0] : obj.material
      ) as T.MeshStandardMaterial;
      const idx = geo.index;
      const vertexColors = geo.attributes.color;
      const len = Math.min(geo.drawRange.count, idx ? idx.count : pos.count);
      const instances = obj instanceof T.InstancedMesh ? obj.count : 1;
      for (let inst = 0; inst < instances; inst++) {
        matrix.copy(obj.matrixWorld);
        if (obj instanceof T.InstancedMesh) {
          obj.getMatrixAt(inst, im);
          matrix.multiply(im);
          if (obj.instanceColor) obj.getColorAt(inst, instanceColor);
        }
        normalMatrix.getNormalMatrix(matrix);
        for (let i = 0; i < len; i += 3) {
          va.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(
            matrix,
          );
          vb.fromBufferAttribute(
            pos,
            idx ? idx.getX(i + 1) : i + 1,
          ).applyMatrix4(matrix);
          vc.fromBufferAttribute(
            pos,
            idx ? idx.getX(i + 2) : i + 2,
          ).applyMatrix4(matrix);
          if (
            mat.clippingPlanes?.some(
              (pl) =>
                pl.distanceToPoint(va) < 0 &&
                pl.distanceToPoint(vb) < 0 &&
                pl.distanceToPoint(vc) < 0,
            )
          )
            continue;
          normal
            .crossVectors(ab.subVectors(vb, va), ac.subVectors(vc, va))
            .normalize();
          const facing = normal.dot(ab.copy(camera.position).sub(va));
          if (
            (mat.side === T.FrontSide && facing <= 0) ||
            (mat.side === T.BackSide && facing >= 0)
          )
            continue;
          if (geo.attributes.normal) {
            normA.fromBufferAttribute(
              geo.attributes.normal,
              idx ? idx.getX(i) : i,
            );
            normB.fromBufferAttribute(
              geo.attributes.normal,
              idx ? idx.getX(i + 1) : i + 1,
            );
            normC.fromBufferAttribute(
              geo.attributes.normal,
              idx ? idx.getX(i + 2) : i + 2,
            );
            normal
              .copy(normA)
              .add(normB)
              .add(normC)
              .applyMatrix3(normalMatrix)
              .normalize();
          }
          let intensity = 0.27 + 0.62 * Math.abs(normal.dot(light));
          const color = vertexColors
            ? phaseColor
                .copy(colorA).fromBufferAttribute(vertexColors, idx ? idx.getX(i) : i)
                .add(
                  colorB.fromBufferAttribute(
                    vertexColors,
                    idx ? idx.getX(i + 1) : i + 1,
                  ),
                )
                .add(
                  colorC.fromBufferAttribute(
                    vertexColors,
                    idx ? idx.getX(i + 2) : i + 2,
                  ),
                )
                .multiplyScalar(1 / 3)
            : obj instanceof T.InstancedMesh && obj.instanceColor
              ? instanceColor
              : mat.color ?? new T.Color("#c2ef72");
          const shade = (c: number) =>
            Math.min(255, Math.round(Math.pow(c, 1 / 2.2) * 255 * intensity));
          const rgb = `rgb(${shade(color.r)},${shade(color.g)},${shade(color.b)})`;
          va.project(camera);
          vb.project(camera);
          vc.project(camera);
          if (va.z > 1 || vb.z > 1 || vc.z > 1) continue;
          triangles.push({
            pts: [
              ((va.x + 1) * w) / 2,
              ((1 - va.y) * h) / 2,
              ((vb.x + 1) * w) / 2,
              ((1 - vb.y) * h) / 2,
              ((vc.x + 1) * w) / 2,
              ((1 - vc.y) * h) / 2,
            ],
            z: (va.z + vb.z + vc.z) / 3,
            color: rgb,
            wire: !!mat.wireframe,
          });
        }
      }
    });
    triangles.sort((a, b) => b.z - a.z);
    for (const t of triangles) {
      ctx.beginPath();
      ctx.moveTo(t.pts[0], t.pts[1]);
      ctx.lineTo(t.pts[2], t.pts[3]);
      ctx.lineTo(t.pts[4], t.pts[5]);
      ctx.closePath();
      ctx.fillStyle = t.color;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 0.45;
      if (!t.wire) ctx.fill();
      ctx.stroke();
    }
  }
}
