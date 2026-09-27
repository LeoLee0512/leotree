import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import "katex/dist/katex.min.css";
import { hasMath, parseMathSegments } from "@/lib/math-text";
import { useI18n } from "@/lib/i18n";

// The KaTeX script (not its stylesheet) is loaded lazily so pages without formulas never pay for it.
type KatexModule = typeof import("katex");
let katexPromise: Promise<KatexModule> | null = null;
function loadKatex(): Promise<KatexModule> {
  katexPromise ??= import("katex");
  return katexPromise;
}

/** Renders one formula once KaTeX is available; shows the source until then. */
function MathSpan({ tex, display }: { tex: string; display: boolean }) {
  const [state, setState] = useState<{ html?: string; error?: boolean }>({});
  useEffect(() => {
    let alive = true;
    loadKatex()
      .then((k) => {
        if (!alive) return;
        try {
          setState({ html: k.renderToString(tex, { displayMode: display, throwOnError: true }) });
        } catch {
          setState({ error: true });
        }
      })
      .catch(() => {
        if (alive) setState({ error: true });
      });
    return () => {
      alive = false;
    };
  }, [tex, display]);
  if (state.error) return <code className="math-src math-bad">{display ? `$$${tex}$$` : `$${tex}$`}</code>;
  if (!state.html) return <code className="math-src">{display ? `$$${tex}$$` : `$${tex}$`}</code>;
  return <span className={display ? "math-block" : "math-inline"} dangerouslySetInnerHTML={{ __html: state.html }} />;
}

/** Text with $...$ / $$...$$ segments rendered as real math. */
export function MathText({ text }: { text: string }) {
  const segs = useMemo(() => parseMathSegments(text ?? ""), [text]);
  if (!segs.some((s) => s.kind !== "text")) return <>{text}</>;
  return (
    <>
      {segs.map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.value}</span>
        ) : (
          <MathSpan key={i} tex={s.tex} display={s.kind === "display"} />
        ),
      )}
    </>
  );
}

/**
 * Click-to-insert LaTeX snippets. «…» marks the span selected after insertion.
 * `label` is either a literal symbol or an i18n key (when `labelKey` is set).
 */
type Snippet = { label: string; tex: string; labelKey?: MathKey };
type MathKey = "mathFrac" | "mathSquare" | "mathPower" | "mathSub" | "mathSqrt" | "mathNthRoot" | "mathSum" | "mathProd" | "mathInt" | "mathLim" | "mathParens" | "mathAbs" | "mathBinom" | "mathVector" | "mathHat" | "mathMean" | "mathMatrix" | "mathCases";
type GroupKey = "mathGreek" | "mathRelations" | "mathFunctions" | "mathComposite";

const PRIMARY: Snippet[] = [
  { label: "", labelKey: "mathFrac", tex: "\\frac{«a»}{b}" },
  { label: "", labelKey: "mathSquare", tex: "^{«2»}" },
  { label: "", labelKey: "mathPower", tex: "^{«n»}" },
  { label: "", labelKey: "mathSub", tex: "_{«n»}" },
  { label: "", labelKey: "mathSqrt", tex: "\\sqrt{«x»}" },
  { label: "", labelKey: "mathNthRoot", tex: "\\sqrt[«n»]{x}" },
  { label: "±", tex: "\\pm" },
  { label: "×", tex: "\\times" },
  { label: "÷", tex: "\\div" },
  { label: "·", tex: "\\cdot" },
  { label: "", labelKey: "mathSum", tex: "\\sum_{«i=1»}^{n}" },
  { label: "", labelKey: "mathProd", tex: "\\prod_{«i=1»}^{n}" },
  { label: "", labelKey: "mathInt", tex: "\\int_{«a»}^{b}" },
  { label: "", labelKey: "mathLim", tex: "\\lim_{«x \\to 0»}" },
  { label: "", labelKey: "mathParens", tex: "\\left(«»\\right)" },
  { label: "", labelKey: "mathAbs", tex: "\\left|«x»\\right|" },
];

