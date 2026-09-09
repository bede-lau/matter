"use client";
import { useState, useMemo, useRef } from "react";
import {
  Box,
  Layers3,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Scissors,
  Grid3X3,
  Upload,
  Download,
  ChevronRight,
  BookOpen,
  Activity,
  Check,
  Atom,
  X,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Choice, ExportMenu, ModeTabs } from "./ReuiControls";
import MiniLattice from "./MiniLattice";
import { GlossaryProvider, GlossaryText } from "./Glossary";
import { families, bases } from "@/lib/matter/catalog";
import Scene from "./Scene";
import ResearchExplorer from "./ResearchExplorer";
type RecordRow = {
  family: string;
  variant: string;
  material: string;
  cell_size_mm: number;
  strut_diameter_mm: number;
  density_kg_m3?: number;
  modulus_mpa?: number;
  source_url: string;
  evidence: string;
};
export default function Studio() {
  const [family, setFamily] = useState(0),
    [variant, setVariant] = useState(0),
    [tab, setTab] = useState("studio"),
    [query, setQuery] = useState(""),
    [base, setBase] = useState(0),
    [second, setSecond] = useState(1),
    [blend, setBlend] = useState(0),
    [count, setCount] = useState(3),
    [thick, setThick] = useState(0.8),
    [size, setSize] = useState(10),
    [play, setPlay] = useState(false),
    [mode, setMode] = useState("structure"),
    [wire, setWire] = useState(false),
    [section, setSection] = useState(false),
    [reset, setReset] = useState(0),
    [explode, setExplode] = useState(0),
    [showLabels, setShowLabels] = useState(true),
    [speed, setSpeed] = useState(1),
    [notice, setNotice] = useState(""),
    [records, setRecords] = useState<RecordRow[]>([]),
    [filter, setFilter] = useState("All structures");
  const file = useRef<HTMLInputElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const f = families[family];
  const familyFactor = [0.13, 0.16, 0.08, 0.1, 0.12, 0.14][family];
  const variantFactor = 1 + variant * 0.12;
  const density = Math.min(
    0.65,
    familyFactor *
      variantFactor *
      Math.pow(thick / 0.8, 1.6) *
      Math.pow(10 / size, 1.4),
  );
  const fraction = blend / 100;
  const upper = (1 - fraction) * bases[base].e + fraction * bases[second].e;
  const lower =
    1 / ((1 - fraction) / bases[base].e + fraction / bases[second].e);
  const estimated = upper * Math.pow(density, f.id === "octet" ? 1 : 2) * 0.3;
  const estimateLow = lower * Math.pow(density, f.id === "octet" ? 1 : 2) * 0.3;
  const choose = (i: number) => {
    setFamily(i);
    setVariant(0);
  };
  const catalog = useMemo(
    () =>
      families
        .map((v, i) => ({ ...v, index: i }))
        .filter(
          (v) =>
            (filter === "All structures" || v.category === filter) &&
            `${v.name} ${v.tag}`.toLowerCase().includes(query.toLowerCase()),
        ),
    [query, filter],
  );
  const download = (data: unknown, name: string) => {
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  const ingest = async (fl: File) => {
    try {
      if (fl.size > 20 * 1024 * 1024)
        throw Error("Please use a file smaller than 20 MB.");
      const text = await fl.text();
      let rows: RecordRow[];
      if (fl.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : parsed.records;
      } else {
        const parse = (s: string) => {
          const result: string[][] = [];
          let row: string[] = [],
            cell = "",
            quoted = false;
          for (let i = 0; i < s.length; i++) {
            const c = s[i];
            if (c === '"') {
              if (quoted && s[i + 1] === '"') {
                cell += '"';
                i++;
              } else quoted = !quoted;
            } else if (c === "," && !quoted) {
              row.push(cell);
              cell = "";
            } else if ((c === "\n" || c === "\r") && !quoted) {
              if (c === "\r" && s[i + 1] === "\n") i++;
              row.push(cell);
              if (row.some(Boolean)) result.push(row);
              row = [];
              cell = "";
            } else cell += c;
          }
          if (quoted) throw Error("CSV contains an unclosed quote.");
          row.push(cell);
          if (row.some(Boolean)) result.push(row);
          return result;
        };
        const [heads, ...vals] = parse(text);
        rows = vals.map(
          (row) =>
            Object.fromEntries(
              heads.map((h, i) => [h.trim(), row[i]?.trim()]),
            ) as unknown as RecordRow,
        );
      }
      if (!Array.isArray(rows) || !rows.length)
        throw Error("No records found. Use the sample schema.");
      if (rows.length + records.length > 50000)
        throw Error("Maximum 50,000 records per import.");
      rows = rows.map((r, i) => {
        for (const k of [
          "family",
          "variant",
          "material",
          "source_url",
          "evidence",
        ])
          if (!String(r[k as keyof RecordRow] ?? "").trim())
            throw Error(`Row ${i + 1}: missing ${k}.`);
        for (const k of ["cell_size_mm", "strut_diameter_mm"])
          if (
            !Number.isFinite(Number(r[k as keyof RecordRow])) ||
            Number(r[k as keyof RecordRow]) <= 0
          )
            throw Error(`Row ${i + 1}: ${k} must be a positive number.`);
        if (Number(r.strut_diameter_mm) >= Number(r.cell_size_mm))
          throw Error(
            `Row ${i + 1}: strut diameter must be smaller than cell size.`,
          );
        for (const k of ["density_kg_m3", "modulus_mpa"])
          if (
            r[k as keyof RecordRow] !== undefined &&
            r[k as keyof RecordRow] !== "" &&
            (!Number.isFinite(Number(r[k as keyof RecordRow])) ||
              Number(r[k as keyof RecordRow]) <= 0)
          )
            throw Error(`Row ${i + 1}: ${k} must be positive if supplied.`);
        if (!["measured", "simulated", "illustrative"].includes(r.evidence))
          throw Error(`Row ${i + 1}: invalid evidence label.`);
        if (!/^https?:\/\//.test(r.source_url))
          throw Error(`Row ${i + 1}: provide an HTTP source URL.`);
        return {
          ...r,
          cell_size_mm: Number(r.cell_size_mm),
          strut_diameter_mm: Number(r.strut_diameter_mm),
        };
      });
      setRecords((prev) => [...prev, ...rows]);
      setNotice(
        `${rows.length.toLocaleString()} records added. Stored for this session; export to keep your dataset.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Import failed.");
    }
    if (file.current) file.current.value = "";
  };
  return (
    <GlossaryProvider>
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Matter home">
            <span className="brand-symbol">
              <MiniLattice kind="octet" color="#c2ef72" logo />
            </span>
            matter<span className="brand-period">.</span>
          </a>
          <nav className="top-nav" aria-label="Main navigation">
            {[
              {
                id: "studio",
                label: "Material studio",
                icon: <Box size={16} />,
              },
              {
                id: "learn",
                label: "Field guide",
                icon: <BookOpen size={16} />,
              },
              {
                id: "data",
                label: "Research data",
                icon: <Activity size={16} />,
              },
            ].map((item) => (
              <button
                key={item.id}
                aria-current={tab === item.id ? "page" : undefined}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="edition">
            INTERACTIVE MATERIAL ATLAS <span>LAB / 01</span>
          </div>
        </header>
        <div className="workspace-heading">
          <div>
            <div className="eyebrow">
              EXPLORATION /{" "}
              {tab === "studio"
                ? "STRUCTURAL METAMATERIALS"
                : tab === "data"
                  ? "EVIDENCE & INPUTS"
                  : "FROM GEOMETRY TO BEHAVIOR"}
            </div>
            <h1>
              {tab === "studio"
                ? "Material studio"
                : tab === "data"
                  ? "Explore the evidence"
                  : "A field guide to extraordinary structures"}
            </h1>
            <p>
              {tab === "studio"
                ? "Choose a structure. Adjust its geometry. See where it could be used."
                : tab === "data"
                  ? "Combine material, geometry, and property records with their original sources."
                  : "Explore how repeating geometry changes the behavior of a material."}
            </p>
          </div>
          <ExportMenu
            experiment={() =>
              download(
                {
                  family: f.name,
                  variant: f.variants[variant],
                  material: bases[base].name,
                  secondary_material: bases[second].name,
                  secondary_volume_fraction: fraction,
                  solid_reuss_bound_mpa: lower,
                  solid_voigt_bound_mpa: upper,
                  cell_size_mm: size,
                  strut_diameter_mm: thick,
                  relative_density_estimate: density,
                  modulus_mpa_illustrative_lower: estimateLow,
                  modulus_mpa_illustrative_upper: estimated,
                  evidence: "illustrative",
                  source_url: f.source,
                },
                "matter-experiment.json",
              )
            }
            dataset={() => download(records, "matter-dataset.json")}
            guide={() => setTab("learn")}
          />
        </div>
        <div className="learning-hint">
          <BookOpen size={15} />
          <span>
            New to the terminology? <strong>Tap a dotted term</strong> or
            highlight a phrase for a quick definition.
          </span>
        </div>
        {tab === "studio" && (
          <div className="studio-grid">
            <aside className="catalog">
              <div className="panel-heading">
                <span>STRUCTURE LIBRARY</span>
                <span className="count">
                  {families.length.toString().padStart(2, "0")}
                </span>
              </div>
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Find a structure"
                  placeholder="Find a structure..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <Choice
                label="Filter structures"
                value={filter}
                onChange={setFilter}
                options={["All structures", "Mechanical", "Acoustic"].map(
                  (v) => ({ value: v, label: v }),
                )}
              />
              <div className="structure-list">
                {catalog.map((v) => (
                  <button
                    key={v.id}
                    className={
                      "structure-card " + (v.index === family ? "selected" : "")
                    }
                    onClick={() => choose(v.index)}
                  >
                    <span
                      className={"mini-structure mini-" + v.id}
                      style={{ color: v.color }}
                    >
                      <Box size={35} strokeWidth={1} />
                    </span>
                    <span>
                      <strong>{v.name}</strong>
                      <small>{v.tag}</small>
                    </span>
                    {v.index === family ? (
                      <span className="selected-dot" />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                ))}
                {catalog.length === 0 && (
                  <p className="empty">No matching structures.</p>
                )}
              </div>
              <div className="catalog-note">
                <BookOpen size={19} />
                <div>
                  <strong>Geometry is the ingredient.</strong>
                  <p>
                    Unusual behavior comes from architecture, not just
                    chemistry.
                  </p>
                  <button onClick={() => setTab("learn")}>
                    Explore the field guide <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </aside>
            <section className="middle">
              <div
                className="viewport"
                ref={viewport}
                id="material-scene"
                role="tabpanel"
                aria-labelledby={`material-scene-${mode}`}
              >
                <div className="viewport-heading">
                  <div>
                    <span className="eyebrow">
                      {f.category.toUpperCase()} /{" "}
                      {String(family + 1).padStart(2, "0")}
                    </span>
                    <h2>{f.variants[variant]}</h2>
                  </div>
                  <span className="live-label">
                    <span /> LIVE 3D
                  </span>
                </div>
                <Scene
                  kind={f.id}
                  variant={variant}
                  count={count}
                  thickness={(thick * 10) / size}
                  color={base === 0 ? f.color : bases[base].color}
                  playing={play}
                  mode={mode}
                  wire={wire}
                  section={section}
                  reset={reset}
                  explode={explode}
                  labels={showLabels}
                  speed={speed}
                />
                <div className="viewport-tag">
                  {mode === "application"
                    ? f.application + " · product anatomy"
                    : mode === "deform"
                      ? "Illustrative compression"
                      : "Periodic unit-cell architecture"}
                </div>
                <div className="view-tools">
                  <button
                    aria-label="Toggle wireframe"
                    aria-pressed={wire}
                    className={wire ? "on" : ""}
                    onClick={() => setWire(!wire)}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    aria-label="Toggle cutaway"
                    aria-pressed={section}
                    className={section ? "on" : ""}
                    onClick={() => setSection(!section)}
                  >
                    <Scissors size={18} />
                  </button>
                  <button
                    aria-label="Reset camera"
                    onClick={() => setReset(reset + 1)}
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    aria-label="Fullscreen visualization"
                    onClick={() => {
                      if (document.fullscreenElement) document.exitFullscreen();
                      else
                        viewport.current
                          ?.requestFullscreen()
                          .catch(() =>
                            setNotice(
                              "Fullscreen is unavailable in this browser.",
                            ),
                          );
                    }}
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
                <div className="viewport-bottom">
                  <button
                    className="play-button"
                    aria-label={play ? "Pause animation" : "Play animation"}
                    onClick={() => setPlay(!play)}
                  >
                    {play ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <span>
                    {play ? "Animation playing" : "Drag to orbit"} <em>·</em>{" "}
                    Scroll to zoom
                  </span>
                  <span className="axis-label">
                    Y ↑ <span>X ↗</span> Z ↘
                  </span>
                </div>
              </div>
              <div className="view-mode">
                <ModeTabs
                  value={mode}
                  onChange={(v) => {
                    setMode(v);
                    setPlay(v !== "structure");
                  }}
                  label="Visualization mode"
                  panelId="material-scene"
                  items={[
                    {
                      value: "structure",
                      label: "Structure",
                      icon: <Box size={16} />,
                    },
                    {
                      value: "deform",
                      label: "Behavior",
                      icon: <Activity size={16} />,
                    },
                    {
                      value: "application",
                      label: "In the real world",
                      icon: <Layers3 size={16} />,
                    },
                  ]}
                />
                <span>SCHEMATIC MOTION</span>
              </div>
              {mode === "application" && (
                <div className="application-controls">
                  <div>
                    <label>
                      Explode components <output>{explode}%</output>
                    </label>
                    <Slider
                      aria-label="Explode components"
                      min={0}
                      max={100}
                      step={5}
                      value={[explode]}
                      onValueChange={(v) => setExplode(v[0])}
                    />
                  </div>
                  <div>
                    <label>
                      Motion speed <output>{speed.toFixed(1)}×</output>
                    </label>
                    <Slider
                      aria-label="Motion speed"
                      min={0.3}
                      max={1.5}
                      step={0.1}
                      value={[speed]}
                      onValueChange={(v) => setSpeed(v[0])}
                    />
                  </div>
                  <button
                    className={"outline-button " + (showLabels ? "on" : "")}
                    aria-pressed={showLabels}
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    Component labels {showLabels ? "on" : "off"}
                  </button>
                </div>
              )}
              <div className="insight">
                <div className="insight-icon">
                  <Activity size={21} />
                </div>
                <div>
                  <span className="eyebrow">
                    {mode === "application"
                      ? "STRUCTURE → APPLICATION"
                      : "WHY IT WORKS"}
                  </span>
                  <h3>{mode === "application" ? f.application : f.tag}</h3>
                  <p>
                    <GlossaryText>
                      {mode === "application"
                        ? f.applicationLesson
                        : f.mechanism}
                    </GlossaryText>
                  </p>
                  {mode === "application" && (
                    <p className="variant-lesson">
                      <strong>{f.variants[variant]}</strong>{" "}
                      <GlossaryText>{f.variantLessons[variant]}</GlossaryText>
                    </p>
                  )}
                  {mode !== "structure" && (
                    <small>
                      Application geometry and motion are educational design
                      studies. Material performance has not been simulated or
                      certified.
                    </small>
                  )}
                </div>
                <button
                  aria-label="Read material guide"
                  onClick={() => setTab("learn")}
                >
                  <ArrowUpRight size={22} />
                </button>
              </div>
            </section>
            <aside className="parameters">
              <div className="panel-heading">
                <span>DESIGN PARAMETERS</span>
                <SlidersHorizontal size={16} />
              </div>
              <div className="control-block">
                <label>Structure variant</label>
                <div className="variant-buttons">
                  {f.variants.map((v, i) => (
                    <button
                      key={v}
                      className={i === variant ? "active" : ""}
                      onClick={() => setVariant(i)}
                    >
                      <span>0{i + 1}</span>
                      {v}
                      {i === variant && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control-block">
                <label htmlFor="material">Base material</label>
                <Choice
                  id="material"
                  label="Base material"
                  value={String(base)}
                  onChange={(v) => setBase(Number(v))}
                  options={bases.map((b, i) => ({
                    value: String(i),
                    label: b.name,
                  }))}
                />
                <span className="control-hint">
                  Illustrative base-material values
                </span>
              </div>
              <div className="control-block">
                <label htmlFor="secondary">
                  Secondary material <output>{blend}%</output>
                </label>
                <Choice
                  id="secondary"
                  label="Secondary material"
                  value={String(second)}
                  onChange={(v) => setSecond(Number(v))}
                  options={bases.map((b, i) => ({
                    value: String(i),
                    label: b.name,
                  }))}
                />
                <Slider
                  aria-label="Secondary material volume percent"
                  min={0}
                  max={100}
                  step={5}
                  value={[blend]}
                  onValueChange={(v) => setBlend(v[0])}
                  className="mt-4"
                />
                <span className="control-hint">
                  Ideal two-phase mixture; manufacturability is not evaluated.
                </span>
              </div>
              <div className="control-block">
                <label>
                  <GlossaryText>Cell size</GlossaryText>{" "}
                  <output>
                    {size.toFixed(1)} <span>mm</span>
                  </output>
                </label>
                <Slider
                  aria-label="Cell size"
                  min={5}
                  max={20}
                  step={0.5}
                  value={[size]}
                  onValueChange={(v) => setSize(v[0])}
                />
                <div className="range-ends">
                  <span>5 mm</span>
                  <span>20 mm</span>
                </div>
              </div>
              <div className="control-block">
                <label>
                  <GlossaryText>
                    {f.id === "gyroid" ? "Wall thickness" : "Strut diameter"}
                  </GlossaryText>
                  <output>
                    {thick.toFixed(2)} <span>mm</span>
                  </output>
                </label>
                <Slider
                  aria-label="Thickness"
                  min={0.3}
                  max={1.6}
                  step={0.05}
                  value={[thick]}
                  onValueChange={(v) => setThick(v[0])}
                />
                <div className="range-ends">
                  <span>0.3 mm</span>
                  <span>1.6 mm</span>
                </div>
              </div>
              <div className="control-block">
                <label>
                  Repetition{" "}
                  <output>
                    {count} × {count} × {count}
                  </output>
                </label>
                <Slider
                  aria-label="Repetition"
                  min={1}
                  max={5}
                  step={1}
                  value={[count]}
                  onValueChange={(v) => setCount(v[0])}
                />
              </div>
              <div className="property-card">
                <div className="eyebrow">EXPLORATORY ESTIMATES</div>
                <div>
                  <span>
                    <GlossaryText>Relative density</GlossaryText>
                  </span>
                  <strong>
                    {(density * 100).toFixed(1)}
                    <small>%</small>
                  </strong>
                </div>
                <div>
                  <span>
                    <GlossaryText>Modulus range</GlossaryText>
                  </span>
                  <strong>
                    {estimateLow.toFixed(2)}–
                    {estimated < 10
                      ? estimated.toFixed(2)
                      : Math.round(estimated).toLocaleString()}
                    <small>MPa</small>
                  </strong>
                </div>
                <p>
                  Ideal solid bounds: {lower.toFixed(0)}–{upper.toFixed(0)} MPa
                  (Reuss–Voigt). Lattice estimate uses an illustrative scaling
                  law, not geometry-derived density or a solver.
                </p>
              </div>
              <button
                className="reset-button"
                onClick={() => {
                  setSize(10);
                  setThick(0.8);
                  setCount(3);
                  setBase(0);
                  setBlend(0);
                  setSecond(1);
                  setVariant(0);
                  setWire(false);
                  setSection(false);
                  setReset(reset + 1);
                }}
              >
                <RotateCcw size={14} /> Reset parameters
              </button>
            </aside>
          </div>
        )}
        {tab === "learn" && (
          <section className="guide-grid" aria-label="Structure field guide">
            {families.map((v, i) => (
              <article
                className="guide-card"
                key={v.id}
                style={{ "--family-color": v.color } as React.CSSProperties}
              >
                <div className="guide-visual">
                  <MiniLattice kind={v.id} color={v.color} />
                  <span className="guide-category">
                    0{i + 1} / {v.category}
                  </span>
                  <span className="orbit-hint">
                    <RotateCcw size={13} /> Drag to explore
                  </span>
                </div>
                <div className="guide-copy">
                  <div className="guide-title">
                    <h2>{v.name}</h2>
                    <span className="tag">{v.tag}</span>
                  </div>
                  <p className="guide-lead">
                    <GlossaryText>
                      {
                        [
                          "A flowing, curved surface that spreads forces through a connected network.",
                          "A framework of triangles that makes a structure stiff while keeping it light.",
                          "Inward-folded cells that can grow wider when you pull them longer.",
                          "A foam-like network of cells that can compress to absorb an impact.",
                          "Repeated hexagons that support a surface with very little solid material.",
                          "Small masses on flexible links that respond to particular vibration frequencies.",
                        ][i]
                      }
                    </GlossaryText>
                  </p>
                  <div className="guide-application">
                    <Layers3 size={17} />
                    <span>
                      See it in use<strong>{v.application}</strong>
                    </span>
                  </div>
                  <details className="guide-details">
                    <summary>
                      Origin & how it works <ChevronRight size={15} />
                    </summary>
                    <h3>Where it comes from</h3>
                    <p>
                      <GlossaryText>{v.origin}</GlossaryText>
                    </p>
                    <h3>What the geometry does</h3>
                    <p>
                      <GlossaryText>{v.mechanism}</GlossaryText>
                    </p>
                    <a href={v.source} target="_blank" rel="noreferrer">
                      Read the original source ↗
                    </a>
                  </details>
                  <div className="guide-variants">
                    <span>Explore a variant</span>
                    <div>
                      {v.variants.map((name, j) => (
                        <button
                          key={name}
                          onClick={() => {
                            choose(i);
                            setVariant(j);
                            setMode("structure");
                            setPlay(false);
                            setTab("studio");
                          }}
                        >
                          {name}
                          <ChevronRight size={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="guide-cta"
                    onClick={() => {
                      choose(i);
                      setMode("application");
                      setPlay(true);
                      setTab("studio");
                    }}
                  >
                    See the application <ArrowUpRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
        {tab === "data" && (
          <section className="dataset-section">
            <ResearchExplorer />
            <div className="dataset-intro">
              <div>
                <Upload size={30} />
                <h2>One schema. Multiple inputs.</h2>
                <p>
                  Import CSV or JSON with geometry, composition, properties, and
                  provenance. Evidence labels remain attached to every record.
                </p>
                <button
                  className="primary-button"
                  onClick={() => file.current?.click()}
                >
                  <Upload size={16} /> Import dataset
                </button>
                <input
                  type="file"
                  accept=".csv,.json"
                  ref={file}
                  hidden
                  onChange={(e) =>
                    e.target.files?.[0] && ingest(e.target.files[0])
                  }
                />
                <button
                  className="outline-button"
                  onClick={() =>
                    download(
                      [
                        {
                          family: "Gyroid",
                          variant: "Sheet gyroid",
                          material: "TPU",
                          cell_size_mm: 10,
                          strut_diameter_mm: 0.8,
                          source_url: families[0].source,
                          evidence: "illustrative",
                        },
                      ],
                      "matter-dataset-template.json",
                    )
                  }
                >
                  Download sample
                </button>
                <small>
                  Up to 20 MB / 50,000 rows · Session storage · No automatic
                  scientific validation
                </small>
              </div>
              <div>
                <span className="eyebrow">REQUIRED FIELDS</span>
                <code>
                  family · variant · material
                  <br />
                  cell_size_mm · strut_diameter_mm
                  <br />
                  source_url · evidence
                </code>
                <p>
                  Evidence: measured, simulated, or illustrative.
                  <br />
                  Optional: density_kg_m3, modulus_mpa.
                </p>
                <a href="/data/research.json" target="_blank">
                  Open source research catalog ↗
                </a>
              </div>
            </div>
            <div className="dataset-table-heading">
              <h2>{records.length.toLocaleString()} imported records</h2>
              {records.length > 0 && (
                <button
                  className="outline-button"
                  onClick={() => download(records, "matter-dataset.json")}
                >
                  <Download size={16} /> Export records
                </button>
              )}
            </div>
            {records.length === 0 ? (
              <div className="empty-state">
                <Layers3 size={30} />
                <h3>Your evidence belongs here.</h3>
                <p>
                  Start with the sample file or import your own source-backed
                  dataset.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Family / variant</th>
                      <th>Material</th>
                      <th>Cell / strut</th>
                      <th>Evidence</th>
                      <th>Source</th>
                      <th>Explore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 100).map((r, i) => (
                      <tr key={i}>
                        <td>
                          {r.family}
                          <small>{r.variant}</small>
                        </td>
                        <td>{r.material}</td>
                        <td>
                          {r.cell_size_mm} / {r.strut_diameter_mm} mm
                        </td>
                        <td>{r.evidence}</td>
                        <td>
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Original source ↗
                          </a>
                        </td>
                        <td>
                          {families.some(
                            (f) =>
                              f.name.toLowerCase() === r.family.toLowerCase(),
                          ) ? (
                            <button
                              className="outline-button"
                              onClick={() => {
                                const index = families.findIndex(
                                  (f) =>
                                    f.name.toLowerCase() ===
                                    r.family.toLowerCase(),
                                );
                                choose(index);
                                setSize(
                                  Math.max(5, Math.min(20, r.cell_size_mm)),
                                );
                                setThick(
                                  Math.max(
                                    0.3,
                                    Math.min(1.6, r.strut_diameter_mm),
                                  ),
                                );
                                const vi = families[index].variants.findIndex(
                                  (v) =>
                                    v.toLowerCase() === r.variant.toLowerCase(),
                                );
                                setVariant(Math.max(0, vi));
                                const bi = bases.findIndex((b) =>
                                  b.name
                                    .toLowerCase()
                                    .includes(r.material.toLowerCase()),
                                );
                                setBase(Math.max(0, bi));
                                setTab("studio");
                                setNotice(
                                  "Geometry opened within supported slider ranges. Imported measured properties are not used to calibrate the illustrative model.",
                                );
                              }}
                            >
                              View 3D
                            </button>
                          ) : (
                            <small>No 3D mapping</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {records.length > 100 && (
                  <p>
                    Showing the first 100 records. Export includes all{" "}
                    {records.length} records.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
        <footer>
          <span>MATTER / AN OPEN EXPLORATION OF ENGINEERED MATERIALS</span>
          <span>
            Geometry-driven learning <span className="footer-dot">·</span>{" "}
            Sources, not certainty
          </span>
        </footer>
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
      </main>
    </GlossaryProvider>
  );
}
