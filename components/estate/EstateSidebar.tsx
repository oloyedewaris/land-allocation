"use client";

import { amenities } from "@/data/amenities";
import { FilterGroup, Segmented } from "./FilterGroup";
import { useEstate } from "./EstateProvider";

function toggle<T>(list: T[], value: T) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.75" cy="10.75" r="5.75" />
      <path d="m15 15 4 4" />
    </svg>
  );
}

export function EstateSidebar() {
  const {
    model, filters, setFilters, shading, setShading, statuses,
    selectUnit, focusedAmenity, setFocusedAmenity,
  } = useEstate();
  const sectors = [...new Set(model.plots.map((unit) => unit.s))].sort();
  const matches = filters.search
    ? model.plots.filter((unit) => unit.id.toLowerCase().includes(filters.search.toLowerCase())).slice(0, 8)
    : [];

  return <aside className="estate-sidebar">
    <FilterGroup title="Find a plot">
      <div className="plot-search"><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search plot" /><span><SearchIcon /></span></div>
      {matches.length > 0 && <div className="search-results">{matches.map((unit) => <button key={unit.id} onClick={() => selectUnit(unit.id)}><b>{unit.id}</b><small>{statuses[unit.id]}</small></button>)}</div>}
    </FilterGroup>
    <FilterGroup title="Status"><Segmented value={filters.status} onChange={(status) => setFilters({ ...filters, status })} values={[{ value: "all", label: "All" }, { value: "available", label: "Available" }, { value: "allocated", label: "Allocated" }]} /></FilterGroup>
    <FilterGroup title="Shading"><Segmented value={shading} onChange={setShading} values={[{ value: "realistic", label: "Realistic" }, { value: "status", label: "Status" }]} /></FilterGroup>
    <FilterGroup title="Sector"><div className="filter-chips">{sectors.map((sector) => <button key={sector} aria-pressed={filters.sectors.includes(sector)} onClick={() => setFilters({ ...filters, sectors: toggle(filters.sectors, sector) })}>{sector}</button>)}</div></FilterGroup>
    <FilterGroup title="Land use" note="Regular plot products are currently unclassified by land use."><div className="filter-chips">{["Low", "Medium", "Multi", "Comm", "Reserved", "Unclassified"].map((label) => <button key={label}>{label}</button>)}</div></FilterGroup>
    <FilterGroup title="Plot size">
      <div className="filter-chips">
        <button aria-pressed={filters.sizes.length === 0} onClick={() => setFilters({ ...filters, sizes: [] })}>Any</button>
        {[300, 500, 1000, 3000].map((size) => <button key={size} aria-pressed={filters.sizes.includes(size)} onClick={() => setFilters({ ...filters, sizes: toggle(filters.sizes, size) })}>{size.toLocaleString()} m²</button>)}
      </div>
    </FilterGroup>
    <FilterGroup title="Hatched on survey" note="Regularized demo plots are not assigned survey hatching."><Segmented value={filters.hatched} onChange={(hatched) => setFilters({ ...filters, hatched })} values={[{ value: "all", label: "All" }, { value: "hatched", label: "Hatched" }, { value: "plain", label: "Plain" }]} /></FilterGroup>
    <FilterGroup title="Amenities"><div className="amenity-list">{amenities.map((amenity, index) => <button key={amenity.name} aria-pressed={focusedAmenity === index} onClick={() => { selectUnit(null); setFocusedAmenity(index); }}><i style={{ background: amenity.color }} /><span>{amenity.name}</span><small>LOCATE</small></button>)}</div></FilterGroup>
    <FilterGroup title="Sector breakdown"><table className="sector-table"><tbody>{sectors.map((sector) => { const units = model.plots.filter((unit) => unit.s === sector); return <tr key={sector}><td>Sector {sector}</td><td>{units.length}</td><td>{(units.reduce((sum, unit) => sum + unit.a, 0) / 10000).toFixed(1)} ha</td></tr>; })}</tbody></table></FilterGroup>
  </aside>;
}
