export type SourceCard = {
  id: string;
  title: string;
  eyebrow: string;
  image: string;
  alt: string;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
};

/** Real-world references used to ground the learning material. They are kept
 * separate from the rendered models so a photograph never gets mistaken for a
 * simulated result. */
export const materialCards: SourceCard[] = [
  {
    id: "tpu",
    title: "TPU elastomer",
    eyebrow: "BASE MATERIAL · FLEXIBLE POLYMER",
    image:
      "https://images.squarespace-cdn.com/content/v1/5af1803d506fbef0bc69bead/30571625-7dd6-4829-b62b-c3c6ca1ea553/3D%2BPeople%2B-%2BTPU01%2Bpart%2Bas%2Bfinished%2Bnatural%2Bgrey%2Bwith%2Bhigh%2Bflexibility.jpg?format=1500w",
    alt: "Hands bending a flexible grey TPU 3D-printed part.",
    sourceLabel: "3D People · flexible TPU part",
    sourceUrl: "https://www.3dpeople.uk/prototyping",
    note: "A rubber-like polymer often chosen when a design needs repeated bending or cushioning.",
  },
  {
    id: "pa12",
    title: "Nylon PA12",
    eyebrow: "BASE MATERIAL · TOUGH POLYMER",
    image:
      "https://cdn.prod.website-files.com/69aeb921c68af97f3b6be535/69b147c69f7a69d39fe0f579_69b00c54219f0219e7c126d9_Stampa_3d_3dvoxel_materiali_da_usare_Nylon-Pa12_004.webp",
    alt: "A functional grey nylon PA12 3D-printed bracket.",
    sourceLabel: "3D On Demand · PA12 printed part",
    sourceUrl: "https://www.3d-demand.com/materials/nylon-pa-12",
    note: "A tougher plastic that is commonly used for detailed, durable 3D-printed parts.",
  },
  {
    id: "aluminium",
    title: "Aluminium",
    eyebrow: "BASE MATERIAL · LIGHTWEIGHT METAL",
    image:
      "https://image.made-in-china.com/2f0j00JITbudiKyMcn/High-Purity-Aluminium-Ingot-99-99-99-85-99-7-99-6-Aluminium-Ingot-Price.jpg",
    alt: "Stacked silver aluminium ingots in an industrial warehouse.",
    sourceLabel: "Raw aluminium ingots · source image",
    sourceUrl:
      "https://hebeidaizong.en.made-in-china.com/product/RnbUdkiTXlhO/China-High-Purity-Aluminium-Ingot-99-99-99-85-99-7-99-6-Aluminium-Ingot-Price.html",
    note: "A light metal used where lower mass matters, but it is much less flexible than TPU.",
  },
  {
    id: "titanium",
    title: "Titanium",
    eyebrow: "BASE MATERIAL · HIGH-STRENGTH METAL",
    image:
      "https://www.weerg.com/hs-fs/hubfs/Luft-undRaumfahrt-Titanteile.jpg?height=1200&name=Luft-undRaumfahrt-Titanteile.jpg&width=1200",
    alt: "Machined titanium aerospace components on a workshop table.",
    sourceLabel: "Weerg · titanium aerospace components",
    sourceUrl: "https://www.weerg.com/de/lernen/titan",
    note: "A strong, corrosion-resistant metal often considered for demanding engineering and medical parts.",
  },
];

