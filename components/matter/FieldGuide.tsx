"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CirclePlay,
  Layers3,
} from "lucide-react";
import { families } from "@/lib/matter/catalog";
import { materialCards, structureCards } from "@/lib/matter/learning";
import { GlossaryText } from "./Glossary";
import MiniLattice from "./MiniLattice";

type GuideMode = "structure" | "application";

type FieldGuideProps = {
  onOpenStudio: (familyIndex: number, variantIndex: number, mode: GuideMode) => void;
};

const beginnerSummaries: Record<string, string> = {
  gyroid:
    "A smooth, continuous network that guides force through curved paths instead of sharp beam joints.",
  octet:
    "A triangle-based frame that distributes a load through several straight struts.",
  auxetic:
    "An inward-folded cell whose ribs can rotate outward as it is pulled.",
  kelvin:
    "A foam-like 3D cell that can bend through its open edges when compressed.",
  honeycomb:
    "A familiar hexagonal core that supports differently depending on its direction.",
  resonator:
    "A small mass on a flexible link that reacts most strongly near one vibration range.",
  metalens:
    "A flat optical surface whose tiny posts shape light into a focused wavefront.",
  cloak:
    "A graded shell that routes selected microwaves around a hidden region.",
  "membrane-absorber":
    "A thin resonant sheet that turns selected low-frequency sound into heat.",
  "thermal-cloak":
    "A layered plate that sends conducted heat around a protected centre.",
  topological:
    "A patterned wave lattice with an edge route that can bend around some defects.",
  flux:
    "A nested magnetic shell that gathers an existing field into a small sensor gap.",
};

const tryPrompts: Record<string, string> = {
  gyroid: "Drag the model and follow one curved path without finding a sharp corner.",
  octet: "Look for triangles. Notice how several struts can share a single load.",
  auxetic: "Find the ribs that point inward. Imagine those ribs rotating when the cell is pulled.",
  kelvin: "Look at the open edges. Imagine them bending as the cell is squeezed.",
  honeycomb: "Rotate from top to side. Notice how the direction of the cells changes the support.",
  resonator: "Find the inner mass and the flexible link that lets it move near a selected frequency.",
  metalens: "Compare equal-height posts with a height gradient. The gradient gives the light a curved wavefront.",
  cloak: "Follow the microwave paths around the empty centre. Then switch variants and notice the shell spacing change.",
  "membrane-absorber": "Watch the thin membranes move. They absorb best near their tuned resonance, not at every pitch.",
  "thermal-cloak": "Trace the heat dots around the protected centre. The core warms later, but it does not stay cold forever.",
  topological: "Follow the bright packet along the boundary, then inspect the corner where the edge route bends.",
  flux: "Follow the field lines into the narrow centre. The shell gathers an existing field instead of creating one.",
};

