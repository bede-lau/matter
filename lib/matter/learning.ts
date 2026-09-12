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
  {
    id: "silicon",
    title: "Silicon",
    eyebrow: "BASE MATERIAL · OPTICAL SEMICONDUCTOR",
    image: "https://www.atomic-energy.ru/files/images/2025/04/7d2a5404.jpg",
    alt: "A technician inspecting a patterned silicon wafer in a laboratory.",
    sourceLabel: "Atomic Energy · silicon wafer inspection",
    sourceUrl: "https://www.atomic-energy.ru/statements/2025/04/09/155196",
    note: "A semiconductor used in many tiny optical structures and light sensors.",
  },
  {
    id: "copper",
    title: "Copper",
    eyebrow: "BASE MATERIAL · HIGH-CONDUCTIVITY METAL",
    image: "https://images.forbesjapan.com/media/article/86248/images/main_image_487dd93000d751154d762a3910b03e6274e7d63f.jpg",
    alt: "A warm-toned copper ingot on a dark surface.",
    sourceLabel: "Forbes Japan · copper ingot",
    sourceUrl: "https://forbesjapan.com/articles/detail/86248",
    note: "A conductive metal used in microwave resonators and heat-flow experiments.",
  },
  {
    id: "pdms",
    title: "PDMS silicone",
    eyebrow: "BASE MATERIAL · SOFT ELASTOMER",
    image: "https://cdn.open-pr.com/V/b/Vb04940201_g.jpg",
    alt: "A gloved hand bending a transparent PDMS silicone sample.",
    sourceLabel: "OpenPR · flexible PDMS sample",
    sourceUrl: "https://www.openpr.com/news/2793119/polydimethylsiloxane-pdms-market-research-and-analysis",
    note: "A flexible silicone used for membranes, microfluidics, and low-conductivity layers.",
  },
  {
    id: "soft-magnetic-alloy",
    title: "Soft magnetic alloy",
    eyebrow: "BASE MATERIAL · FIELD-GUIDING METAL",
    image: "https://ja.nc-net.or.jp/up/library/84533/73325/287359b7e49088a5a31ea9217d4f544d.JPG",
    alt: "Laminated soft magnetic alloy cores in several industrial shapes.",
    sourceLabel: "Otama · permalloy magnetic cores",
    sourceUrl: "https://ja.nc-net.or.jp/company/84533/product/detail/22980/",
    note: "A magnetically responsive alloy that can guide an existing field toward a sensor.",
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
    image:
      "https://www.marbella.es/images/media/articles/delegaciones-y-areas/medio-ambiente-playas-y-puertos/medio-ambiente/normativas/28123_retirada-de-colmenas-de-abejas_introfull.jpg",
    alt: "A honeybee standing on golden hexagonal honeycomb cells.",
    sourceLabel: "Marbella Environment · bee honeycomb",
    sourceUrl:
      "https://www.marbella.es/web/medio-ambiente/area-de-medio-ambiente/normativas/retirada-de-colmenas-de-abejas.html",
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
  {
    id: "metalens",
    title: "Dielectric metalens",
    eyebrow: "OPTICAL METASURFACE · NANOPILLARS",
    image:
      "https://www.researchgate.net/profile/Andrea-Vogliardi/publication/371865142/figure/fig4/AS%3A11431281170584436%401687834789445/SEM-images-of-the-fabricated-metalens-a-Overall-top-view-of-the-entire-metasurface.jpg",
    alt: "Microscope images of the repeating nanopillars on a fabricated metalens.",
    sourceLabel: "Vogliardi et al. · metalens SEM images",
    sourceUrl: "https://capasso.seas.harvard.edu/metasurfaces-and-flat-optics",
    note: "A microscope reveals the tiny post pattern that lets a flat surface focus light.",
  },
  {
    id: "cloak",
    title: "Microwave cloak",
    eyebrow: "TRANSFORMATION OPTICS · WAVE ROUTING",
    image:
      "https://npr.brightspotcdn.com/dims4/default/23d0ce3/2147483647/strip/true/crop/894x621%2B0%2B0/resize/880x611%21/quality/90/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Flegacy%2Fsites%2Fkut%2Ffiles%2F201303%2FInvisibiltiyCloak+copy.jpg",
    alt: "A laboratory setup measuring electromagnetic waves around a cloaked cylindrical sample.",
    sourceLabel: "KUT / NPR · cloak measurement setup",
    sourceUrl: "https://www.science.org/doi/10.1126/science.1133628",
    note: "A real lab setup measures how a patterned shell changes the waves scattered by a small object.",
  },
  {
    id: "membrane-absorber",
    title: "Membrane absorber",
    eyebrow: "ACOUSTIC METAMATERIAL · RESONANT PANEL",
    image:
      "https://www.mdpi.com/acoustics/acoustics-01-00035/article_deploy/html/images/acoustics-01-00035-g003.png",
    alt: "Acoustic metamaterial panels and a test setup with microphones in an anechoic room.",
    sourceLabel: "MDPI Acoustics · panel testing",
    sourceUrl: "https://www.nature.com/articles/ncomms1758",
    note: "Thin membranes and small masses can target low-frequency noise in a shallow panel.",
  },
  {
    id: "thermal-cloak",
    title: "Thermal cloak",
    eyebrow: "THERMAL METAMATERIAL · COPPER + PDMS",
    image:
      "https://scitechdaily.com/images/Researchers-Develop-Invisibility-Cloak-for-Thermal-Flow.jpg",
    alt: "A circular copper and PDMS plate with concentric rings for redirecting heat flow.",
    sourceLabel: "SciTechDaily · thermal cloak sample",
    sourceUrl: "https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.110.195901",
    note: "The alternating rings bend a heat pulse around a centre, like a river around an island.",
  },
  {
    id: "topological",
    title: "Topological edge lattice",
    eyebrow: "PHOTONIC LATTICE · PROTECTED EDGE",
    image:
      "https://scx2.b-cdn.net/gfx/news/2021/directquanti.jpg",
    alt: "A photonic crystal lattice with a highlighted edge route and wave amplitude map.",
    sourceLabel: "Phys.org · photonic edge-state image",
    sourceUrl: "https://www.nature.com/articles/nature08293",
    note: "The repeating crystal blocks the bulk while a boundary route carries a selected wave.",
  },
  {
    id: "flux",
    title: "Magnetic flux shell",
    eyebrow: "MAGNETIC METAMATERIAL · FIELD CONCENTRATOR",
    image:
      "https://media.springernature.com/lw685/springer-static/image/art%3A10.1038%2Fsrep44762/MediaObjects/41598_2017_Article_BFsrep44762_Fig2_HTML.jpg",
    alt: "Nested magnetic metamaterial funnels arranged to concentrate a field in a central region.",
    sourceLabel: "Scientific Reports · magnetic shell prototype",
    sourceUrl: "https://www.nature.com/articles/srep44762",
    note: "Nested magnetic funnels gather an existing field where a small sensor can measure it.",
  },
  {
    id: "hyperbolic",
    title: "Hyperbolic multilayer",
    eyebrow: "OPTICAL HYPERLENS · SILVER + ALUMINA FILMS",
    image: "https://media.springernature.com/full/springer-static/image/art%3A10.1038%2Fncomms2176/MediaObjects/41467_2012_Article_BFncomms2176_Fig1_HTML.jpg",
    alt: "Fabricated cylindrical hyperlenses made from alternating thin optical layers.",
    sourceLabel: "Nature Communications · hyperlens sample",
    sourceUrl: "https://xlab.hku.hk/pdf/10.1364_oe.15.015886.pdf",
    note: "Alternating metal and insulating films can carry selected fine optical patterns. Curving the layers creates a hyperlens-style geometry.",
  },
  {
    id: "chiral",
    title: "Chiral helix polarizer",
    eyebrow: "OPTICAL METAMATERIAL · GOLD HELICES",
    image: "https://static.spektrum.de/fm/912/f2000/Pendry_gold%20helices.jpg",
    alt: "Microscope image of repeated gold helical metamaterial elements.",
    sourceLabel: "Spektrum · gold helical array",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/19696310/",
    note: "The matching corkscrew shapes interact differently with the two handed twists of circularly polarized light.",
  },
  {
    id: "labyrinth",
    title: "Space-coiling labyrinth",
    eyebrow: "ACOUSTIC METASURFACE · FOLDED AIR CHANNELS",
    image: "https://www.researchgate.net/publication/318121160/figure/fig4/AS%3A573844025233408%401513826485991/Designed-coiling-up-space-units-and-experiment-setup-a-Schematic-illustration-of-the_Q640.jpg",
    alt: "Experimental schematic of a coiling acoustic metasurface with folded channels.",
    sourceLabel: "Acoustic metasurface experiment",
    sourceUrl: "https://www.nature.com/articles/ncomms6553",
    note: "Rigid walls fold a long air path into a compact panel, giving sound a controlled delay before it leaves.",
  },
  {
    id: "radiative-cooler",
    title: "Radiative-cooling film",
    eyebrow: "PASSIVE COOLING · SILICA MICROSPHERES",
    image: "https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/noticias/microesferas-de-silice-para-enfriar-superficies-sin-consumir-energia/7660267-1-esl-MX/Microesferas-de-silice-para-enfriar-superficies-sin-consumir-energia.png",
    alt: "Microscope image of a silica microsphere surface used for passive radiative cooling research.",
    sourceLabel: "SINC · silica microsphere cooling surface",
    sourceUrl: "https://www.science.org/doi/10.1126/science.aai7899",
    note: "A microsphere-filled film over a reflector can send thermal infrared energy toward the sky while rejecting much of the sunlight.",
  },
  {
    id: "seismic",
    title: "Seismic resonant metawedge",
    eyebrow: "ELASTIC-WAVE METAMATERIAL · GRADED RESONATORS",
    image: "https://www.asce.org/-/media/asce-images-and-files/publications-and-news/civil-engineering-magazine/images/2023/10-october/ceo-could-metamaterials-steer-seismic-waves-away-from-buildings-10-17-23/sample-copy-resized.jpg",
    alt: "Laboratory seismic metamaterial sample with an array of vertical resonator pillars.",
    sourceLabel: "ASCE · seismic metamaterial prototype",
    sourceUrl: "https://www.nature.com/articles/srep27717",
    note: "Rows of anchored resonators can be graded in height to study how selected ground waves are slowed, reflected, or redirected.",
  },
  {
    id: "water-wave",
    title: "Water-wave plate array",
    eyebrow: "HYDRODYNAMIC METAMATERIAL · SUBMERGED PLATES",
    image: "https://static.cambridge.org/content/id/urn%3Acambridge.org%3Aid%3Aarticle%3AS0022112025000904/resource/name/optimisedImage-png-S0022112025000904_figAb.jpg?pub-status=live",
    alt: "Laboratory water-wave experiment using a submerged plate in a wave tank.",
    sourceLabel: "Journal of Fluid Mechanics · plate test",
    sourceUrl: "https://journals.aps.org/prb/abstract/10.1103/PhysRevB.96.134310",
    note: "Submerged plates fixed to a tank floor create channels and depth changes that guide small surface ripples.",
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
