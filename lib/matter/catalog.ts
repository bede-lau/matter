export type Family = {
  id: string;
  name: string;
  category: string;
  tag: string;
  origin: string;
  mechanism: string;
  application: string;
  applicationLesson: string;
  variantLessons: string[];
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
    application: "Athletic shoe anatomy",
    applicationLesson:
      "Follow a foot strike, then separate the shoe layers. The cellular midsole compresses between the foot support and the rubber outsole; the upper, collar and laces keep the foot located.",
    variantLessons: [
      "A continuous gyroid sheet forms the cushioning network. Inspect its curved walls through the open side of the midsole.",
      "The solid-network gyroid replaces the sheet with connected labyrinth branches. Compare the changed voids and load paths.",
      "Wall thickness varies through the midsole depth. This illustrates a route to zoning support without changing the shoe’s outer shape.",
    ],
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
    application: "Aircraft wing cutaway",
    applicationLesson:
      "Open the wing inspection skin to reveal its internal octet core. The outer airfoil preserves the aerodynamic shape while the triangulated interior connects the skins.",
    variantLessons: [
      "A uniform core repeats the same triangular load paths throughout the inspected wing region.",
      "Strut thickness changes through the core depth. Compare the stronger-looking and lighter-looking zones without interpreting them as calculated stresses.",
      "Stretched cells change the preferred geometric direction. Orbit the wing to see how the strut angles differ.",
    ],
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
    application: "Wearable knee protection",
    applicationLesson:
      "Flex the fitted knee pad and separate its shell from the cellular insert. Re-entrant cells offer an inward-folded geometry that can help a protective layer conform around a joint.",
    variantLessons: [
      "Look for the inward-pointing ribs in the insert. Their rotation is the source of the idealized auxetic response.",
      "Deeper inward angles change the room available for rib rotation. The product animation remains a qualitative fit study.",
      "Varying rib thickness creates different geometric zones across the insert. Compare the zones in the exposed padding.",
    ],
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
    application: "Cycling helmet liner",
    applicationLesson:
      "Inspect the curved cellular patch beneath a vented helmet shell. The contact marker shows where an impact enters the assembly, while a small liner compression illustrates the absorption concept.",
    variantLessons: [
      "The liner follows the head curvature using uniform Kelvin cells. The inspection window exposes the repeating polyhedral network.",
      "Thicker struts add material to the same cell arrangement. Actual impact performance would require a helmet-specific test or model.",
      "Strut thickness changes across the curved liner. The geometry illustrates spatial tuning, without predicting protection.",
    ],
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
    application: "Lightweight skateboard deck",
    applicationLesson:
      "Separate the grip deck from the lower skin to reveal vertical honeycomb walls. The core holds the skins apart, and the trucks and wheels connect the lightweight deck to the ground.",
    variantLessons: [
      "Regular hexagonal cells repeat through the core. View from above to inspect the cells and from the side to see their depth.",
      "Elongated hexagonal cells change the geometric directionality of the core. Rotate the deck to compare the long and short cell axes.",
      "Wall thickness changes along the deck. This is a construction concept for exploring where material could be placed.",
    ],
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
    application: "Motor isolation mount",
    applicationLesson:
      "A rotating motor sits above a cellular mount. Internal masses move relative to the frame, making the resonator mechanism visible; the motion does not represent a calculated vibration reduction.",
    variantLessons: [
      "One internal mass per cell illustrates a single local tuning. Pause the motion to inspect its compliant connection.",
      "Two internal masses per cell introduce two geometric tuning scales. This does not establish the frequency bands of a real mount.",
      "Mass size changes across the support. Differing resonators suggest multiple local tunings; a dynamic model is needed to quantify them.",
    ],
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