export const structureCards: SourceCard[] = [
  {
    id: "gyroid",
    title: "Gyroid",
    eyebrow: "MATHEMATICAL SURFACE · ALSO SEEN IN NATURE",
    image: "https://media.wbur.org/wp/2017/02/MIT-Lightweight-1-press.jpg",
    alt: "A pink 3D-printed gyroid lattice on a reflective surface.",
    sourceLabel: "MIT / WBUR · gyroid lattice",
    sourceUrl: "https://www.wbur.org/news/2017/02/17/mit-graphene-structure",
    note: "Start with a continuously curved mathematical surface. Repeat it, then choose its wall thickness to create an open, connected lattice.",
  },
  {
    id: "octet",
    title: "Octet truss",
    eyebrow: "ENGINEERED SPACE FRAME · TRIANGLES",
    image:
      "https://media.licdn.com/dms/image/sync/v2/D4E27AQEsJ-jrZKamww/articleshare-shrink_800/B4EZXoyspxG0AI-/0/1743367360154?e=2147483647&t=2E6Uh_39mmjpoW8mxhyF83WeCqfgh6x_2ECd392Yku0&v=beta",
    alt: "A physical 3D-printed octet truss made from triangular cells.",
    sourceLabel: "Ben Schaeffer · hinged octet truss",
    sourceUrl:
      "https://www.linkedin.com/posts/ben-schaeffer-246a31243_hinged-octet-truss-activity-7312212892852846592-BljS",
    note: "Start with triangles. Connect tetrahedra and octahedra, then repeat the frame so loads have several straight routes through the material.",
  },
  {
    id: "auxetic",
    title: "Re-entrant cell",
    eyebrow: "ENGINEERED CELL · INWARD-FOLDED RIBS",
    image:
      "https://www.mdpi.com/applsci/applsci-08-00941/article_deploy/html/images/applsci-08-00941-g008.png",
    alt: "Two physical auxetic lattice panels being bent by hand.",
    sourceLabel: "Applied Sciences · auxetic panels",
    sourceUrl: "https://www.mdpi.com/2076-3417/8/6/941",
    note: "Begin with an ordinary cell and fold its ribs inward. When the ribs rotate, the lattice can widen while it is pulled longer.",
  },
  {
    id: "kelvin",
    title: "Kelvin cell",
    eyebrow: "SPACE-FILLING FOAM MODEL · 3D PRINTED",
    image:
      "https://cdn.thingiverse.com/assets/4c/69/87/00/c5/large_display_dc585d11-1579-4655-874c-59bf4703b128.png",
    alt: "A blue 3D-printed Kelvin lattice on a grid surface.",
    sourceLabel: "Thingiverse · Kelvin lattice model",
    sourceUrl: "https://www.thingiverse.com/thing:5500119",
    note: "Use a foam-like, space-filling cell. Repeating the same open frame gives a light network that can bend and absorb energy.",
  },
  {
    id: "honeycomb",
    title: "Honeycomb",
    eyebrow: "NATURAL REPEATING PATTERN · BEE COMB",
    image: "https://pedagogika.bg/content/uploads/2021/09/untitled-design-26.png",
    alt: "A honeybee standing on golden hexagonal honeycomb cells.",
    sourceLabel: "Pedagogika · bee honeycomb",
    sourceUrl:
      "https://pedagogika.bg/znachenieto-na-pchelite-za-horata-planetata-i-hranitelnite-zapasi/",
    note: "Bee comb is a familiar hexagonal pattern. Engineers extrude and orient those cells to make a light core that supports two outer skins.",
  },
  {
    id: "resonator",
    title: "Local resonator",
    eyebrow: "PHYSICAL PRINCIPLE · MASS + SPRING",
    image:
      "https://image.made-in-china.com/202f0j00IcioQtbasnpq/Tmd-Tuned-Mass-Damper-for-Seismic-Reduction-and-Isolation-of-Buildings.webp",
    alt: "A real tuned mass damper with metal springs mounted to an industrial ceiling.",
    sourceLabel: "Siwo · tuned mass dampers",
    sourceUrl:
      "https://siwonewmaterial.en.made-in-china.com/product/DEjYnQCMsXRG/China-Tmd-Tuned-Mass-Damper-for-Seismic-Reduction-and-Isolation-of-Buildings.html",
    note: "Start with a moving mass on a flexible connection. Repeating many small versions can target selected vibration ranges instead of every vibration.",
  },
];

export const learningSteps = [
  {
    number: "01",
    title: "Pick a material",
    text: "Choose the substance first. It sets the starting feel before the geometry changes anything.",
  },
  {
    number: "02",
    title: "Shape one cell",
    text: "Design one small repeat, such as a curved sheet, triangle frame, or folded cell.",
  },
  {
    number: "03",
    title: "Repeat and tune",
    text: "Copy the cell through a part, then vary its size or thickness where the job needs it.",
  },
  {
    number: "04",
    title: "Test the job",
    text: "A promising idea still needs measured tests for its actual job, such as cushioning, impact, or structural load.",
  },
];
