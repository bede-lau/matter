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
    tag: "Smooth, connected load paths",
    origin:
      "The gyroid is a mathematical surface described by Alan Schoen. Similar gyroid-like patterns later became known in some biological nanostructures, including butterfly scales, but those natural examples did not create the mathematical design.",
    mechanism:
      "A gyroid replaces straight beams with one continuous curved wall or network. Loads can spread through smooth connected paths, while the open passages can allow air, fluid, or heat to move through the structure.",
    application: "Cushioning shoe midsole",
    applicationLesson:
      "Begin with a flexible base polymer such as TPU. Shape it into a gyroid midsole, then watch the curved walls compress during foot strike. The midsole may provide cushioning; the outsole supplies ground contact, and the upper holds the foot. Real shoe performance still requires fatigue, comfort, traction, and athlete testing.",
    variantLessons: [
      "Sheet gyroid: the mathematical surface becomes a continuous thin wall. Increase wall thickness to add material and usually make the cell harder to compress.",
      "Skeletal gyroid: solid branches follow one of the gyroid’s connected labyrinths. The changed solid paths and voids produce a different load path from the sheet version.",
      "Graded gyroid: wall thickness changes from one region to another. This can create softer and firmer zones without changing the shoe’s outer shape; the animation is a design concept, not measured cushioning data.",
    ],
    variants: ["Sheet gyroid", "Skeletal gyroid", "Graded gyroid"],
    color: "#c2ef72",
    source: "https://ntrs.nasa.gov/citations/19700020472",
  },
  {
    id: "octet",
    name: "Octet truss",
    category: "Mechanical",
    tag: "Triangular paths for high stiffness",
    origin:
      "The octet truss is an engineered framework built from repeating tetrahedra and octahedra. It is a geometric design, not a direct copy of an organism.",
    mechanism:
      "Its connected triangles guide many loads along the struts as tension or compression instead of bending. That can create high stiffness for low mass when the geometry, joints, material, and load direction are suitable.",
    application: "Lightweight aircraft wing core",
    applicationLesson:
      "Begin with a stiff base material such as aluminium, titanium, or a composite. Arrange it as an octet core between wing skins. The skins preserve the airfoil shape, while the triangulated core separates and supports them. A real wing also needs spars, joints, control surfaces, fatigue analysis, and certification.",
    variantLessons: [
      "Uniform octet: cell size and strut thickness stay constant, producing the same triangular pattern throughout the inspected region.",
      "Graded octet: struts become thicker in selected regions. This places more material where greater support may be needed, but the visible zones are not calculated stress results.",
      "Anisotropic octet: cells are stretched so their struts point differently by direction. The structure may become stiffer along one axis than another; rotate it to identify that preferred direction.",
    ],
    variants: ["Uniform octet", "Graded octet", "Anisotropic octet"],
    color: "#87ccf8",
    source: "https://doi.org/10.1016/S0022-5096(01)00010-2",
  },
  {
    id: "auxetic",
    name: "Re-entrant",
    category: "Mechanical",
    tag: "Widens when stretched",
    origin:
      "A re-entrant lattice is made by folding the ribs of a honeycomb-like cell inward. It is an engineered geometric transformation; an ordinary natural honeycomb is not generally auxetic.",
    mechanism:
      "When the lattice is pulled, its inward-pointing ribs can rotate outward. That motion can make it wider as it becomes longer—a response called auxetic behavior or negative Poisson ratio.",
    application: "Conforming knee-protection insert",
    applicationLesson:
      "Begin with a flexible polymer or textile-supported insert. Fold its cells inward, then bend the brace around the knee. Rib rotation may help the insert conform and redistribute local pressure, while the sleeve and stays keep it positioned. Protection and fit must be verified on real anatomy and with impact tests.",
    variantLessons: [
      "Re-entrant cell: identify the ribs that angle toward the center. Their outward rotation is the source of the idealized auxetic widening.",
      "Deep re-entrant: increase the inward angle. This changes the space and rotation available before ribs contact or lock; it does not automatically mean better protection.",
      "Graded re-entrant: change rib thickness across the insert. Thicker zones generally resist bending more strongly, while thinner zones may flex more easily.",
    ],
    variants: ["Re-entrant cell", "Deep re-entrant", "Graded re-entrant"],
    color: "#f4ad85",
    source: "https://doi.org/10.1126/science.235.4792.1038",
  },
  {
    id: "kelvin",
    name: "Kelvin cell",
    category: "Mechanical",
    tag: "Bending cells for energy management",
    origin:
      "The Kelvin cell comes from Lord Kelvin’s mathematical search for a space-filling foam made from equal-volume cells. Its ideal cell is based on a 14-faced truncated octahedron.",
    mechanism:
      "A Kelvin lattice connects the edges of these space-filling cells. Its struts can bend and buckle as the structure compresses, allowing a lightweight region to absorb and dissipate some energy.",
    application: "Cellular cycling-helmet liner",
    applicationLesson:
      "Begin with a crushable polymer liner and form it into curved Kelvin cells below a hard shell. During impact, the shell spreads contact while the liner deforms to lengthen the stopping time. This scene explains the idea only: a complete helmet must pass standardized impact, retention, fit, and durability tests.",
    variantLessons: [
      "Uniform Kelvin: cells and struts stay constant across the curved liner, providing a baseline geometry for comparison.",
      "Thick Kelvin: thicker struts add material and usually resist compression more strongly. Too much stiffness can also reduce useful crush distance, so “thicker” is not automatically “safer.”",
      "Graded Kelvin: strut thickness changes across the liner. This suggests different crush zones, but only helmet-specific simulation and testing can determine protection.",
    ],
    variants: ["Uniform Kelvin", "Thick Kelvin", "Graded Kelvin"],
    color: "#cab0f4",
    source: "https://doi.org/10.1080/14786448708628135",
  },
  {
    id: "honeycomb",
    name: "Honeycomb",
    category: "Mechanical",
    tag: "Lightweight support with direction",
    origin:
      "Engineered honeycomb uses repeating cells similar to natural bee comb. The familiar hexagon is the natural analogue; manufactured cores may use paper, polymers, aluminium, or composites.",
    mechanism:
      "Thin cell walls keep two outer skins apart. This can greatly increase bending stiffness without filling the whole object with solid material, but strength differs along and across the cell direction.",
    application: "Lightweight skateboard deck core",
    applicationLesson:
      "Begin with a paper, polymer, or aluminium honeycomb and bond it between strong deck skins. The core keeps the skins apart while the skins carry much of the bending load. Truck mounting areas need extra reinforcement, and a rideable deck requires fatigue, impact, moisture, and bonding tests.",
    variantLessons: [
      "Hexagonal: regular six-sided cells repeat through the core. View from above to see the pattern and from the side to see the depth that separates the skins.",
      "Elongated hexagonal: stretch the cells along one axis. The core’s response becomes more directional because the long and short wall arrangements deform differently.",
      "Graded hexagonal: change wall thickness or cell size along the deck. This places material selectively, but a structural analysis is needed to locate the right zones.",
    ],
    variants: ["Hexagonal", "Elongated hexagonal", "Graded hexagonal"],
    color: "#f2d77e",
    source: "https://doi.org/10.1017/CBO9781139878326",
  },
  {
    id: "resonator",
    name: "Local resonator",
    category: "Acoustic",
    tag: "Targets selected vibrations",
    origin:
      "A local-resonator metamaterial is designed from masses connected to flexible supports. It follows the physics of mass–spring oscillators rather than copying a particular natural organism.",
    mechanism:
      "Near a resonator’s tuned frequency, the internal mass moves relative to the outer frame. Its motion can interact with waves in the host structure and inhibit transmission across a limited frequency band.",
    application: "Frequency-tuned motor mount",
    applicationLesson:
      "Begin with a motor that produces vibration. Add small internal masses on flexible links and tune them near a troublesome frequency. Their relative motion may reduce transmission in that range; broad, changing motor vibration still needs damping, multiple tunings, and measured validation.",
    variantLessons: [
      "Single mass: one resonator introduces one dominant tuning scale. Its effective frequency depends on mass, connection stiffness, damping, and attachment.",
      "Dual mass: two internal masses introduce two tuning scales that may target more than one response. Geometry alone does not reveal the final band gaps.",
      "Graded mass: resonator mass changes across the support. This suggests a spread of local tuning frequencies, but a dynamic model is required to calculate them.",
    ],
    variants: ["Single mass", "Dual mass", "Graded mass"],
    color: "#8ee0cf",
    source: "https://doi.org/10.1126/science.289.5485.1734",
  },
];
export const bases = [
  {
    name: "TPU elastomer",
    e: 25,
    rho: 1200,
    color: "#c2ef72",
    intro: "Soft and springy. Start here when you want to explore bending or cushioning.",
  },
  {
    name: "Nylon PA12",
    e: 1700,
    rho: 1010,
    color: "#e6e5de",
    intro: "A tougher plastic. It is a useful contrast when the part needs more shape-holding support.",
  },
  {
    name: "Aluminium",
    e: 69000,
    rho: 2700,
    color: "#b4c9d9",
    intro: "A lightweight metal. It starts much stiffer than the two plastics in this learning model.",
  },
  {
    name: "Titanium",
    e: 110000,
    rho: 4430,
    color: "#bfc0ca",
    intro: "A strong metal. Use it to compare a high-stiffness starting material with softer choices.",
  },
];
