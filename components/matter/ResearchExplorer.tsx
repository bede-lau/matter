"use client";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Slider } from "@/components/ui/slider";
import { nearestDesigns, type ResearchRow as Row } from "@/lib/matter/research";
import ResearchPlot from "./ResearchPlot";
import { GlossaryText } from "./Glossary";
let dataset: Promise<{ rows: Row[] }> | undefined;
function loadDataset() {
  return (dataset ??= fetch("/data/elastodynamic.json")
    .then((r) => {
      if (!r.ok) throw Error("Dataset could not load.");
      return r.json() as Promise<{ rows: Row[] }>;
    })
    .catch((e) => {
      dataset = undefined;
      throw e;
    }));
}
export default function ResearchExplorer() {
  const [rows, setRows] = useState<Row[]>([]),
    [target, setTarget] = useState(600),
    [width, setWidth] = useState(50),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Row | null>(null);
  useEffect(() => {
    let active = true;
    loadDataset()
      .then((d) => {
        if (active) setRows(d.rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const deferredTarget = useDeferredValue(target),
    deferredWidth = useDeferredValue(width);
  const matches = useMemo(
    () => nearestDesigns(rows, deferredTarget, deferredWidth),
    [rows, deferredTarget, deferredWidth],
  );
  const best = selected ?? matches[0];
  const sample = useMemo(() => rows.filter((_, i) => i % 21 === 0), [rows]);
  return (
    <article className="research-explorer">
      <div className="research-head">
        <div>
          <span className="eyebrow">OPEN RESEARCH / UCI</span>
          <h2>Find a structure by its sound response.</h2>
          <p>
            {rows.length ? rows.length.toLocaleString() : "Loading"} simulated
            designs ·{" "}
            <GlossaryText>2D elastodynamic metamaterials</GlossaryText>
          </p>
        </div>
        <a
          href="https://doi.org/10.24432/C5ZS5D"
          target="_blank"
          rel="noreferrer"
        >
          Original dataset ↗
        </a>
      </div>
      {error && <p role="alert">{error}</p>}
      <div
        className="research-body"
        aria-busy={target !== deferredTarget || width !== deferredWidth}
      >
        <div className="research-controls">
          <label>
            <GlossaryText>Target band-gap center</GlossaryText>{" "}
            <strong>{target} Hz</strong>
          </label>
          <Slider
            aria-label="Target band-gap center"
            min={100}
            max={2000}
            step={25}
            value={[target]}
            onValueChange={(v) => {
              setTarget(v[0]);
              setSelected(null);
            }}
          />
          <label>
            <GlossaryText>Minimum band-gap width</GlossaryText>{" "}
            <strong>{width} Hz</strong>
          </label>
          <Slider
            aria-label="Minimum band-gap width"
            min={0}
            max={500}
            step={10}
            value={[width]}
            onValueChange={(v) => {
              setWidth(v[0]);
              setSelected(null);
            }}
          />
          <p>
            <GlossaryText>
              A band gap is a range of frequencies that cannot travel through
              the ideal repeating structure in this simulation.
            </GlossaryText>
          </p>
          <small>
            Finds the closest center among records meeting your width threshold.
            These data are separate from the 3D mechanical catalog.
          </small>
        </div>
        <div className="research-plot">
          <ResearchPlot
            sample={sample}
            target={deferredTarget}
            width={deferredWidth}
            best={best}
          />

          <span>
            Band-gap center (Hz) →{" "}
            <em>Vertical: width (Hz) · Every 21st record shown</em>
          </span>
        </div>
        <div className="research-result">
          <span className="eyebrow">
            {selected ? "SELECTED DESIGN" : "CLOSEST MATCH"}
          </span>
          {best ? (
            <>
              <h3>
                {best[1].toFixed(1)} <small>Hz center</small>
              </h3>
              <p>{best[2].toFixed(1)} Hz band-gap width</p>
              <div
                className="binary-code"
                aria-label={"Encoded design " + best[0]}
              >
                {best[0].split("").map((v, i) => (
                  <span key={i} className={v === "1" ? "filled" : ""}>
                    {v}
                  </span>
                ))}
              </div>
              <small>
                15-bit source encoding, not a spatial reconstruction of the unit
                cell.
              </small>
              <p className="source-label">SIMULATED / UCI 2021</p>
            </>
          ) : (
            <p>
              {rows.length
                ? "No designs meet this threshold. Try a smaller minimum width."
                : "Loading research data…"}
            </p>
          )}
        </div>
      </div>
      <div className="match-buttons">
        {matches.map((r, i) => (
          <button
            key={r[0] + i}
            aria-pressed={best === r}
            onClick={() => setSelected(r)}
          >
            {r[1].toFixed(1)} Hz <span>{r[2].toFixed(1)} Hz wide</span>
          </button>
        ))}
      </div>
      <p className="attribution">
        Ogren, Chen, Brinson, Bastawrous, Rudin & Daraio (2021). CC BY 4.0.{" "}
        {rows.length.toLocaleString()} data rows parsed; UCI lists 20,521
        instances. Units retained from UCI.{" "}
        <a href="/data/elastodynamic.json" download>
          Download normalized data ↗
        </a>
      </p>
    </article>
  );
}
