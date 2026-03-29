import { useEffect, useRef, useState, useCallback } from "react";

interface Point { x: number; y: number }

function bottomOf(el: HTMLElement, c: HTMLElement): Point {
  const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height };
}
function topOf(el: HTMLElement, c: HTMLElement): Point {
  const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top };
}
function rightOf(el: HTMLElement, c: HTMLElement): Point {
  const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { x: r.left - cr.left + r.width, y: r.top - cr.top + r.height / 2 };
}
function leftOf(el: HTMLElement, c: HTMLElement): Point {
  const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { x: r.left - cr.left, y: r.top - cr.top + r.height / 2 };
}

interface Arrow { from: Point; to: Point; label?: string; labelIcon?: string }

function ArrowLine({ from, to, label, labelIcon }: Arrow) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;
  const s = 6 / len;
  const f = { x: from.x + dx * s, y: from.y + dy * s };
  const t = { x: to.x - dx * s, y: to.y - dy * s };
  const mid = { x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 };
  // For horizontal arrows, place label above the line
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const labelY = isHorizontal ? mid.y - 22 : mid.y - 10;

  return (
    <g>
      <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#64748b" strokeWidth={1.5} markerEnd="url(#ah)" />
      {label && (
        <foreignObject x={mid.x - 60} y={labelY} width={120} height={24}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            {labelIcon && <img src={labelIcon} alt="" style={{ width: 16, height: 16 }} />}
            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{label}</span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function Card({ imgSrc, alt, label, cardRef, imgRef, width, href }: {
  imgSrc: string; alt: string; label: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
  imgRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  href?: string;
}) {
  const img = <img src={imgSrc} alt={alt} className="w-full block" />;
  return (
    <div ref={cardRef} className="flex flex-col items-center shrink-0" style={{ width }}>
      <div ref={imgRef} className="rounded-lg border border-slate-700 overflow-hidden shadow-md hover:border-slate-500 transition-colors">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer">{img}</a>
          : img}
      </div>
      <span className="mt-2 text-xs text-slate-400 text-center font-medium">{label}</span>
    </div>
  );
}

export function VerificationChain() {
  const cRef = useRef<HTMLDivElement>(null);
  // Image wrapper refs (for arrow start/end on the image, not the label)
  const phbImgRef = useRef<HTMLDivElement>(null);
  const qaImgRef = useRef<HTMLDivElement>(null);
  const quintImgRef = useRef<HTMLDivElement>(null);
  const xstateImgRef = useRef<HTMLDivElement>(null);
  const reactImgRef = useRef<HTMLDivElement>(null);
  // Card refs (for layout)
  const phbRef = useRef<HTMLDivElement>(null);
  const qaRef = useRef<HTMLDivElement>(null);
  const quintRef = useRef<HTMLDivElement>(null);
  const xstateRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);

  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vertical, setVertical] = useState(false);

  const recalc = useCallback(() => {
    const c = cRef.current;
    if (!c || !phbImgRef.current || !qaImgRef.current || !quintImgRef.current || !xstateImgRef.current || !reactImgRef.current) return;
    const cr = c.getBoundingClientRect();
    const v = cr.width < 768;
    setVertical(v);
    // Need to defer size update to after layout settles
    requestAnimationFrame(() => {
      const cr2 = c.getBoundingClientRect();
      setSize({ w: cr2.width, h: cr2.height });
    });

    const a: Arrow[] = [];
    if (v) {
      a.push({ from: bottomOf(phbImgRef.current, c), to: topOf(quintImgRef.current, c), label: "LLM-formalized", labelIcon: "/static/blog/dnd-quint/claude-emblem.png" });
      a.push({ from: bottomOf(qaImgRef.current, c), to: topOf(quintImgRef.current, c), label: "LLM-translated", labelIcon: "/static/blog/dnd-quint/claude-emblem.png" });
      a.push({ from: bottomOf(quintImgRef.current, c), to: topOf(xstateImgRef.current, c), label: "MBT traces" });
      a.push({ from: bottomOf(xstateImgRef.current, c), to: topOf(reactImgRef.current, c) });
    } else {
      a.push({ from: bottomOf(phbImgRef.current, c), to: topOf(quintImgRef.current, c), label: "LLM-formalized", labelIcon: "/static/blog/dnd-quint/claude-emblem.png" });
      a.push({ from: bottomOf(qaImgRef.current, c), to: topOf(quintImgRef.current, c), label: "LLM-translated", labelIcon: "/static/blog/dnd-quint/claude-emblem.png" });
      a.push({ from: rightOf(quintImgRef.current, c), to: leftOf(xstateImgRef.current, c), label: "MBT traces" });
      a.push({ from: rightOf(xstateImgRef.current, c), to: leftOf(reactImgRef.current, c) });
    }
    setArrows(a);
  }, []);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  useEffect(() => {
    const imgs = cRef.current?.querySelectorAll("img");
    if (!imgs) return;
    let loaded = 0;
    const onLoad = () => { loaded++; if (loaded >= imgs.length) setTimeout(recalc, 50); };
    imgs.forEach(img => { if (img.complete) loaded++; else img.addEventListener("load", onLoad); });
    if (loaded >= imgs.length) setTimeout(recalc, 50);
    return () => { imgs.forEach(img => img.removeEventListener("load", onLoad)); };
  }, [recalc]);

  return (
    <div ref={cRef} className="not-prose my-8 relative">
      <svg className="absolute inset-0 pointer-events-none" width={size.w} height={size.h} style={{ overflow: "visible" }}>
        <defs>
          <marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>
        {arrows.map((a, i) => <ArrowLine key={i} {...a} />)}
      </svg>

      <div className={`flex flex-col items-center ${vertical ? "gap-10 px-4" : "gap-2"}`}>
        {/* Inputs row */}
        <div className="flex flex-row items-start justify-center gap-6">
          <Card cardRef={phbRef} imgRef={phbImgRef} imgSrc="/static/blog/dnd-quint/phb-cover.jpg" alt="D&D Player's Handbook" label="SRD rules text" width={vertical ? 130 : 120} href="https://www.dndbeyond.com/resources/1781-systems-reference-document-srd" />
          <Card cardRef={qaRef} imgRef={qaImgRef} imgSrc="/static/blog/dnd-quint/stackexchange-grapple-leapfrog.png" alt="StackExchange D&D rules question" label="12K community Q&A" width={vertical ? 130 : 120} href="https://rpg.stackexchange.com/questions/tagged/dnd-5e-2024" />
        </div>
        {/* Spacer for converging arrows */}
        <div className={vertical ? "h-12" : "h-10"} />
        {/* Main chain — wider gaps for horizontal arrows */}
        <div className={`flex ${vertical ? "flex-col items-center gap-10" : "flex-row items-center justify-center gap-16"}`}>
          <Card cardRef={quintRef} imgRef={quintImgRef} imgSrc="/static/blog/dnd-quint/quint-prone-lock-code.png" alt="Quint formal spec code" label="Quint spec" width={180} href="https://github.com/dearlordylord/5e-quint/blob/master/dnd.qnt" />
          <Card cardRef={xstateRef} imgRef={xstateImgRef} imgSrc="/static/blog/dnd-quint/xstate-machine-viz.png" alt="XState state machine diagram" label="XState machine" width={180} href="https://xstate.js.org/" />
          <Card cardRef={reactRef} imgRef={reactImgRef} imgSrc="/static/blog/dnd-quint/demo-ui-screenshot.png" alt="React UI demo" label="React UI" width={180} href="http://dnd-quint.dearlordylord.com/" />
        </div>
      </div>
    </div>
  );
}
