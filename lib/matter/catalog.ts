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
  defaultBase?: number;
  defaultSecondary?: number;
  /** Material indices that are physically meaningful for this teaching model. */
  allowedBase?: number[];
  /** Empty means this model is a one-material teaching model. */
  allowedSecondary?: number[];
  secondaryRole?: string;
  secondaryRequired?: boolean;
  materialNote?: string;
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
    defaultBase: 0,
    defaultSecondary: 1,
    allowedBase: [0, 1],
    allowedSecondary: [],
    materialNote: "A single polymer makes the visible gyroid. The material changes the feel, not the cell type.",
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
    defaultBase: 2,
    defaultSecondary: 3,
    allowedBase: [2, 3],
    allowedSecondary: [],
    materialNote: "This structural truss is shown as one metal alloy, not a random material blend.",
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
    defaultBase: 0,
    defaultSecondary: 1,
    allowedBase: [0, 1],
    allowedSecondary: [],
    materialNote: "A flexible polymer lets the inward ribs rotate without behaving like a brittle metal frame.",
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
    defaultBase: 0,
    defaultSecondary: 1,
    allowedBase: [0, 1],
    allowedSecondary: [],
    materialNote: "This impact-absorption lesson uses a single polymer lattice. A real helmet needs system-level testing.",
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
    defaultBase: 2,
    defaultSecondary: 1,
    allowedBase: [2, 1],
    allowedSecondary: [],
    materialNote: "The core is one material. The board skins are separate structural layers, not a mixed phase.",
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
    defaultBase: 0,
    defaultSecondary: 5,
    allowedBase: [0, 6],
    allowedSecondary: [5],
    secondaryRole: "Tuned mass",
    secondaryRequired: true,
    materialNote: "The soft base acts as the flexible support; the denser secondary component acts as the moving mass.",
  },
  {
    id: "metalens",
    name: "Dielectric metalens",
    category: "Optical",
    tag: "Focuses light with tiny posts",
    origin:
      "Purpose: pair a transparent dielectric with a patterned surface that can replace some of the bulk of a curved lens. The reference is the familiar camera lens, redesigned at a much smaller scale.",
    mechanism:
      "Structure: a flat surface carries thousands of tiny posts. Each post delays light by a slightly different amount, so the whole surface shapes a focused wavefront.",
    behavior:
      "Behavior: the posts change the phase of incoming light. Together they make light converge on a chosen focal point.",
    application: "Compact imaging optic",
    applicationLesson:
      "A metalens can focus light inside a miniature camera or experimental endoscope. The patterned surface does the wave-shaping work that a thicker curved lens normally does.",
    applicationWhy:
      "It is useful because a very thin optic can reduce the size and weight of an imaging system.",
    variantLessons: [
      "Uniform post field: posts share one height and show the starting surface before a focusing phase pattern is added.",
      "Phase-graded metalens: post height changes across the surface so the outgoing wavefront bends toward a focus.",
      "Post-pattern comparison: a second patterned post field lets you compare how changing the tiny elements can change the optical response.",
    ],
    variants: ["Uniform post field", "Phase-graded metalens", "Post-pattern comparison"],
    color: "#e7b5ff",
    source: "https://capasso.seas.harvard.edu/metasurfaces-and-flat-optics",
    defaultBase: 4,
    defaultSecondary: 4,
    allowedBase: [4],
    allowedSecondary: [],
    materialNote: "This near-infrared teaching model uses patterned silicon. A substrate is fixed in a real device, not mixed into the posts.",
  },
  {
    id: "cloak",
    name: "Microwave cloak",
    category: "Electromagnetic",
    tag: "Routes microwaves around an object",
    origin:
      "Purpose: guide selected electromagnetic waves around a region instead of letting them scatter directly from it. The reference principle is a coordinate map that treats wave paths as if space had been reshaped.",
    mechanism:
      "Structure: concentric rings carry carefully varied resonant elements. Their changing response bends microwave energy around a central object and brings the wave paths back together.",
    behavior:
      "Behavior: at its design frequency and direction, the shell can reduce the reflected shadow of the hidden region. It is wave steering, not human-visible invisibility.",
    application: "Microwave scattering-control shell",
    applicationLesson:
      "A microwave cloak can surround a small object in a laboratory and reduce how strongly it reflects radar-like waves. Engineers use this setup to study wave routing and scattering control.",
    applicationWhy:
      "It is useful because it demonstrates how a patterned shell can redirect waves without moving the object itself.",
    variantLessons: [
      "Uniform rings: each ring has the same response, making the shell easy to compare with an uncloaked object.",
      "Graded cloak: ring spacing or resonator size changes toward the center to make the wave path curve more smoothly.",
      "Broad-angle cloak: the shell is tuned to reduce sensitivity to the incoming direction, but bandwidth still remains limited.",
    ],
    variants: ["Uniform rings", "Graded cloak", "Broad-angle cloak"],
    color: "#ffb66d",
    source: "https://www.science.org/doi/10.1126/science.1133628",
    defaultBase: 5,
    defaultSecondary: 8,
    allowedBase: [5],
    allowedSecondary: [8],
    secondaryRole: "Microwave substrate",
    secondaryRequired: true,
    materialNote: "Copper resonators are patterned onto a low-loss fiberglass/epoxy microwave board. They are separate layers, not a bulk alloy.",
  },
  {
    id: "membrane-absorber",
    name: "Membrane absorber",
    category: "Acoustic",
    tag: "Soaks up selected low sounds",
    origin:
      "Purpose: turn a thin flexible membrane into a lightweight sound absorber. The reference principle is a drumhead, tuned so its motion dissipates a chosen low-frequency sound.",
    mechanism:
      "Structure: stretched membranes carry small rigid platelets inside a repeating panel. The membrane moves around each platelet and concentrates strain where sound energy can be lost.",
    behavior:
      "Behavior: near its resonance, the membrane moves strongly and converts part of the incoming sound into heat. Away from that range, absorption is weaker.",
    application: "Low-frequency noise-control panel",
    applicationLesson:
      "A membrane absorber could line a machine enclosure, cabin, or room where a low hum is a problem. The thin panel targets that hum without needing a thick block of foam.",
    applicationWhy:
      "It is useful because it can target low frequencies in a shallow package, although it does not absorb every sound equally.",
    variantLessons: [
      "Plain membrane: one flexible sheet shows the basic resonance before adding a tuned platelet.",
      "Platelet membrane: a rigid offset mass changes the local resonance and increases useful damping near the target tone.",
      "Multi-tone panel: several membrane sizes create several nearby absorption peaks.",
    ],
    variants: ["Plain membrane", "Platelet membrane", "Multi-tone panel"],
    color: "#78d6f4",
    source: "https://www.nature.com/articles/ncomms1758",
    defaultBase: 6,
    defaultSecondary: 10,
    allowedBase: [6, 0],
    allowedSecondary: [10],
    secondaryRole: "Bonded platelet mass",
    secondaryRequired: true,
    materialNote: "A flexible silicone membrane carries a denser bonded platelet. They play different physical roles in the resonator.",
  },
  {
    id: "thermal-cloak",
    name: "Thermal cloak",
    category: "Thermal",
    tag: "Diverts heat around a core",
    origin:
      "Purpose: control the path of conducted heat around a protected region. The reference principle is a river splitting around an island and rejoining downstream, translated into thermal conductivity.",
    mechanism:
      "Structure: alternating high- and low-conductivity rings create a direction-dependent thermal path. Copper-like paths carry heat quickly while silicone-like paths slow it down.",
    behavior:
      "Behavior: heat spreads around the center and can make the downstream temperature look less disturbed for a limited time. The protected core eventually warms.",
    application: "Temporary hot-spot protection",
    applicationLesson:
      "A thermal cloak can sit around a sensitive component during a short heat pulse. It redirects conducted heat around the center while the rest of the plate carries the pulse onward.",
    applicationWhy:
      "It is useful because it can delay a hot spot without refrigeration or an active pump.",
    variantLessons: [
      "Uniform rings: equal radial layers make the heat path easy to read but less carefully matched at the boundary.",
      "Conductivity-graded cloak: ring values change smoothly so the surrounding temperature field is less disturbed.",
      "Transient shield: the layer thickness is tuned for a short pulse rather than steady-state protection.",
    ],
    variants: ["Uniform rings", "Conductivity-graded", "Transient shield"],
    color: "#ff7f6d",
    source: "https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.110.195901",
    defaultBase: 5,
    defaultSecondary: 6,
    allowedBase: [5],
    allowedSecondary: [6],
    secondaryRole: "Low-conductivity layer",
    secondaryRequired: true,
    materialNote: "Copper and silicone form separate thermal paths. The colours show those paths, not a uniform material mixture.",
  },
  {
    id: "topological",
    name: "Topological edge lattice",
    category: "Wave",
    tag: "Carries waves along an edge",
    origin:
      "Purpose: create a repeating wave medium with a boundary-guided route. This teaching model uses a classical-wave analogue and does not claim one-way transport.",
    mechanism:
      "Structure: a specially designed periodic lattice can block a frequency range in its interior while its boundary supports a guided edge mode. The changed boundary cells show the route.",
    behavior:
      "Behavior: a wave can follow the edge and bend around some defects with less backscatter than an ordinary path. Protection depends on the band gap and operating conditions.",
    application: "Robust waveguide",
    applicationLesson:
      "A topological edge lattice can guide a microwave or optical signal around a corner on a chip. The signal stays near the boundary while the periodic interior blocks the same frequency.",
    applicationWhy:
      "It is useful because a carefully designed edge route can be less sensitive to some local defects than a conventional waveguide.",
    variantLessons: [
      "Straight edge: a clean boundary carries the wave along one side of the lattice.",
      "Bent edge: the boundary turns a corner so the wave path changes direction without opening a gap in the route.",
      "Defect-tested edge: small cells are changed on purpose to show which imperfections the edge mode can tolerate.",
    ],
    variants: ["Straight edge", "Bent edge", "Defect-tested edge"],
    color: "#aa9cff",
    source: "https://www.nature.com/articles/nature08293",
    defaultBase: 9,
    defaultSecondary: 5,
    allowedBase: [9],
    allowedSecondary: [5],
    secondaryRole: "Copper boundary layer",
    secondaryRequired: true,
    materialNote: "This microwave teaching platform pairs magnetically biased ferrite with copper conductors. It also needs an external DC bias field.",
  },
  {
    id: "flux",
    name: "Magnetic flux shell",
    category: "Magnetic",
    tag: "Concentrates an existing field",
    origin:
      "Purpose: gather an externally supplied magnetic field into a small sensing region. The reference principle is a magnetic circuit with funnels that guide flux where a sensor can use it.",
    mechanism:
      "Structure: nested soft-magnetic funnels create a strongly direction-dependent shell. The wider outside gathers field and the narrower inside opening concentrates it.",
    behavior:
      "Behavior: the shell redistributes magnetic flux toward the center. It does not create energy, and performance changes with orientation, saturation, and frequency.",
    application: "Magnetic-sensor enhancer",
    applicationLesson:
      "A flux shell can surround a small magnetic sensor and make an existing field stronger at the sensing gap. This can improve sensitivity without increasing the source magnet.",
    applicationWhy:
      "It is useful because passive geometry can collect field that would otherwise miss a small sensor.",
    variantLessons: [
      "Open funnels: a simple pair of magnetic funnels shows the basic concentration effect.",
      "Nested shell: several funnel layers collect field in stages for a stronger central response.",
      "Saturation-aware shell: the funnel widths change to leave more headroom before the magnetic material saturates.",
    ],
    variants: ["Open funnels", "Nested shell", "Saturation-aware"],
    color: "#ff82b7",
    source: "https://www.nature.com/articles/srep44762",
    defaultBase: 7,
    defaultSecondary: 7,
    allowedBase: [7],
    allowedSecondary: [],
    materialNote: "A soft magnetic alloy guides an externally supplied field. Copper is not a second phase in this shell.",
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
  {
    name: "Silicon",
    e: 130000,
    rho: 2330,
    color: "#9aa8b4",
    intro: "A semiconductor used in many optical microstructures and sensors.",
  },
  {
    name: "Copper",
    e: 110000,
    rho: 8960,
    color: "#d88d68",
    intro: "A highly conductive metal used in microwave patterns and heat-flow prototypes.",
  },
  {
    name: "PDMS silicone",
    e: 2.5,
    rho: 970,
    color: "#e4d7c7",
    intro: "A soft silicone often used for flexible membranes and low-conductivity layers.",
  },
  {
    name: "Soft magnetic alloy",
    e: 180000,
    rho: 7500,
    color: "#8799b4",
    intro: "A magnetically responsive alloy that can guide an existing field.",
  },
  {
    name: "Fiberglass/epoxy microwave laminate",
    e: 24000,
    rho: 1850,
    color: "#8eae9e",
    intro: "A low-loss composite board that supports patterned microwave conductors.",
  },
  {
    name: "Magnetically biased ferrite",
    e: 150000,
    rho: 5000,
    color: "#7792a8",
    intro: "A microwave ceramic whose wave response changes when an external magnetic bias is applied.",
  },
  {
    name: "Iron platelet",
    e: 210000,
    rho: 7870,
    color: "#aeb7bd",
    intro: "A small dense metal mass bonded to a membrane to shift its resonant motion.",
  },
];
