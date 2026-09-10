# Matter | Metamaterial Studio

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
- Structure, illustrative behavior, and six distinct product applications: detailed running shoe and athlete, aircraft wing, fitted knee protection, cycling helmet, honeycomb skateboard, and motor isolation mount.
- Shoe anatomy includes mesh vamp, tongue, laces, eyelets, padded collar, heel counter, sockliner, strobel board, cellular midsole and traction outsole.
- Exploded product assemblies, projected component labels, motion speed and 18 variant-specific learning notes. The running animation uses two-link leg IK, opposing arms, stance and airborne intervals.
- Two-phase material composition exploration with ideal Voigt/Reuss solid-modulus bounds and an illustrative lattice scaling law.
- ReUI dropdown action menu and full-width icon tabs, matching accessible material selectors, self-hosted Inter typography and a 3D lattice logo.
- Visual field guide with demand-rendered, rotatable lattices, concise explanations, expandable origins and direct variant links.
- 77 contextual definitions: click dotted terms, highlight known jargon, or activate a 3D component label. Keyboard activation and Escape dismissal are supported.
- Detailed fitted knee brace with tension dial and patella ring, ankle/collar alignment, vented helmet with a gravity-based slow-motion drop, and aft-swept aircraft tail surfaces.
- 20,520 real UCI elastodynamic dataset rows, center/width filtering, exact stable top-five matches, a batched canvas plot, source attribution and export.
- CSV/JSON import, positive-unit validation, evidence labels, source URLs, supported-family 3D mapping and JSON export. Imported data is kept only for the current tab session; export to retain it.
- A source research catalog of nine families and three open datasets.

## Scientific limits

This is a concept-learning prototype, not a materials discovery engine, FEA solver, or manufacturing certification tool. Density is an illustrative family-specific model, not integrated mesh volume. Modulus estimates do not constitute measured predictions. Composition bounds assume ideal linear elastic phases; bonding, processing, anisotropy and print defects are not solved. The gyroid field is a trigonometric approximation rather than an exact minimal surface. The standalone honeycomb view is an edge-frame schematic; the skateboard application uses vertical hexagonal shell walls. Finite arrays show boundaries. Cutaway does not generate capped cross-sections. Most deformation uses illustrative affine compression rather than local finite-element physics. Resonator masses have relative animated displacement, but no dynamic solution is computed. Application scenes use detailed procedural illustrations, not photoreal scanned people or validated use-case assets. The product envelopes normalize geometry for teaching: they are not dimensionally calibrated CAD. The three variants in each family share its product context while changing the internal lattice and teaching note.

The catalog is curated, not exhaustive. Optical, thermal and electromagnetic families are research references only, not interactive 3D modes. The UCI encoded 15-bit design is displayed as a code, not falsely reconstructed as its 10x10 geometry.

## Data provenance

`public/data/elastodynamic.json` contains original attribution, CC BY 4.0 license, original URLs, archive/CSV SHA-256 hashes, declared units, normalization notes and the repository row-count discrepancy. The repository lists 20,521; the downloaded CSV contains 20,520 data rows plus one header.

`public/data/research.json` contains additional primary research sources. Imported user records retain their evidence label; the app validates their format, not their truth.

## Main files

- `components/matter/Studio.tsx`: workspace, controls and import/export.
- `components/matter/Scene.tsx`: WebGL rendering and projected annotations.
- `lib/matter/geometry.ts`: shared procedural lattice topology for the studio and card previews.
- `components/matter/Glossary.tsx` and `lib/matter/glossary.json`: contextual definitions.
- `components/matter/ReuiControls.tsx`: adapted ReUI c-dropdown-menu-1 and c-tabs-6 patterns.
- `lib/matter/research.ts` and `components/matter/ResearchPlot.tsx`: exact nearest-match query and canvas rendering.
- `components/matter/models/`: separate product assemblies, shoe anatomy, kinematic athlete and shared mesh primitives.
- `components/matter/SoftwareRenderer.ts`: software geometry projection fallback.
- `components/matter/ResearchExplorer.tsx`: actual UCI dataset exploration.
- `lib/matter/catalog.ts`: curated educational content and illustrative base values.
- `docs/ARCHITECTURE.md`: PRD/ARD and proposed scale-up architecture. Its future architecture must not be confused with features implemented here.
- `docs/IMPLEMENTATION.md`: tested scope, limitations and next integration steps.

## Blender and Unity

No Blender or Unity MCP endpoint was available or connected during this build. The website does not require either to run. Manual setup paths and primary repository references are in `docs/ARCHITECTURE.md`. Import reviewed glTF/GLB assets through Three.js for higher fidelity characters and authored animation; exported assets should be versioned rather than requiring live MCP in production.
