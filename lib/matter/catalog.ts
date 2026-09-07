export type Family = {
  id: string;
  name: string;
  category: string;
  tag: string;
  origin: string;
  mechanism: string;
  application: string;
  variants: string[];
  color: string;
  source: string;
};
export const families: Family[] = [
  {
    id: "gyroid",
    name: "Gyroid",
    category: "Mechanical",
    tag: "Continuous strength",
    origin:
      "A mathematical minimal surface discovered by Alan Schoen. Related gyroid geometries also occur in butterfly wing nanostructures; those biological structures were not its original derivation.",
    mechanism:
      "A continuous, curved sheet distributes load without sharp junctions. Its connected passages can also carry fluid or heat.",
    application: "Cushioning sole",
    variants: ["Sheet gyroid", "Skeletal gyroid", "Graded gyroid"],
    color: "#c2ef72",
    source: "https://ntrs.nasa.gov/citations/19700020472",
  },
  {
    id: "octet",
    name: "Octet truss",
    category: "Mechanical",
    tag: "Light but stiff",
    origin:
      "An engineered arrangement of tetrahedra and octahedra, not a direct biological copy.",
    mechanism:
      "Triangulated struts carry loads mainly through stretching. More material along the struts generally raises stiffness and mass.",
    application: "Aerospace panel",
    variants: ["Uniform octet", "Graded octet", "Anisotropic octet"],
    color: "#87ccf8",
    source: "https://doi.org/10.1016/S0022-5096(01)00010-2",
  },
  {
    id: "auxetic",
    name: "Re-entrant",
    category: "Mechanical",
    tag: "Expands when stretched",
    origin:
      "A deliberately inward-folded honeycomb geometry. Natural honeycombs are a useful comparison, but conventional honeycombs are not generally auxetic.",
    mechanism:
      "Inward ribs rotate outward under tension. This can produce a negative Poisson ratio: the lattice widens as it lengthens.",
    application: "Protective padding",
    variants: ["Re-entrant cell", "Deep re-entrant", "Graded re-entrant"],
    color: "#f4ad85",
    source: "https://doi.org/10.1126/science.235.4792.1038",
  },
  {
    id: "kelvin",
    name: "Kelvin cell",
    category: "Mechanical",
    tag: "Foam-like absorption",
    origin:
      "Lord Kelvin’s mathematical space-filling foam model, inspired by the problem of dividing space into equal volumes.",
    mechanism:
      "Edges of truncated octahedra form an open cellular network. Strut bending allows energy absorption with low weight.",
    application: "Impact absorber",
    variants: ["Uniform Kelvin", "Thick Kelvin", "Graded Kelvin"],
    color: "#cab0f4",
    source: "https://doi.org/10.1080/14786448708628135",
  },
  {
    id: "honeycomb",
    name: "Honeycomb",
    category: "Mechanical",
    tag: "Directional support",
    origin:
      "Hexagonal cells echo natural bee combs. Engineering honeycomb uses geometry to separate strong and compliant directions.",
    mechanism:
      "Cell walls resist loads differently along and across their extrusion direction. Orientation is as important as the base material.",
    application: "Sandwich panel",
    variants: ["Hexagonal", "Elongated hexagonal", "Graded hexagonal"],
    color: "#f2d77e",
    source: "https://doi.org/10.1017/CBO9781139878326",
  },
  {
    id: "resonator",
    name: "Local resonator",
    category: "Acoustic",
    tag: "Shapes vibration",
    origin:
      "Designed from coupled mass–spring oscillators rather than a specific natural organism.",
    mechanism:
      "An internal mass oscillates relative to its frame. Near its resonance, this motion can inhibit wave transmission over a frequency band.",
    application: "Vibration isolator",
    variants: ["Single mass", "Dual mass", "Graded mass"],
    color: "#8ee0cf",
    source: "https://doi.org/10.1126/science.289.5485.1734",
  },
];
export const bases = [
  { name: "TPU elastomer", e: 25, rho: 1200, color: "#c2ef72" },
  { name: "Nylon PA12", e: 1700, rho: 1010, color: "#e6e5de" },
  { name: "Aluminium", e: 69000, rho: 2700, color: "#b4c9d9" },
  { name: "Titanium", e: 110000, rho: 4430, color: "#bfc0ca" },
];