const GROUPS: Array<{ name: GroupKey; items: Snippet[] }> = [
  {
    name: "mathGreek",
    items: [
      { label: "α", tex: "\\alpha" }, { label: "β", tex: "\\beta" }, { label: "γ", tex: "\\gamma" },
      { label: "δ", tex: "\\delta" }, { label: "ε", tex: "\\epsilon" }, { label: "ζ", tex: "\\zeta" },
      { label: "η", tex: "\\eta" }, { label: "θ", tex: "\\theta" }, { label: "κ", tex: "\\kappa" },
      { label: "λ", tex: "\\lambda" }, { label: "μ", tex: "\\mu" }, { label: "ν", tex: "\\nu" },
      { label: "ξ", tex: "\\xi" }, { label: "π", tex: "\\pi" }, { label: "ρ", tex: "\\rho" },
      { label: "σ", tex: "\\sigma" }, { label: "τ", tex: "\\tau" }, { label: "φ", tex: "\\phi" },
      { label: "ψ", tex: "\\psi" }, { label: "ω", tex: "\\omega" }, { label: "Γ", tex: "\\Gamma" },
      { label: "Δ", tex: "\\Delta" }, { label: "Θ", tex: "\\Theta" }, { label: "Λ", tex: "\\Lambda" },
      { label: "Σ", tex: "\\Sigma" }, { label: "Φ", tex: "\\Phi" }, { label: "Ω", tex: "\\Omega" },
    ],
  },
  {
    name: "mathRelations",
    items: [
      { label: "≠", tex: "\\neq" }, { label: "≤", tex: "\\leq" }, { label: "≥", tex: "\\geq" },
      { label: "≈", tex: "\\approx" }, { label: "≡", tex: "\\equiv" }, { label: "∝", tex: "\\propto" },
      { label: "∞", tex: "\\infty" }, { label: "∈", tex: "\\in" }, { label: "⊂", tex: "\\subset" },
      { label: "∪", tex: "\\cup" }, { label: "∩", tex: "\\cap" }, { label: "∅", tex: "\\emptyset" },
      { label: "→", tex: "\\to" }, { label: "⇒", tex: "\\Rightarrow" }, { label: "↔", tex: "\\leftrightarrow" },
    ],
  },
  {
    name: "mathFunctions",
    items: [
      { label: "sin", tex: "\\sin" }, { label: "cos", tex: "\\cos" }, { label: "tan", tex: "\\tan" },
      { label: "cot", tex: "\\cot" }, { label: "ln", tex: "\\ln" }, { label: "log", tex: "\\log" },
      { label: "exp", tex: "\\exp" }, { label: "max", tex: "\\max" }, { label: "min", tex: "\\min" },
      { label: "mod", tex: "\\bmod" }, { label: "eˣ", tex: "e^{«x»}" }, { label: "|x|", tex: "\\left|«x»\\right|" },
    ],
  },
  {
    name: "mathComposite",
    items: [
      { label: "", labelKey: "mathBinom", tex: "\\binom{«n»}{k}" },
      { label: "", labelKey: "mathVector", tex: "\\vec{«v»}" },
      { label: "", labelKey: "mathHat", tex: "\\hat{«x»}" },
      { label: "", labelKey: "mathMean", tex: "\\bar{«x»}" },
      { label: "", labelKey: "mathMatrix", tex: "\\begin{pmatrix} «a» & b \\\\ c & d \\end{pmatrix}" },
      { label: "", labelKey: "mathCases", tex: "\\begin{cases} «» \\end{cases}" },
    ],
  },
];

