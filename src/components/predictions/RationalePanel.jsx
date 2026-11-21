function Column({ title, tone, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 ${tone}`}>{title}</div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-white/50 leading-relaxed flex gap-1.5">
            <span className="text-white/20 shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RationalePanel({ rationale, notes }) {
  if (!rationale) {
    return notes ? <p className="text-sm text-white/50 leading-relaxed">{notes}</p> : null;
  }

  return (
    <div className="space-y-3">
      {rationale.verdict && (
        <p className="text-sm text-white/70 leading-relaxed">{rationale.verdict}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Column title="From the stats" tone="text-cyan-400/80" items={rationale.statistical} />
        <Column title="From the cosmos" tone="text-violet-400/80" items={rationale.cosmic} />
      </div>
    </div>
  );
}