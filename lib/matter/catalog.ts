export type Family = {
  id: string;
  name: string;
  category: string;
  tag: string;
  origin: string;
  mechanism: string;
  behavior: string;
  application: string;
  applicationLesson: string;
  applicationWhy: string;
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
      "Purpose: pair a flexible polymer with a smooth, connected cell for light cushioning and airflow. The gyroid is an engineered mathematical surface, not a copy of a natural object.",
    mechanism:
      "Structure: one continuous curved wall winds through the part. It has no sharp beam junctions, so force can travel along connected paths while open spaces remain between the walls.",
    behavior:
      "Behavior: the walls flex and spread a load through the connected network. The open passages can also let air, fluid, or heat move through.",
    application: "Cushioning shoe midsole",
    applicationLesson:
      "A gyroid can form the springy core of a running-shoe midsole. Its connected walls compress under a foot strike and recover between steps, while the upper and outsole handle fit and grip.",
    applicationWhy:
      "It is useful because it can cushion repeated impacts while using less material than a solid block.",
    variantLessons: [
      "Sheet gyroid: a thin continuous wall follows the gyroid surface. Thicker walls usually make it harder to compress.",
      "Skeletal gyroid: solid ribs trace the gyroid’s connected pathways. The load path differs from the thin-wall version.",
      "Graded gyroid: wall thickness changes across the part. This can create softer and firmer zones in one piece.",
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
      "Purpose: combine a stiff material with a light triangular framework for high stiffness at low mass. The octet truss is an engineered pattern built from tetrahedra and octahedra.",
    mechanism:
      "Structure: repeating triangles connect the struts in three dimensions. Many struts carry pulling or pushing forces directly instead of bending.",
    behavior:
      "Behavior: the triangular network carries force through tension and compression. This can make it stiff without making it solid or heavy.",
    application: "Lightweight aircraft wing core",
    applicationLesson:
      "An octet truss can sit between the skins of a lightweight aircraft wing. The skins keep the airfoil shape, while the triangular core holds them apart with little material.",
    applicationWhy:
      "It is useful because a light core can support separated wing skins and reduce overall mass.",
    variantLessons: [
      "Uniform octet: every cell and strut has the same size. The pattern behaves consistently across the part.",
      "Graded octet: selected struts become thicker. More material is placed where extra support may be useful.",
      "Anisotropic octet: cells are stretched in one direction. The part can become stiffer along that direction.",
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
      "Purpose: combine a flexible material with an inward-folded cell that can wrap around curved surfaces. It is an engineered honeycomb transformation, not ordinary bee comb.",
    mechanism:
      "Structure: the ribs point inward. When pulled, they rotate outward, so the lattice can become wider as it becomes longer. This is called auxetic behavior.",
    behavior:
      "Behavior: pulling the lattice makes it widen instead of narrow. Bending it lets the ribs rotate and follow a curved surface.",
    application: "Conforming knee-protection insert",
    applicationLesson:
      "A re-entrant lattice can form a flexible knee-protection insert. Its ribs rotate as the knee bends, helping the insert conform while the sleeve and straps keep it in place.",
    applicationWhy:
      "It is useful because the insert can follow knee movement while spreading contact over a larger area.",
    variantLessons: [
      "Re-entrant cell: ribs angle toward the center. Their outward rotation creates the widening motion.",
      "Deep re-entrant: ribs point farther inward. This gives them more room to rotate before they touch.",
      "Graded re-entrant: rib thickness changes across the insert. Thick zones resist bending more, while thin zones flex more easily.",
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
      "Purpose: combine a crushable polymer with a space-filling cell for lightweight impact absorption. The Kelvin cell was proposed by Lord Kelvin as a model for foam.",
    mechanism:
      "Structure: struts connect a repeating 14-faced cell. Under compression, they bend and buckle, using motion inside the empty space to absorb energy.",
    behavior:
      "Behavior: compression makes the cells deform progressively. Their movement can absorb part of an impact before the load reaches the protected object.",
    application: "Cellular cycling-helmet liner",
    applicationLesson:
      "A Kelvin lattice can form the crushable liner inside a cycling helmet. The shell spreads the impact, while the cells deform and slow the head more gradually.",
    applicationWhy:
      "It is useful because controlled crushing can increase stopping time and reduce a sudden peak load.",
    variantLessons: [
      "Uniform Kelvin: cells and struts stay the same size across the liner. This gives a simple baseline.",
      "Thick Kelvin: thicker struts add material and usually resist compression more strongly.",
      "Graded Kelvin: strut thickness changes across the liner. This creates zones that can crush differently.",
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
      "Purpose: combine thin cell walls with strong outer skins to make a light, stiff panel. The design is inspired by the efficient hexagons in bee comb and can be made from paper, polymer, aluminium, or composite.",
    mechanism:
      "Structure: thin walls form repeating cells between two skins. The depth between the skins increases bending stiffness, but strength depends on direction.",
    behavior:
      "Behavior: the skins carry much of the bending load while the cells keep them separated. The response is stronger in some directions than others.",
    application: "Lightweight skateboard deck core",
    applicationLesson:
      "A honeycomb can form the light core of a skateboard deck. It keeps the top and bottom skins apart so they resist bending without filling the deck with solid material.",
    applicationWhy:
      "It is useful because a deep, light core can make a panel stiffer without adding a lot of weight.",
    variantLessons: [
      "Hexagonal: regular six-sided cells repeat through the core. Their depth separates and supports the skins.",
      "Elongated hexagonal: cells stretch along one axis. The core becomes more directional because its walls are no longer equal.",
      "Graded hexagonal: wall thickness or cell size changes along the deck. Material is concentrated where support may be needed.",
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
      "Purpose: combine a host structure with small tuned masses to reduce a chosen vibration. The design uses the familiar physics of a mass connected to a spring.",
    mechanism:
      "Structure: each small mass hangs from a flexible support. Near its tuned frequency, the mass moves against the frame and can reduce vibration passing through it.",
    behavior:
      "Behavior: the internal mass oscillates out of step with the host structure. Near its tuning, this can weaken vibration in a narrow frequency range.",
    application: "Frequency-tuned motor mount",
    applicationLesson:
      "A local resonator can be built into a motor mount. Its tuned masses move at a troublesome frequency and may reduce the vibration reaching the frame.",
    applicationWhy:
      "It is useful because it can target one annoying vibration without making the entire mount much heavier.",
    variantLessons: [
      "Single mass: one internal mass targets one main vibration frequency.",
      "Dual mass: two internal masses target two frequency ranges.",
      "Graded mass: mass changes across the support, creating a spread of tuning frequencies.",
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