function SnippetChip({ snippet, insert, onPick }: { snippet: Snippet; insert: (tex: string) => void; onPick?: () => void }) {
  const { t } = useI18n();
  const label = snippet.labelKey ? t(snippet.labelKey) : snippet.label;
  return (
    <button
      type="button"
      className="math-chip"
      title={snippet.tex.replace(/[«»]/g, "")}
      onClick={() => {
        insert(snippet.tex);
        onPick?.();
      }}
    >
      {label}
    </button>
  );
}

function PaletteBody({ insert, onPick }: { insert: (tex: string) => void; onPick?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="math-palette">
      <div className="math-cat">{t("mathCommon")}</div>
      <div className="math-grid">{PRIMARY.map((s) => <SnippetChip key={s.tex} snippet={s} insert={insert} onPick={onPick} />)}</div>
      {GROUPS.map((g) => (
        <Fragment key={g.name}>
          <div className="math-cat">{t(g.name)}</div>
          <div className="math-grid">{g.items.map((s) => <SnippetChip key={s.tex} snippet={s} insert={insert} onPick={onPick} />)}</div>
        </Fragment>
      ))}
      <p className="math-tip">{t("mathTip")}</p>
    </div>
  );
}

/**
 * Textarea with a LaTeX palette and a live rendered preview.
 * variant="full" shows the always-on toolbar (node notes);
 * variant="compact" shows a single ƒ⁺ popover trigger (log fields).
 */
export function MathEditor({
  value,
  onChange,
  label,
  placeholder,
  rows,
  variant = "full",
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: ReactNode;
  placeholder?: string;
  rows?: number;
  variant?: "full" | "compact";
  ariaLabel?: string;
}) {
  const { t } = useI18n();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSel = useRef<[number, number] | null>(null);

  // restore caret/selection after the controlled value re-render
  useEffect(() => {
    const ta = taRef.current;
    if (ta && pendingSel.current) {
      const [a, b] = pendingSel.current;
      pendingSel.current = null;
      ta.focus();
      ta.setSelectionRange(a, b);
    }
  }, [value]);

  const insert = (tex: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart ?? ta.value.length;
    const e = ta.selectionEnd ?? s;
    const open = tex.indexOf("«");
    const close = tex.lastIndexOf("»");
    const clean = tex.replace(/[«»]/g, "");
    pendingSel.current =
      open !== -1 && close > open ? [s + open, s + close - 1] : [s + clean.length, s + clean.length];
    onChange(ta.value.slice(0, s) + clean + ta.value.slice(e));
  };

  const preview = hasMath(value) ? (
    <div className="math-preview" aria-hidden="true">
      <span className="math-preview-cap">{t("livePreview")}</span>
      <MathText text={value} />
    </div>
  ) : null;

  const labelled = ariaLabel ?? (typeof label === "string" ? label : undefined);

  if (variant === "compact") {
    return (
      <div className="field math-field">
        <div className="math-field-hd">
          <span className="math-field-label">{label}</span>
          <Popover.Root>
            <Popover.Trigger asChild>
              <button type="button" className="math-pop-trigger" aria-label={t("insertFormula")}>
                {t("formulaBtn")}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="math-sheet" align="end" sideOffset={6} collisionPadding={12} aria-label={t("insertFormula")}>
                <PaletteBody insert={insert} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <textarea ref={taRef} aria-label={labelled} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        {preview}
      </div>
    );
  }

  return (
    <div className="math-field">
      <div className="math-field-hd">
        <span className="math-field-label">{label}</span>
        <span className="math-hint">{t("mathHint")}</span>
      </div>
      <div className="math-toolbar">
        {PRIMARY.map((s) => <SnippetChip key={s.tex} snippet={s} insert={insert} />)}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button" className="math-chip math-more">
              {t("more")}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="math-sheet" align="start" sideOffset={6} collisionPadding={12} aria-label={t("moreSymbols")}>
              <PaletteBody insert={insert} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <textarea ref={taRef} aria-label={labelled} value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)} />
      {preview}
    </div>
  );
}
