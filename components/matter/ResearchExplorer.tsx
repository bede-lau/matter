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
          <h2>Explore structures that filter vibration.</h2>
          <p>
            {rows.length ? rows.length.toLocaleString() : "Loading"} computer-tested
            designs ·{" "}
            <GlossaryText>2D elastodynamic metamaterials</GlossaryText>
          </p>
          <p className="research-intro">
            Each dot is one simulated repeating structure. Use the controls to
            describe the vibration range you want to block, then inspect the
            closest matching design.
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
          <div className="research-section-heading">
            <span className="eyebrow">YOUR SEARCH</span>
            <h3>Describe the vibration you want to block</h3>
            <p>Start with the middle of the range, then set its minimum width.</p>
          </div>
          <label>
            <span className="research-control-number">01</span>{" "}
            <GlossaryText>Target frequency</GlossaryText>{" "}
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
            <span className="research-control-number">02</span>{" "}
            <GlossaryText>Minimum blocked width</GlossaryText>{" "}
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
          <div className="research-definition">
            <strong><GlossaryText>Band gap</GlossaryText></strong>
            <p>
              A band gap is a frequency range that the repeating structure
              does not let through in this computer model.
            </p>
          </div>
          <small className="research-control-note">
            The search keeps designs whose blocked width meets your minimum,
            then sorts them by the closest center frequency. This dataset is
            separate from the 3D product lessons.
          </small>
        </div>
        <div className="research-plot">
          <div className="research-section-heading research-plot-heading">
            <span className="eyebrow">03 / READ THE MAP</span>
            <h3>Find the closest design</h3>
            <p>Look for the highlighted dot. Higher dots represent wider blocked ranges.</p>
          </div>
          <ResearchPlot
            sample={sample}
            target={target}
            width={width}
            best={best}
          />

          <span>
            Horizontal: middle frequency (Hz) · Vertical: blocked width (Hz)
            <em>One of every 21 records is shown</em>
          </span>
        </div>
        <div className="research-result">
          <span className="eyebrow">
            {selected ? "YOUR SELECTED DESIGN" : "CLOSEST MATCH"}
          </span>
          {best ? (
            <>
              <h3 className="research-result-heading">
                {selected ? "Design you selected" : "Best match for your search"}
              </h3>
              <h3>
                {best[1].toFixed(1)} <small>Hz center</small>
              </h3>
              <p>{best[2].toFixed(1)} Hz band-gap width</p>
              <p className="research-result-explanation">
                Its blocked range is at least your chosen width, and its center
                is closest to your target frequency.
              </p>
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
                This 15-bit code is only the dataset identifier for the design.
                It is not a drawing of the structure.
              </small>
              <p className="source-label">SIMULATED / UCI 2021</p>
            </>
          ) : (
            <p>
              {rows.length
                ? "No designs meet both choices. Try a smaller minimum width or another target frequency."
                : "Loading research data…"}
            </p>
          )}
        </div>
      </div>
      <div className="match-buttons">
        <div className="research-matches-heading">
          <span className="eyebrow">OTHER GOOD MATCHES</span>
          <p>Choose a result to compare it with the highlighted design.</p>
        </div>
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
