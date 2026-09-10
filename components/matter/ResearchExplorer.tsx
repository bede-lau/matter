"use client";
import { useEffect, useMemo, useState } from "react";
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
  const matches = useMemo(
    () => nearestDesigns(rows, target, width),
    [rows, target, width],
  );
  const best = selected ?? matches[0];
  const sample = useMemo(() => rows.filter((_, i) => i % 21 === 0), [rows]);
  return (
    <article className="research-explorer">
      <div className="research-head">
        <div>
          <span className="eyebrow">OPEN RESEARCH / UCI</span>
          <h2>Find a simulated structure that blocks a chosen vibration range.</h2>
          <p>
            {rows.length ? rows.length.toLocaleString() : "Loading"} simulated
            2D repeating designs ·{" "}
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
        aria-busy={!rows.length && !error}
      >
        <div className="research-controls">
          <label>
            <GlossaryText>Frequency to block near</GlossaryText>{" "}
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
            <GlossaryText>Minimum blocked range</GlossaryText>{" "}
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
              A band gap is a frequency interval that cannot travel through the
              ideal repeating model. Choose the middle of the range you care
              about, then choose how wide the blocked range should be.
            </GlossaryText>
          </p>
          <small>
            The explorer keeps records with a wide-enough reported gap, then
            ranks them by how close their center is to your target. These
            simulations are separate from the 3D product lessons.
          </small>
        </div>
        <div className="research-plot">
          <ResearchPlot
            sample={sample}
            target={target}
            width={width}
            best={best}
          />

          <span>
            Middle of band gap (Hz) →{" "}
            <em>Vertical: width (Hz) · One of every 21 records is shown</em>
          </span>
        </div>
        <div className="research-result">
          <span className="eyebrow">
            {selected ? "SELECTED SIMULATED DESIGN" : "NEAREST SIMULATED MATCH"}
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
                The 15-bit code is the dataset’s identifier for this geometry;
                it is not a drawing of the unit cell.
              </small>
              <p className="source-label">SIMULATED / UCI 2021</p>
            </>
          ) : (
            <p>
              {rows.length
                ? "No simulated designs meet both choices. Reduce the minimum blocked range or choose another center frequency."
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
