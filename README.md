# Matter — Metamaterial Studio

An interactive, source-grounded learning prototype. React 19, TypeScript, Vinext, Three.js, and accessible Radix controls. No paid API or API key is required.

## Run the exported code

Install Node.js 22.13 or newer. In this folder run:

```bash
npm ci
npx vite --host 0.0.0.0
```

Open the URL printed by Vite. WebGL2 hardware acceleration gives the best lighting and performance. A software canvas renderer is included for environments where WebGL is disabled. It uses the same actual geometry, at reduced surface resolution and without physically based lighting.

For a production Cloudflare Workers build, run `npm run build` from macOS/Linux, WSL, or Git Bash (the build scripts use Bash). Deployment configuration is in `.openai/hosting.json`. The included project ID belongs to this generated Site: do not deploy an unrelated copy to that ID. To make an independent hosted project, register it through your own deployment workflow.

## Included

- Six 3D families with 18 geometry variants: gyroid, FCC octet truss, re-entrant lattice, Kelvin cell, honeycomb, local resonator.
- Repetition, thickness and cell-size controls; orbit/zoom; wireframe; cutaway; pause/resume; reset; full screen.
- Structure, illustrative behavior, and application views, including an articulated running figure wearing small shoes beside an enlarged sole cutaway.
- Two-phase material composition exploration with ideal Voigt/Reuss solid-modulus bounds and an illustrative lattice scaling law.
- Field guide with distinctions between natural analogy and mathematical origin.
- 20,520 real UCI elastodynamic dataset rows, center/width filtering, nearest matches, source attribution and export.
- CSV/JSON import, positive-unit validation, evidence labels, source URLs, supported-family 3D mapping and JSON export. Imported data is kept only for the current tab session; export to retain it.
- A source research catalog of nine families and three open datasets.

## Scientific limits

This is a concept-learning prototype, not a materials discovery engine, FEA solver, or manufacturing certification tool. Density is an illustrative family-specific model, not integrated mesh volume. Modulus estimates do not constitute measured predictions. Composition bounds assume ideal linear elastic phases; bonding, processing, anisotropy and print defects are not solved. The gyroid field is a trigonometric approximation rather than an exact minimal surface. Open-cell honeycomb is an edge-frame schematic, not a shell-wall solid. Finite arrays show boundaries. Cutaway does not generate capped cross-sections. Most deformation uses illustrative affine compression rather than local finite-element physics. Resonator masses have relative animated displacement, but no dynamic solution is computed. Application scenes use designed procedural illustrations, not photoreal scanned people or validated use-case assets.

The catalog is curated, not exhaustive. Optical, thermal and electromagnetic families are research references only, not interactive 3D modes. The UCI encoded 15-bit design is displayed as a code, not falsely reconstructed as its 10x10 geometry.

## Data provenance

`public/data/elastodynamic.json` contains original attribution, CC BY 4.0 license, original URLs, archive/CSV SHA-256 hashes, declared units, normalization notes and the repository row-count discrepancy. The repository lists 20,521; the downloaded CSV contains 20,520 data rows plus one header.

`public/data/research.json` contains additional primary research sources. Imported user records retain their evidence label; the app validates their format, not their truth.

## Main files

- `components/matter/Studio.tsx`: workspace, controls and import/export.
- `components/matter/Scene.tsx`: procedural geometry, WebGL rendering and application animation.
- `components/matter/SoftwareRenderer.ts`: software geometry projection fallback.
- `components/matter/ResearchExplorer.tsx`: actual UCI dataset exploration.
- `lib/matter/catalog.ts`: curated educational content and illustrative base values.
- `docs/ARCHITECTURE.md`: PRD/ARD and proposed scale-up architecture. Its future architecture must not be confused with features implemented here.
- `docs/IMPLEMENTATION.md`: tested scope, limitations and next integration steps.

## Blender and Unity

No Blender or Unity MCP endpoint was available or connected during this build. The website does not require either to run. Manual setup paths and primary repository references are in `docs/ARCHITECTURE.md`. Import reviewed glTF/GLB assets through Three.js for higher fidelity characters and authored animation; exported assets should be versioned rather than requiring live MCP in production.
