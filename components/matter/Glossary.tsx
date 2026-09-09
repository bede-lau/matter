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
const normalize = (s: string) => s.toLowerCase().replace(/[–−]/g, "-").trim();
const terms = new Map<string, Entry>();
for (const e of entries)
  for (const alias of [e.term, ...e.aliases]) {
    terms.set(normalize(alias), e);
    terms.set(normalize(alias) + "s", e);
  }
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
type Explain = (entry: Entry, rect: DOMRect, source?: HTMLElement) => void;
const Context = createContext<Explain>(() => {});

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<Entry | null>(null);
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
  const selected = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length > 90 || !selection?.rangeCount) return;
    const found = lookupTerm(text);
    if (found) explain(found, selection.getRangeAt(0).getBoundingClientRect());
  };
  return (
    <Context.Provider value={explain}>
      <div
        onPointerUp={selected}
        onKeyUp={(e) => {
          if (e.key === "Shift") selected();
        }}
      >
        {children}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor virtualRef={virtual} />
        <PopoverContent
          className="definition-popover"
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
                <BookOpen size={15} /> A QUICK DEFINITION
                <button
                  aria-label="Close definition"
                  onClick={() => setOpen(false)}
                >
                  <X size={17} />
                </button>
              </div>
              <h2>{entry.term}</h2>
              <p>{entry.definition}</p>
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
                entry,
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
