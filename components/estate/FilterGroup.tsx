import type { ReactNode } from "react";

export function FilterGroup({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return <section className="filter-group"><h3>{title}</h3>{children}{note && <p>{note}</p>}</section>;
}

export function Segmented<T extends string>({ values, value, onChange }: { values: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <div className="segmented">{values.map((item) => <button key={item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}
