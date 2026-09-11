"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BookOpen, X } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import entries from "@/lib/matter/glossary.json";

type Entry = (typeof entries)[number];
type DefinitionEntry = Entry | {
  id: "selected-phrase";
  term: string;
  definition: string;
  context: string;
};
const normalize = (s: string) => s.toLowerCase().replace(/[–−]/g, "-").trim();
const terms = new Map<string, Entry>();
for (const e of entries)
  for (const alias of [e.term, ...e.aliases]) {
    terms.set(normalize(alias), e);
    terms.set(normalize(alias) + "s", e);
  }
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const conciseDefinition = (text: string) => {
  const withoutLabel = text.replace(/^(Definition|Key point):\s*/i, "").trim();
  // A quick definition should answer the question at a glance. The source copy
  // can contain a follow-up sentence, but the popover deliberately keeps the
  // first complete thought so it stays useful beside the 3D workbench.
  return withoutLabel.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? withoutLabel;
};
const pattern = new RegExp(
  `\\b(${[...terms.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|")})\\b`,
  "gi",
);
export function lookupTerm(text: string) {
  return (
    terms.get(normalize(text)) ??
    terms.get(normalize(text.match(pattern)?.[0] ?? ""))
  );
}
type Explain = (entry: DefinitionEntry, rect: DOMRect, source?: HTMLElement) => void;
const Context = createContext<Explain>(() => {});

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<DefinitionEntry | null>(null);
  const [open, setOpen] = useState(false);
  const origin = useRef<HTMLElement | undefined>(undefined);
  const rect = useRef<DOMRect>({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  });
  const virtual = useRef({ getBoundingClientRect: () => rect.current });
  const explain: Explain = (e, r, source) => {
    rect.current = r;
    origin.current = source;
    setEntry(e);
    setOpen(true);
  };
  useEffect(() => {
    const show = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          text: string;
          rect: DOMRect;
          source?: HTMLElement;
        }>
      ).detail;
      const found = lookupTerm(detail.text);
      if (found) explain(found, detail.rect, detail.source);
    };
    window.addEventListener("matter:explain", show);
    return () => window.removeEventListener("matter:explain", show);
  }, []);
  const selected = (target?: EventTarget | null) => {
    // A click on a glossary button should use its precise anchor, not the
    // browser's previous selection. Form controls and links are not lesson text.
    if (target instanceof Element && target.closest("button, input, select, textarea, a")) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim().replace(/\s+/g, " ");
    if (!text || text.length < 2 || text.length > 90 || !selection?.rangeCount) return;
    const found = lookupTerm(text);
    const range = selection.getRangeAt(0);
    if (found) {
      const matched = text.match(pattern)?.[0] ?? found.term;
      explain({ ...found, term: matched }, range.getBoundingClientRect());
      return;
    }
    // Do not invent a scientific explanation for unknown text. Still give the
    // learner useful feedback and a clear route back to the curated glossary.
    explain(
      {
        id: "selected-phrase",
        term: text,
        definition: "This phrase is not in the quick glossary yet, so no scientific definition is shown for it.",
        context: "Try selecting a shorter technical term, or select a dotted term to open a verified beginner explanation.",
      },
      range.getBoundingClientRect(),
    );
  };
  return (
    <Context.Provider value={explain}>
      <div
        className="glossary-selection-surface"
        onPointerUp={(e) => {
          // Let the browser finish updating the selection before measuring it.
          window.requestAnimationFrame(() => selected(e.target));
        }}
        onKeyUp={(e) => {
          if (
            e.key === "Shift" ||
            e.key === "a" ||
            e.key.startsWith("Arrow")
          ) {
            window.requestAnimationFrame(() => selected(e.target));
          }
        }}
      >
        {children}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor virtualRef={virtual} />
        <PopoverContent
          className="definition-popover selection-definition-popover"
          aria-label={entry ? `${entry.term} definition` : "Definition"}
          side="top"
          sideOffset={12}
          collisionPadding={18}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            origin.current?.focus({ preventScroll: true });
          }}
        >
          {entry && (
            <>
              <div className="definition-kicker">
                <BookOpen size={15} />
                {entry.id === "selected-phrase" ? "SELECTED PHRASE" : "A QUICK DEFINITION"}
                <button
                  aria-label="Close definition"
                  onClick={() => setOpen(false)}
                >
                  <X size={17} />
                </button>
              </div>
              <h2>{entry.term}</h2>
              <p>{conciseDefinition(entry.definition)}</p>
              <p className="definition-context">{conciseDefinition(entry.context)}</p>
            </>
          )}
        </PopoverContent>
      </Popover>
    </Context.Provider>
  );
}

/** Adds a quiet, keyboard-accessible definition to the first occurrence of each term. */
export function GlossaryText({ children }: { children: string }) {
  const explain = useContext(Context);
  const seen = new Set<string>();
  return (
    <>
      {children.split(pattern).map((part, i) => {
        const entry = terms.get(normalize(part));
        if (!entry || seen.has(entry.id)) return part;
        seen.add(entry.id);
        return (
          <button
            key={i}
            type="button"
            className="jargon"
            aria-haspopup="dialog"
            aria-label={`Define ${part}`}
            onClick={(e) =>
              explain(
                { ...entry, term: part },
                e.currentTarget.getBoundingClientRect(),
                e.currentTarget,
              )
            }
          >
            {part}
          </button>
        );
      })}
    </>
  );
}
