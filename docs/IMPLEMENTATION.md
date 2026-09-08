# Implementation status and continuation

## Delivered prototype

See README for the implemented inventory. The large input dataset is real, not generated sample data. Imported user data is session-scoped; no application database or authentication service has been configured. The existing starter database and worker files are unused examples. Hosting itself is private to the owner.

## Visual QA

The agent browser explicitly disables WebGL (GL_RENDERER=Disabled). The real-time CPU geometry fallback was implemented to permit visual inspection and maintain a usable experience. GPU materials, GPU shadows and GPU clipping could not be visually verified in that environment. Do not describe this build as photorealistic or GPU-validated. The running avatar now has a contoured torso, facial features, clothing, complete shoes and two-link leg IK; it remains a procedural illustration rather than a scanned or artist-rigged realistic human asset.

## Manual setup for higher-fidelity authoring

Install Blender on the local workstation and use the reviewed Blender MCP repository linked in ARCHITECTURE. Install its add-on, enable its local server, and connect an MCP-capable local coding client to that server. This Work chat has no connected Blender endpoint. Unity similarly requires Unity Hub, a compatible editor/project and the selected MCP package. They are optional authoring tools; a Unity scene does not automatically become this web application's renderer.

For a realistic athlete: obtain an appropriately licensed rigged character and running motion; author a shoe asset and exposed lattice sole in Blender; export validated, compressed glTF with animation clips; check foot contact, sole deformation, scale and GPU budgets in the web renderer. No such third-party character license or asset has been assumed.

## Required for a full research product

1. A defined materials domain and finite supported variant taxonomy; “all materials/all variants” has no bounded scientific catalog.
2. Background ingestion workers, durable object storage and indexed database for larger heterogeneous datasets.
3. Versioned unit normalization, duplicate handling, record-level citations and train/test provenance.
4. Validated homogenization/FEA or experimentally calibrated surrogates with uncertainty, domain-of-validity and held-out benchmark tests.
5. A curated application animation for every variant, with different measured outcomes where evidence supports them.
6. GPU QA on target desktop and mobile hardware, and a licensed cinematic asset pipeline.

These are scope boundaries and a continuation roadmap, not implemented capabilities.

## Verification performed

Production build and TypeScript no-emit validation passed. Browser checks covered rendered gyroid/octet software geometry, cutaway state, structure/behavior/application navigation, the animated shoe study, dataset loading and nearest-match selection. Imported JSON and quoted CSV append behavior was exercised; invalid dimensions, evidence labels, source URL schemes, numeric properties and unclosed CSV quotes were rejected. All 20,520 normalized research rows passed encoding and finite-number checks. No claim of real mobile-device or GPU performance benchmarking is made.

## Product visualization revision

The generic platen application scene has been removed. Six dedicated assemblies now expose cellular material inside recognizable products:

| Family          | Product and motion                                                  | Anatomy controls                                                                  |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Gyroid          | Athletic shoe with an opposing-arm running cycle, stance and flight | Upper, collar, laces, sockliner, strobel, curved gyroid midsole, traction outsole |
| Octet           | Complete aircraft with subtle banking                               | Wing inspection skin and internal octet core                                      |
| Re-entrant      | Fitted knee protection with joint flexion                           | Retention straps, sleeve, shell and re-entrant insert                             |
| Kelvin          | Vented helmet and contact marker                                    | Curved cellular liner, shell and chin straps                                      |
| Honeycomb       | Complete rolling skateboard                                         | Grip deck, vertical honeycomb walls, skins, trucks, axles and wheels              |
| Local resonator | Motor and rotating drive with relative internal-mass motion         | Motor assembly, load platform, resonators and anchored base                       |

All products have projected component labels, an explosion control and playback speed. All 18 variants have specific learning notes. A zero explosion value assembles the movable components; fixed inspection windows remain where hiding them would remove the learning objective. Motion is illustrative, and dimensions are fitted to teaching envelopes rather than physical CAD dimensions.

Geometry checks exercise all 18 product factories at three explosion states and eight time samples, using fixture cores to isolate product assembly behavior. Checks cover finite geometry/transforms, bounded extents and component anchors. IK link lengths and knee direction are checked across the stance range. A 240-sample gait test additionally verifies fixed arm lengths, outsole-ground contact during stance, non-penetration during swing, and continuity at toe-off and loop boundaries. Run `npm run test:models`. These checks do not validate lattice physics or human biomechanics. Browser inspection covers the actual core in all six product contexts.

## Next improvements, in priority order

1. Artist-authored shoe and a licensed rigged runner, exported from Blender as compressed GLB, with fabric/rubber normal maps and authored foot-strike clips. Add adaptive detail so the higher fidelity holds a measured frame budget.
2. A synchronized comparison workspace: same material, density and loading context, two variants, linked cameras and explicit geometric differences.
3. Experimentally calibrated or validated simulation responses: force-displacement curves, modal analysis and uncertainty tied to a source specimen. Do not infer these from animation.
4. Durable datasets and experiment storage; record-level provenance, geometry mapping and reproducible parameter snapshots.
5. GPU and mobile visual regression checks for every family, variant, explosion state and reduced-motion setting.

Blender and Unity MCP are still not connected to this Work environment. The source includes the existing manual connection guidance; this revision introduces no paid service dependency.
