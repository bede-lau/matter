export type ResearchRow = [string, number, number];
/** Stable, exact top-k lookup in O(n*k), with k=5. Equal distances retain source order. */
export function nearestDesigns(
  rows: ResearchRow[],
  target: number,
  minWidth: number,
  limit = 5,
) {
  const best: { row: ResearchRow; distance: number }[] = [];
  for (const row of rows) {
    if (row[2] < minWidth) continue;
    const distance = Math.abs(row[1] - target);
    let p = 0;
    while (p < best.length && best[p].distance <= distance) p++;
    if (p < limit) {
      best.splice(p, 0, { row, distance });
      if (best.length > limit) best.pop();
    }
  }
  return best.map((v) => v.row);
}
