export type SpecialisedControl = {
  thickness: string;
  count: string;
  thicknessValue?: (value: number) => string;
  countValue?: (value: number) => string;
};

const normalized = (value: number) =>
  Math.max(0, Math.min(1, (value - 0.3) / 1.3));
const count = (value: number) =>
  Math.max(1, Math.min(5, Math.round(value)));
const percent = (value: number) =>
  `${Math.round(normalized(value) * 100)}% of illustrated range`;

export const mechanicalControls: Record<string, SpecialisedControl> = {
  pentamode: {
    thickness: "Neck radius",
    count: "Cells across",
    thicknessValue: (value) => `${(2 + normalized(value) * 5).toFixed(1)}% of cell`,
    countValue: (value) => `${count(value) + 1} cells`,
  },
  "rotating-squares": {
    thickness: "Hinge width",
    count: "Tiles across",
    thicknessValue: (value) => `${(3 + normalized(value) * 4).toFixed(1)}% of tile`,
    countValue: (value) => `${count(value) + 1} tiles`,
  },
  "chiral-honeycomb": {
    thickness: "Ligament gauge",
    count: "Rings across",
    thicknessValue: (value) => `${(2 + normalized(value) * 3).toFixed(1)}% of pitch`,
    countValue: (value) => `${count(value) + 1} rings`,
  },
  "miura-origami": {
    thickness: "Crease gauge",
    count: "Facet rows",
    thicknessValue: (value) => `${(1 + normalized(value) * 2).toFixed(1)}% of edge`,
    countValue: (value) => `${count(value) + 1} rows`,
  },
  kirigami: {
    thickness: "Ribbon gauge",
    count: "Cut ribbons",
    thicknessValue: (value) => `${(1 + normalized(value) * 2).toFixed(1)}% of width`,
    countValue: (value) => `${count(value) + 2} ribbons`,
  },
  "bistable-beam": {
    thickness: "Beam gauge",
    count: "Arch lanes",
    thicknessValue: (value) => `${(1 + normalized(value) * 2).toFixed(1)}% of span`,
    countValue: (value) => `${count(value)} lanes`,
  },
  tensegrity: {
    thickness: "Strut diameter",
    count: "Prism modules",
    thicknessValue: (value) => `${(9 + normalized(value) * 7).toFixed(1)}% of radius`,
    countValue: (value) => `${count(value)} modules`,
  },
  "spinodal-shell": {
    thickness: "Shell gauge",
    count: "Disorder frequency",
    thicknessValue: (value) => `${Math.round(normalized(value) * 100)}% of illustrated range`,
    countValue: (value) => `${(2.8 + (count(value) - 1) * 0.65).toFixed(2)} relative frequency`,
  },
  chainmail: {
    thickness: "Wire radius",
    count: "Links across",
    thicknessValue: (value) => `${(5 + normalized(value) * 4).toFixed(1)}% of link radius`,
    countValue: (value) => `${count(value) + 1} links`,
  },
  "thermal-expansion": {
    thickness: "Laminate gauge",
    count: "Bonded strips",
    thicknessValue: (value) => `${(1 + normalized(value) * 2).toFixed(1)}% of length`,
    countValue: (value) => `${count(value)} strips`,
  },
};

export const opticalControls: Record<string, SpecialisedControl> = {
  "negative-index": { thickness: "Copper trace width", count: "Cells along beam", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 2} cells` },
  "epsilon-near-zero": { thickness: "Channel height", count: "Channel sections", thicknessValue: percent, countValue: (value) => `${Math.round(value)} sections` },
  "photonic-bandgap": { thickness: "Pillar diameter", count: "Crystal rows", thicknessValue: percent, countValue: (value) => `${2 * Math.round(value) + 3} × ${2 * Math.round(value) + 3} sites` },
  "bound-state-continuum": { thickness: "Pair asymmetry", count: "Resonator pairs", thicknessValue: percent, countValue: (value) => `${(Math.round(value) + 2) ** 2} pairs` },
  "phase-change": { thickness: "Crystalline share", count: "Pixel rows", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 2} × ${Math.round(value) + 2} pixels` },
  "liquid-crystal": { thickness: "Director rotation", count: "Disk rows", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 2} × ${Math.round(value) + 2} disks` },
  huygens: { thickness: "Post diameter", count: "Post rows", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 3} × ${Math.round(value) + 3} posts` },
  "structural-color": { thickness: "Pillar diameter", count: "Color pixel rows", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 3} × ${Math.round(value) + 3} pillars` },
  "graphene-absorber": { thickness: "Graphene feature width", count: "Pattern rows", thicknessValue: percent, countValue: (value) => `${Math.round(value)} groups` },
  "space-time": { thickness: "Bias modulation depth", count: "Loaded cells", thicknessValue: percent, countValue: (value) => `${Math.round(value) + 3} cells` },
};

const multiphysicsLabels: Array<[string, string, string]> = [
  ["helmholtz", "Neck length", "Cavity count"],
  ["acoustic-hologram", "Channel detour", "Tile count"],
  ["ventilated-silencer", "Cavity depth", "Resonator count"],
  ["bubble-metascreen", "Bubble radius", "Bubble rows"],
  ["acoustic-luneburg", "Index contrast", "Grading rings"],
  ["thermal-concentrator", "Core radius", "Sector pairs"],
  ["thermal-diode", "Paraffin thickness", "Thermal paths"],
  ["thermal-emitter", "Resonator size", "Pattern rows"],
  ["magnetic-programmable", "Field strength", "Actuator units"],
  ["piezo-shunt", "Circuit tuning", "Patch pairs"],
];

export const multiphysicsControls: Record<string, SpecialisedControl> =
  Object.fromEntries(
    multiphysicsLabels.map(([id, thickness, countLabel]) => [
      id,
      {
        thickness,
        count: countLabel,
        thicknessValue: (value: number) => `${Math.round(normalized(value) * 100)}% illustrative`,
        countValue: (value: number) => {
          const amount = count(value);
          if (id === "bubble-metascreen") return `${amount + 1} rows · ${(amount + 1) ** 2} bubbles`;
          if (id === "acoustic-luneburg") return `${amount + 2} rings`;
          if (id === "thermal-concentrator") return `${4 + 2 * amount} pairs · ${8 + 4 * amount} sectors`;
          if (id === "thermal-emitter") return `${amount + 2} rows · ${(amount + 2) ** 2} resonators`;
          if (id === "magnetic-programmable") return `${amount} panels / beams · ${4 + 2 * amount} continuous-beam domains`;
          if (id === "piezo-shunt") return `${amount} pairs · ${2 * amount} PZT patches`;
          return String(amount);
        },
      },
    ]),
  );
