"use client";
import { useState, useMemo, useRef } from "react";
import {
  Box,
  Layers3,
  ArrowUpRight,
  Search,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Scissors,
  Grid3X3,
  Upload,
  Download,
  ChevronDown,
  BookOpen,
  Activity,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Choice, ExportMenu, ModeTabs } from "./ReuiControls";
import MiniLattice from "./MiniLattice";
import { GlossaryProvider, GlossaryText } from "./Glossary";
import { families, bases } from "@/lib/matter/catalog";
import { structureCards } from "@/lib/matter/learning";
import Scene from "./Scene";
import ResearchExplorer from "./ResearchExplorer";
import FieldGuide from "./FieldGuide";
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

const withoutTeachingLabel = (copy: string) =>
  copy.replace(/^(Purpose|Structure|Behavior):\s*/i, "");

// These field-based devices use different units and design levers from the
// mechanical lattices. Only expose controls that alter the model on screen.
const specialisedParameterLabels: Record<
  string,
  { thickness: string; count: string }
> = {
  metalens: { thickness: "Post height", count: "Post density" },
  cloak: { thickness: "Trace width", count: "Ring count" },
  "membrane-absorber": {
    thickness: "Membrane thickness",
    count: "Membrane cells",
  },
  "thermal-cloak": { thickness: "Layer spacing", count: "Layer count" },
  topological: { thickness: "Post diameter", count: "Post density" },
  flux: { thickness: "Funnel opening", count: "Funnel layers" },
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
    [playNonce, setPlayNonce] = useState(0),
    [mode, setMode] = useState("structure"),
    [wire, setWire] = useState(false),
    [section, setSection] = useState(false),
    [reset, setReset] = useState(0),
    [explode, setExplode] = useState(0),
    [showLabels, setShowLabels] = useState(true),
    [speed, setSpeed] = useState(1),
    [notice, setNotice] = useState(""),
    [records, setRecords] = useState<RecordRow[]>([]),
    [filter, setFilter] = useState("All structures"),
    [structurePickerOpen, setStructurePickerOpen] = useState(false);
  const [sceneParameters, setSceneParameters] = useState({
    blend: 0,
    count: 3,
    thick: 0.8,
    size: 10,
  });
  const file = useRef<HTMLInputElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const f = families[family];
  const specialisedParameters = specialisedParameterLabels[f.id];
  const allowedBase = f.allowedBase ?? bases.map((_, index) => index);
  const allowedSecondary = f.allowedSecondary ?? bases.map((_, index) => index);
  const hasSecondary = allowedSecondary.length > 0;
  const activeReference = structureCards.find((card) => card.id === f.id);
  const familyFactor = [0.13, 0.16, 0.08, 0.1, 0.12, 0.14][family] ?? 0.12;
  const isMechanical = f.category === "Mechanical";
  const metricLabel = isMechanical
    ? "Illustrative lattice stiffness"
    : "Qualitative response index";
  const metricUnit = isMechanical ? "MPa" : "/ 5";
  const variantFactor = 1 + variant * 0.12;
  const density = Math.min(
    0.65,
    familyFactor *
      variantFactor *
      Math.pow(thick / 0.8, 1.6) *
      Math.pow(specialisedParameters ? 1 : 10 / size, 1.4),
  );
  const fraction = blend / 100;
  const upper = (1 - fraction) * bases[base].e + fraction * bases[second].e;
  const lower =
    1 / ((1 - fraction) / bases[base].e + fraction / bases[second].e);
  const estimated = upper * Math.pow(density, f.id === "octet" ? 1 : 2) * 0.3;
  const estimateLow = lower * Math.pow(density, f.id === "octet" ? 1 : 2) * 0.3;
  const baseMaterial = bases[base];
  const secondaryMaterial = bases[second];
  const chooseBase = (index: number) => {
    setBase(index);
    if (hasSecondary && index === second)
      setSecond(allowedSecondary.find((candidate) => candidate !== index) ?? second);
  };
  const chooseSecondary = (index: number) => {
    setSecond(index);
    if (index === base)
      setBase(allowedBase.find((candidate) => candidate !== index) ?? base);
  };
  const choose = (i: number) => {
    setFamily(i);
    setVariant(0);
    const nextFamily = families[i];
    const nextBase = nextFamily.defaultBase ?? 0;
    const nextSecond = nextFamily.defaultSecondary ?? 1;
    const nextBlend = nextFamily.secondaryRequired ? 35 : 0;
    setBase(nextBase);
    setSecond(nextSecond);
    setBlend(nextBlend);
    setSceneParameters((current) => ({ ...current, blend: nextBlend }));
    setStructurePickerOpen(false);
  };
  const startAnimation = () => {
    setPlay(true);
    // A new run recreates application motion, including the Kelvin impact path.
    setPlayNonce((value) => value + 1);
  };
  const resetParameters = () => {
    const next = { blend: 0, count: 3, thick: 0.8, size: 10 };
    setSize(next.size);
    setThick(next.thick);
    setCount(next.count);
    setBase(f.defaultBase ?? 0);
    setBlend(f.secondaryRequired ? 35 : next.blend);
    setSecond(f.defaultSecondary ?? 1);
    setVariant(0);
    setWire(false);
    setSection(false);
    setSceneParameters({ ...next, blend: f.secondaryRequired ? 35 : 0 });
    setReset((value) => value + 1);
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
  const filterOptions = useMemo(
    () => ["All structures", ...Array.from(new Set(families.map((v) => v.category)))],
    [],
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
        {tab !== "learn" && <div className="workspace-heading">
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
                  : "A field guide to designed structures"}
            </h1>
            <p>
              {tab === "studio"
                ? "Choose what it is made from. Change the repeating cell. Then connect that behavior to a possible use."
                : tab === "data"
                  ? "Explore source-backed measurements and simulations while keeping evidence labels attached to every result."
                  : "Explore one structure at a time, from a real reference to a live 3D lesson."}
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
        </div>}
        {tab !== "learn" && <div className="learning-hint">
          <BookOpen size={15} />
          <span>
            New here? <strong>Tap a dotted term</strong> or highlight any
            phrase for a short, plain-language explanation.
          </span>
        </div>}
        {tab === "studio" && (
          <section className="studio-workbench">
            <div className="studio-toolbar">
              <Dialog
                open={structurePickerOpen}
                onOpenChange={setStructurePickerOpen}
              >
                <DialogTrigger asChild>
                  <button className="structure-picker-trigger">
                    <span className="structure-picker-trigger__image" aria-hidden="true">
                      {activeReference && (
                        <img
                          src={activeReference.image}
                          alt=""
                          width={40}
                          height={40}
                          decoding="async"
                        />
                      )}
                    </span>
                    <span className="structure-picker-trigger__copy">
                      <span>Structure library</span>
                      <strong>{f.name}</strong>
                    </span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </button>
                </DialogTrigger>
                <DialogContent className="structure-picker-dialog">
                  <DialogHeader>
                    <span className="eyebrow">STRUCTURE LIBRARY</span>
                    <DialogTitle>Choose a repeating structure</DialogTitle>
                    <DialogDescription>
                      Select a structure, then tune its material and geometry in
                      the workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="structure-picker-filters">
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Find a structure"
                        placeholder="Find a structure..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                      />
                    </label>
                    <Choice
                      label="Filter structures"
                      value={filter}
                      onChange={setFilter}
                      options={filterOptions.map((v) => ({ value: v, label: v }))}
                    />
                  </div>
                  <div className="structure-picker-grid">
                    {catalog.map((v) => {
                      const reference = structureCards.find((card) => card.id === v.id);
                      const selected = v.index === family;
                      return (
                        <button
                          key={v.id}
                          className={
                            "structure-picker-card " + (selected ? "selected" : "")
                          }
                          aria-pressed={selected}
                          onClick={() => choose(v.index)}
                        >
                          <span className="structure-picker-card__image" aria-hidden="true">
                            {reference && (
                              <img
                                src={reference.image}
                                alt=""
                                width={104}
                                height={78}
                                loading={selected ? "eager" : "lazy"}
                                decoding="async"
                              />
                            )}
                          </span>
                          <span className="structure-picker-card__copy">
                            <strong>{v.name}</strong>
                            <small>{v.tag}</small>
                          </span>
                          {selected && <Check size={16} aria-label="Selected" />}
                        </button>
                      );
                    })}
                    {catalog.length === 0 && (
                      <p className="empty">No matching structures.</p>
                    )}
                  </div>
                  <div className="structure-picker-note">
                    <BookOpen size={17} />
                    <span>
                      Need the plain-language version? The Field Guide explains
                      each structure from material to real-world use.
                    </span>
                    <button
                      onClick={() => {
                        setStructurePickerOpen(false);
                        setTab("learn");
                      }}
                    >
                      Open Field Guide <ArrowUpRight size={15} />
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="studio-toolbar__summary" aria-live="polite">
                <span>{f.category}</span>
                <strong>{f.variants[variant]}</strong>
                <small>{f.tag}</small>
              </div>
            </div>
            <div className="studio-grid">
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
                  count={sceneParameters.count}
                  thickness={
                    specialisedParameters
                      ? sceneParameters.thick
                      : (sceneParameters.thick * 10) / sceneParameters.size
                  }
                  color={baseMaterial.color}
                  secondaryColor={secondaryMaterial.color}
                  blend={sceneParameters.blend / 100}
                  playing={play}
                  mode={mode}
                  wire={wire}
                  section={section}
                  reset={reset}
                  explode={explode}
                  labels={showLabels}
                  speed={speed}
                  playNonce={playNonce}
                />
                <div className="viewport-meta">
                  <div className="viewport-tag">
                    {mode === "application"
                      ? f.application + " · product anatomy"
                      : mode === "deform"
                        ? "Illustrative behavior"
                        : "Periodic unit-cell architecture"}
                  </div>
                  <div className="material-phase-key" aria-live="polite">
                    <span className="phase-key-item">
                      <i style={{ backgroundColor: baseMaterial.color }} />
                      Base · {baseMaterial.name} <strong>{100 - blend}%</strong>
                    </span>
                    {blend > 0 && (
                      <>
                        <ArrowRight size={14} aria-hidden="true" />
                        <span className="phase-key-item">
                          <i style={{ backgroundColor: secondaryMaterial.color }} />
                          Secondary · {secondaryMaterial.name}{" "}
                          <strong>{blend}%</strong>
                        </span>
                      </>
                    )}
                  </div>
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
                    onClick={() => (play ? setPlay(false) : startAnimation())}
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
                    if (v === "structure") setPlay(false);
                    else if (v === "application") startAnimation();
                    else setPlay(true);
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
                  {!specialisedParameters && (
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
                  )}
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
              <div className={`insight insight--${mode}`}>
                <div className="insight-icon">
                  {mode === "structure" ? (
                    <Box size={21} />
                  ) : mode === "application" ? (
                    <Layers3 size={21} />
                  ) : (
                    <Activity size={21} />
                  )}
                </div>
                <div className="insight-copy">
                  {mode === "structure" && (
                    <>
                      <span className="eyebrow">STRUCTURE AT A GLANCE</span>
                      <h3>{baseMaterial.name} + {f.name}</h3>
                      <div className="insight-points">
                        <div>
                          <span>Purpose</span>
                          <p>
                            <GlossaryText>
                              {withoutTeachingLabel(f.origin)}
                            </GlossaryText>
                          </p>
                        </div>
                        <div>
                          <span>Structure</span>
                          <p>
                            <GlossaryText>
                              {withoutTeachingLabel(f.mechanism)}
                            </GlossaryText>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {mode === "deform" && (
                    <>
                      <span className="eyebrow">BEHAVIOR</span>
                      <h3>{f.tag}</h3>
                      <p>
                        <GlossaryText>
                          {withoutTeachingLabel(f.behavior)}
                        </GlossaryText>
                      </p>
                      <p className="variant-lesson">
                        <strong>This variant</strong>{" "}
                        <GlossaryText>{f.variantLessons[variant]}</GlossaryText>
                      </p>
                    </>
                  )}
                  {mode === "application" && (
                    <>
                      <span className="eyebrow">IN THE REAL WORLD</span>
                      <h3>{f.application}</h3>
                      <div className="insight-points">
                        <div>
                          <span>How it is used</span>
                          <p><GlossaryText>{f.applicationLesson}</GlossaryText></p>
                        </div>
                        <div>
                          <span>Why it helps</span>
                          <p><GlossaryText>{f.applicationWhy}</GlossaryText></p>
                        </div>
                      </div>
                    </>
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
            <aside className="parameters design-dock">
              <div className="panel-heading">
                <span>DESIGN PARAMETERS</span>
                <button
                  className="compact-reset"
                  aria-label="Reset parameters"
                  onClick={resetParameters}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
              <div className="control-block compact-variant">
                <label>
                  Structure variant
                  <output>{String(variant + 1).padStart(2, "0")}</output>
                </label>
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
              <div className="material-controls">
                <div className="compact-material-choice">
                  <label htmlFor="material">Base material</label>
                  <Choice
                    id="material"
                    label="Base material"
                    value={String(base)}
                    onChange={(v) => chooseBase(Number(v))}
                    options={allowedBase.map((i) => ({
                      value: String(i),
                      label: bases[i].name,
                    }))}
                  />
                </div>
                {hasSecondary ? (
                  <>
                    <div className="compact-material-choice">
                      <label htmlFor="secondary">
                        <GlossaryText>{f.secondaryRole ?? "Secondary material"}</GlossaryText>
                        <output>{blend}%</output>
                      </label>
                      <Choice
                        id="secondary"
                        label={f.secondaryRole ?? "Secondary material"}
                        value={String(second)}
                        onChange={(v) => chooseSecondary(Number(v))}
                        options={allowedSecondary
                          .filter((index) => index !== base)
                          .map((i) => ({ value: String(i), label: bases[i].name }))}
                      />
                    </div>
                    <div className="phase-meter">
                      <div>
                        <span>
                          <i style={{ backgroundColor: baseMaterial.color }} />
                          {baseMaterial.name}
                        </span>
                        <strong>{100 - blend}%</strong>
                      </div>
                      <div>
                        <span>
                          <i style={{ backgroundColor: secondaryMaterial.color }} />
                          {secondaryMaterial.name}
                        </span>
                        <strong>{blend}%</strong>
                      </div>
                      <div className="blend-bar" aria-hidden="true">
                        <span
                          style={{
                            width: `${100 - blend}%`,
                            backgroundColor: baseMaterial.color,
                          }}
                        />
                        <span
                          style={{
                            width: `${blend}%`,
                            backgroundColor: secondaryMaterial.color,
                          }}
                        />
                      </div>
                      <Slider
                        aria-label={`${f.secondaryRole ?? "Secondary material"} share`}
                        min={0}
                        max={100}
                        step={5}
                        value={[blend]}
                        onValueChange={(v) => setBlend(v[0])}
                        onValueCommit={(v) =>
                          setSceneParameters((current) => ({
                            ...current,
                            blend: v[0],
                          }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <p className="material-compatibility-note">{f.materialNote}</p>
                )}
                {hasSecondary && (
                  <p className="material-compatibility-note">{f.materialNote}</p>
                )}
              </div>
              <div className={`geometry-grid${specialisedParameters ? " geometry-grid--specialised" : ""}`}>
                {!specialisedParameters && (
                  <div className="control-block compact-range">
                    <label>
                      <GlossaryText>Cell size</GlossaryText>
                      <output>{size.toFixed(1)} mm</output>
                    </label>
                    <Slider
                      aria-label="Cell size"
                      min={5}
                      max={20}
                      step={0.5}
                      value={[size]}
                      onValueChange={(v) => setSize(v[0])}
                      onValueCommit={(v) =>
                        setSceneParameters((current) => ({
                          ...current,
                          size: v[0],
                        }))
                      }
                    />
                  </div>
                )}
                <div className="control-block compact-range">
                  <label>
                    <GlossaryText>
                      {specialisedParameters?.thickness ?? (isMechanical
                        ? f.id === "gyroid"
                          ? "Wall thickness"
                          : "Strut diameter"
                        : f.category === "Thermal"
                          ? "Layer thickness"
                          : "Element thickness")}
                    </GlossaryText>
                    <output>{thick.toFixed(2)} mm</output>
                  </label>
                  <Slider
                    aria-label="Thickness"
                    min={0.3}
                    max={1.6}
                    step={0.05}
                    value={[thick]}
                    onValueChange={(v) => setThick(v[0])}
                    onValueCommit={(v) =>
                      setSceneParameters((current) => ({
                        ...current,
                        thick: v[0],
                      }))
                    }
                  />
                </div>
                <div className="control-block compact-range">
                  <label>
                    {specialisedParameters?.count ?? "Repetition"}
                    <output>
                      {specialisedParameters ? count : `${count} × ${count} × ${count}`}
                    </output>
                  </label>
                  <Slider
                    aria-label="Repetition"
                    min={1}
                    max={5}
                    step={1}
                    value={[count]}
                    onValueChange={(v) => setCount(v[0])}
                    onValueCommit={(v) =>
                      setSceneParameters((current) => ({
                        ...current,
                        count: v[0],
                      }))
                    }
                  />
                </div>
              </div>
              <div className="property-card compact-properties">
                <div className="eyebrow">ILLUSTRATIVE TEACHING ESTIMATES</div>
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
                    <GlossaryText>{metricLabel}</GlossaryText>
                  </span>
                  <strong>
                    {isMechanical
                      ? `${estimateLow.toFixed(2)}–${
                          estimated < 10
                            ? estimated.toFixed(2)
                            : Math.round(estimated).toLocaleString()
                        }`
                      : `${Math.min(5, 1.2 + density * 4.2 + variant * 0.35).toFixed(1)}`}
                    <small>{metricUnit}</small>
                  </strong>
                </div>
              </div>
            </aside>
          </div>
          </section>
        )}
        {tab === "learn" && (
          <FieldGuide
            onOpenStudio={(familyIndex, variantIndex, nextMode) => {
              choose(familyIndex);
              setVariant(variantIndex);
              setMode(nextMode);
              if (nextMode === "application") startAnimation();
              else setPlay(false);
              setTab("studio");
            }}
          />
        )}
        {tab === "data" && (
          <section className="dataset-section">
            <ResearchExplorer />
            <div className="dataset-intro">
              <div>
                <Upload size={30} />
                <h2>Bring in evidence without losing its meaning.</h2>
                <p>
                  Import geometry, material, property, source, and evidence
                  fields together. A measured value should never be displayed
                  as if it were a teaching estimate.
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