export default function FieldGuide({ onOpenStudio }: FieldGuideProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const family = families[activeIndex];
  const reference = structureCards.find((card) => card.id === family.id);

  return (
    <section className="field-guide-v2" aria-label="Structure field guide">
      <section className="field-guide-v2__materials" aria-labelledby="starting-materials">
        <div className="field-guide-v2__section-heading">
          <div>
            <span className="eyebrow">01 / START WITH THE SUBSTANCE</span>
            <h2 id="starting-materials">The material gives the first behavior.</h2>
          </div>
          <p>
            These real examples anchor the choices in the Material Studio.
            Manufacturing method and grade can change what each one does.
          </p>
        </div>
        <div className="field-guide-v2__material-grid">
          {materialCards.map((card) => (
            <article className="field-guide-v2__material-card" key={card.id}>
              <img src={card.image} alt={card.alt} loading="lazy" decoding="async" />
              <div>
                <span>{card.eyebrow.replace("BASE MATERIAL · ", "")}</span>
                <h3>{card.title}</h3>
                <p>{card.note}</p>
                <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                  View reference <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="field-guide-v2__cells" aria-labelledby="cell-lessons">
        <div className="field-guide-v2__section-heading field-guide-v2__section-heading--cells">
          <div>
            <span className="eyebrow">02 / CHOOSE A REPEATED CELL</span>
            <h2 id="cell-lessons">One cell, examined properly.</h2>
          </div>
          <p>
            Select a structure to compare its real reference, its 3D geometry,
            and one practical question it may help answer.
          </p>
        </div>

        <div
          className="field-guide-v2__lesson-layout"
          style={{ "--lesson-color": family.color } as CSSProperties}
        >
          <nav className="field-guide-v2__cell-chooser" aria-label="Choose a structure">
            <div className="field-guide-v2__chooser-heading">
              <span>STRUCTURES</span>
              <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(families.length).padStart(2, "0")}</strong>
            </div>
            {families.map((item, index) => {
              const itemReference = structureCards.find((card) => card.id === item.id);
              return (
                <button
                  className={index === activeIndex ? "active" : ""}
                  aria-current={index === activeIndex ? "true" : undefined}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                >
                  {itemReference && (
                    <img src={itemReference.image} alt="" loading="lazy" decoding="async" />
                  )}
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.tag}</small>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              );
            })}
          </nav>

          <article className="field-guide-v2__lesson" key={family.id}>
            <header className="field-guide-v2__lesson-header">
              <span>{String(activeIndex + 1).padStart(2, "0")} / {family.category}</span>
              <div>
                <h3>{family.name}</h3>
                <p>{beginnerSummaries[family.id]}</p>
              </div>
              <span className="field-guide-v2__behavior-tag">{family.tag}</span>
            </header>

            <div className="field-guide-v2__lesson-visuals">
              <figure className="field-guide-v2__reference-figure">
                {reference && <img src={reference.image} alt={reference.alt} decoding="async" />}
                <figcaption>
                  <span>START HERE</span>
                  <strong>{reference?.eyebrow.split(" · ")[0] ?? "REAL REFERENCE"}</strong>
                </figcaption>
              </figure>
              <div className="field-guide-v2__visual-arrow" aria-hidden="true">
                <ArrowRight size={19} />
                <span>ENGINEER</span>
              </div>
              <figure className="field-guide-v2__lattice-figure">
                <MiniLattice kind={family.id} color={family.color} />
                <figcaption>
                  <span>REPEAT THIS CELL</span>
                  <strong>Live 3D model</strong>
                </figcaption>
              </figure>
            </div>

            <div className="field-guide-v2__lesson-notice">
              <BookOpen size={17} aria-hidden="true" />
              <div>
                <span>TRY THIS</span>
                <p>{tryPrompts[family.id]}</p>
              </div>
            </div>

            <div className="field-guide-v2__lesson-explainer">
              <div>
                <span>WHAT CHANGED</span>
                <p><GlossaryText>{family.origin}</GlossaryText></p>
              </div>
              <div>
                <span>WHAT HAPPENS</span>
                <p><GlossaryText>{family.mechanism}</GlossaryText></p>
              </div>
            </div>

            <div className="field-guide-v2__lesson-use">
              <Layers3 size={21} aria-hidden="true" />
              <div>
                <span>CANDIDATE USE</span>
                <strong>{family.application}</strong>
                <p>{family.applicationLesson}</p>
              </div>
            </div>

            <details className="field-guide-v2__details">
              <summary>
                More about this cell <ChevronRight size={16} aria-hidden="true" />
              </summary>
              <div>
                <p>
                  These variants change the same basic cell. They are useful
                  comparisons, not finished product specifications.
                </p>
                <div className="field-guide-v2__variant-buttons">
                  {family.variants.map((name, variantIndex) => (
                    <button
                      key={name}
                      onClick={() => onOpenStudio(activeIndex, variantIndex, "structure")}
                    >
                      <span>{String(variantIndex + 1).padStart(2, "0")}</span>
                      {name}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <a href={family.source} target="_blank" rel="noreferrer">
                  Read the source <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </details>

            <div className="field-guide-v2__lesson-actions">
              <button onClick={() => onOpenStudio(activeIndex, 0, "structure")}>
                <CirclePlay size={18} aria-hidden="true" />
                Open {family.name} in 3D
              </button>
              <button onClick={() => onOpenStudio(activeIndex, 0, "application")}>
                See the candidate use <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
