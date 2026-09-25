# Matter Lab

**Repository description:** Interactive 3D learning studio for exploring 36 metamaterial families, their structures, material choices, behavior, applications, and research sources.

Matter Lab is a browser-based learning studio for seeing how carefully designed structures can change the way materials respond to forces, light, sound, heat, and electromagnetic fields. Browse source-linked examples, inspect procedural 3D models, adjust supported design controls, and explore an experimental materials dataset.

It is an educational prototype. Its models and animations explain ideas; they do not replace measurements, simulation, engineering review, or manufacturing tests.

## What’s inside

- **36 metamaterial families:** six core lattice families and 30 additional, research-linked families spanning mechanical, electromagnetic, optical, acoustic, thermal, magnetic, and electromechanical topics.
- **108 catalog variants:** three named geometry or configuration variants for each family.
- **Interactive 3D views:** procedural geometry, orbit and zoom, cutaways, component labels, supported design controls, and illustrative behavior scenes.
- **Material-aware selections:** material choices are limited to those defined for each teaching model. Where a model uses separate functional layers, hinges, inclusions, or supports, they are shown as distinct parts rather than as an arbitrary blended material.
- **A visual Field Guide:** plain-language explanations, source links, family variants, and reference images. Small lattice previews are rendered on demand.
- **A contextual glossary:** 282 short definitions, with keyboard-accessible term and component-label interactions.
- **Research data exploration:** filtering and plotting for 20,520 records from an elastodynamic metamaterials dataset, with source attribution and export.
- **Data import and export:** import CSV or JSON records, check their format and units, inspect supported-family mappings, and export the current session’s data.
- **Accessible controls and rendering fallback:** keyboard-operable interactions and a geometry-based software renderer for browsers where WebGL is unavailable.

### Core lattice families

| Family | Example of the structural idea |
| --- | --- |
| Gyroid | A connected, curved surface with open passages |
| Octet truss | A three-dimensional network of triangular load paths |
| Re-entrant lattice | Inward-angled ribs that can widen when pulled |
| Kelvin cell | A repeating, space-filling cell used to study crushing |
| Honeycomb | Thin-walled cells supporting a lightweight panel |
| Local resonator | A host structure coupled to moving internal masses |

Each core family has three geometry variants and a product-application teaching scene.

### Research-linked families

The 30 additional families have their own structure, behavior, application, material notes, variants, source records, and qualitative procedural model.

| Area | Families |
| --- | --- |
| Mechanical | Pentamode lattice; rotating squares; chiral honeycomb; Miura origami; kirigami ribbon sheet; bistable beam; tensegrity cell; spinodal shell; chainmail sheet; bimetal thermal-expansion strip |
| Electromagnetic | Negative-index split-ring array; epsilon-near-zero channel; space-time modulated metasurface |
| Optical | Photonic-bandgap crystal; quasi-BIC metasurface; phase-change metasurface; liquid-crystal metasurface; Huygens metasurface; structural-colour pillar array; graphene absorber |
| Acoustic | Helmholtz resonator array; acoustic hologram; ventilated metamaterial silencer; bubble metascreen; acoustic Luneburg lens |
| Thermal | Thermal concentrator; thermal diode; selective thermal emitter |
| Magnetic | Magnetically programmable elastomer |
| Electromechanical | Piezo-shunted beam |

These examples are a curated learning catalog, not a complete or ranked survey of metamaterials research. A linked paper or image provides context; it does not mean the procedural model reproduces the paper’s specimen or measured results.

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm
- A modern browser; WebGL2 is recommended for the full 3D lighting

### Install and start

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. The app does not require an API key or a paid service. If WebGL is unavailable, a lower-detail software-rendered view is used where supported.

### Build and checks

```bash
npm run build
npm test
npm run test:models
npm run lint
```

`npm test` runs the production build and the Node test suite. `npm run test:models` checks procedural model geometry and application assemblies. `npm run lint` runs ESLint. The Cloudflare/Vinext build scripts use Bash; Windows users should run them through WSL or Git Bash.

## Data and references

- `public/data/elastodynamic.json` contains 20,520 data rows and its attribution, source URLs, license, hashes, and normalization notes. The data is from the [UCI 2D Elastodynamic Metamaterials dataset](https://archive.ics.uci.edu/dataset/692/2d%2Belastodynamic%2Bmetamaterials) and is identified in the dataset as CC BY 4.0.
- `public/data/research.json` contains additional research-source records used by the app.
- `lib/matter/expansion.ts` defines the 30 additional families, their teaching copy, compatible materials, variants, and source links.
- `lib/matter/expansion-references.json` records the reference-image descriptions, credits, source links, and reuse notes. Image rights vary by item; check its license field before reusing an image.
- Imported records are checked for supported format and values, not independently verified for scientific accuracy. They remain in the current tab session unless exported.

## Scientific scope and limits

The studio builds many structures procedurally with Three.js. These models are simplified visual explanations, not scans or dimensionally complete CAD. Geometry, materials, and behavior are selected to make a mechanism legible. A material selection or animation does not imply a measured property.

In particular:

- The new research-linked families are qualitative teaching models. Their reference papers and images are not proof that the rendered geometry is experimentally validated.
- Material-property values and composition estimates are illustrative where shown. They are not design allowables or predictions for a manufactured part.
- No finite-element, electromagnetic, optical, acoustic, thermal, or multiphysics solver is included. The scenes do not calculate the full physics of those systems.
- Density, stiffness, and deformation depend on geometry, scale, material grade, process, boundary conditions, and defects. The app does not model all of these factors.
- Product scenes are procedural demonstrations, not certified product designs or clinical, safety, or performance advice.
- Dataset matches and plots help explore the included data; they do not establish that a candidate design will work.

Use the cited sources for scientific context and consult domain experts and validated tools for engineering decisions.

## Project map

| Path | Purpose |
| --- | --- |
| `app/` | App entry point, document metadata, and global styles |
| `components/matter/Studio.tsx` | Main studio layout, controls, and import/export flow |
| `components/matter/Scene.tsx` | Three.js scene, rendering lifecycle, and annotations |
| `lib/matter/geometry.ts` and `components/matter/models/*Expansion.ts` | Procedural geometry for the core and additional families |
| `components/matter/models/` | Product scenes, family-specific behavior, and reusable model parts |
| `components/matter/FieldGuide.tsx` and `MiniLattice.tsx` | Source-linked Field Guide and on-demand previews |
| `components/matter/ResearchExplorer.tsx` | Dataset search, filtering, and plot integration |
| `components/matter/ResearchPlot.tsx` | Batched canvas plotting |
| `components/matter/Glossary.tsx` and `lib/matter/glossary.json` | Contextual glossary and definitions |
| `lib/matter/catalog.ts` | Family catalog, variants, and teaching content |
| `lib/matter/expansion.ts` | Additional families and their material constraints |
| `lib/matter/expansion-references.json` | Reference-image credits and reuse information |
| `docs/ARCHITECTURE.md` | Architecture notes and future scale-up ideas |
| `docs/IMPLEMENTATION.md` | Implemented scope, verification notes, and limitations |

## Technology

React 19, TypeScript, Vinext/Vite, Three.js, Radix UI, and Tailwind CSS. Research data and reference assets are stored locally in the repository; no generative AI service is needed to run the app.

## License and asset use

Check the repository’s license files and the per-item source and license notes before redistributing code, data, or images. The research images do not all share the same reuse terms. Preserve attribution and comply with each source’s stated license or permission requirements.
