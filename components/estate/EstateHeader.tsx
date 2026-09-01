"use client";

import { useEstate } from "./EstateProvider";

export function EstateHeader() {
  const { model, counts, visibleUnits, admin, setAdmin } = useEstate();
  return <header className="estate-header">
    <div className="estate-brand"><strong>{model.meta.estate}</strong><small>IBEFUN · OGUN STATE · 150 HA PHASE</small></div>
    <div className="estate-tally">
      <span><i className="dot available" /> <b>{counts.available.toLocaleString()}</b> Available</span>
      <span><i className="dot allocated" /> <b>{counts.allocated.toLocaleString()}</b> Allocated</span>
      <span><i className="dot reserved" /> <b>{counts.reserved.toLocaleString()}</b> Reserved</span>
      <span><b>{visibleUnits.length.toLocaleString()}</b> Shown</span>
      <label className="admin-toggle"><input type="checkbox" checked={admin} onChange={(event) => setAdmin(event.target.checked)} /><i /> Admin</label>
      <button className="estate-button">Auto⌄</button>
    </div>
  </header>;
}
