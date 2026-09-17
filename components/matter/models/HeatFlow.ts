import * as T from 'three';

/** Warm, directional teaching overlay for qualitative heat transfer. */
export const heatFlowColors = {
  edge: '#3d1714',
  core: '#ff6538',
  chevron: '#ff8a57',
};

export function heatFlowCurve(points: number[][]) {
  const curve = new T.CurvePath<T.Vector3>();
  for (let i = 1; i < points.length; i += 1) {
    curve.add(new T.LineCurve3(
      new T.Vector3(points[i - 1][0], points[i - 1][1], points[i - 1][2]),
      new T.Vector3(points[i][0], points[i][1], points[i][2]),
    ));
  }
  return curve;
}

export function addHeatFlowRoute(parent: T.Object3D, points: number[][], name = 'heat-flow-route') {
  const curve = heatFlowCurve(points);
  const segments = Math.max(12, points.length * 4);
  const edge = new T.Mesh(
    new T.TubeGeometry(curve, segments, .025, 6, false),
    new T.MeshBasicMaterial({ color: heatFlowColors.edge, transparent: true, opacity: .9, depthWrite: false, side: T.BackSide }),
  );
  edge.name = `${name}-edge`;
  const core = new T.Mesh(
    new T.TubeGeometry(curve, segments, .013, 6, false),
    new T.MeshBasicMaterial({ color: heatFlowColors.core, transparent: true, opacity: .94, depthWrite: false }),
  );
  core.name = `${name}-core`;
  edge.castShadow = core.castShadow = false;
  edge.receiveShadow = core.receiveShadow = false;
  parent.add(edge, core);
  return curve;
}

/** A dark-edged, warm directional marker. It indicates transfer direction, not a wave. */
export function addHeatFlowChevron(parent: T.Object3D, name = 'heat-flow-chevron') {
  const marker = new T.Group();
  marker.name = name;
  const edge = new T.Mesh(
    new T.ConeGeometry(.068, .19, 3),
    new T.MeshBasicMaterial({ color: heatFlowColors.edge, transparent: true, opacity: .9, depthWrite: false, side: T.BackSide }),
  );
  edge.name = `${name}-edge`;
  const core = new T.Mesh(
    new T.ConeGeometry(.047, .145, 3),
    new T.MeshBasicMaterial({ color: heatFlowColors.chevron, transparent: true, opacity: .98, depthWrite: false }),
  );
  core.name = `${name}-core`;
  core.position.y = .012;
  marker.add(edge, core);
  parent.add(marker);
  return marker;
}

export function placeHeatFlowChevron(marker: T.Object3D, curve: T.CurvePath<T.Vector3>, progress: number, reverse = false) {
  const clamped = Math.max(.0001, Math.min(.9999, progress));
  marker.position.copy(curve.getPointAt(clamped));
  marker.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), curve.getTangentAt(clamped).normalize().multiplyScalar(reverse ? -1 : 1));
}
