"use client";
import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
type Row = [string, number, number];
export default function ResearchExplorer() {
  const [rows, setRows] = useState<Row[]>([]),
    [target, setTarget] = useState(600),
    [width, setWidth] = useState(50),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Row | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/data/elastodynamic.json")
      .then((r) => {
        if (!r.ok) throw Error("Dataset could not load.");
        return r.json() as Promise<{ rows: Row[] }>;
      })
      .then((d) => {
        if (active) setRows(d.rows);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, []);
  const matches = useMemo(
    () =>
      rows
        .filter((r) => r[2] >= width)
        .sort((a, b) => Math.abs(a[1] - target) - Math.abs(b[1] - target)),
    [rows, target, width],
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
            designs · 2D elastodynamic metamaterials
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
      <div className="research-body">
        <div className="research-controls">
          <label>
            Target band-gap center <strong>{target} Hz</strong>
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
            Minimum band-gap width <strong>{width} Hz</strong>
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
            A band gap is a frequency interval where waves cannot propagate
            through an ideal infinite periodic structure in the modeled
            conditions.
          </p>
          <small>
            Finds the closest center among records meeting your width threshold.
            These data are separate from the 3D mechanical catalog.
          </small>
        </div>
        <div className="research-plot">
          <svg
            viewBox="0 0 560 250"
            role="img"
            aria-label="Sample of dataset band-gap center versus width"
          >
            <path d="M45 15V212H540" fill="none" stroke="#566675" />
            {[0, 500, 1000, 1500, 2000].map((v) => (
              <g key={v}>
                <path d={`M${45 + (v / 2000) * 475} 15V212`} stroke="#293843" />
                <text
                  x={45 + (v / 2000) * 475}
                  y="235"
                  fill="#9eb0bd"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {v}
                </text>
              </g>
            ))}
            {[0, 250, 500].map((v) => (
              <text
                key={v}
                x="36"
                y={215 - (v / 500) * 190}
                fill="#9eb0bd"
                fontSize="12"
                textAnchor="end"
              >
                {v}
              </text>
            ))}
            {sample
              .filter((r) => r[1] <= 2000 && r[2] <= 500)
              .map((r, i) => (
                <circle
                  key={i}
                  cx={45 + (r[1] / 2000) * 475}
                  cy={212 - (r[2] / 500) * 190}
                  r="2"
                  fill={r[2] >= width ? "#a7d866" : "#4d606f"}
                  opacity=".55"
                />
              ))}
            <path
              d={`M${45 + (target / 2000) * 475} 15V212`}
              stroke="#e7f4d4"
              strokeDasharray="4 4"
            />
            {best && best[1] <= 2000 && best[2] <= 500 && (
              <circle
                cx={45 + (best[1] / 2000) * 475}
                cy={212 - (best[2] / 500) * 190}
                r="6"
                fill="#fff"
                stroke="#c2ef72"
                strokeWidth="3"
              />
            )}
          </svg>
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
            <p>No designs meet this threshold.</p>
          )}
        </div>
      </div>
      <div className="match-buttons">
        {matches.slice(0, 5).map((r) => (
          <button key={r[0]} onClick={() => setSelected(r)}>
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
