"use client";

import siteJson from "@/data/site-model.json";
import unitsJson from "@/data/units.json";
import type {
  EstateFilters,
  EstateModel,
  EstateUnit,
  ShadingMode,
  UnitStatus,
  ViewMode,
} from "@/types/estate";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const model = { ...siteJson, plots: unitsJson } as unknown as EstateModel;
const storageKey = "ibefun-unit-statuses-v2";

function initialStatuses(units: EstateUnit[]) {
  const statuses: Record<string, UnitStatus> = {};
  let seed = 20260805;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (const unit of units)
    statuses[unit.id] = random() < 0.405 ? "allocated" : "available";
  return statuses;
}

const defaultFilters: EstateFilters = {
  status: "all",
  sectors: [],
  sizes: [],
  landUses: [],
  hatched: "all",
  search: "",
};

interface EstateContextValue {
  model: EstateModel;
  statuses: Record<string, UnitStatus>;
  filters: EstateFilters;
  setFilters: (
    value: EstateFilters | ((current: EstateFilters) => EstateFilters),
  ) => void;
  visibleUnits: EstateUnit[];
  selectedUnit?: EstateUnit;
  selectedId: string | null;
  selectUnit: (id: string | null) => void;
  setUnitStatus: (id: string, status: UnitStatus) => void;
  counts: Record<UnitStatus, number>;
  admin: boolean;
  setAdmin: (value: boolean) => void;
  shading: ShadingMode;
  setShading: (value: ShadingMode) => void;
  view: ViewMode;
  setView: (value: ViewMode) => void;
  focusedAmenity: number | null;
  setFocusedAmenity: (value: number | null) => void;
}

const EstateContext = createContext<EstateContextValue | null>(null);

export function EstateProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState(() => initialStatuses(model.plots));
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedId, selectUnit] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [shading, setShading] = useState<ShadingMode>("realistic");
  const [view, setView] = useState<ViewMode>("aerial");
  const [focusedAmenity, setFocusedAmenity] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setStatuses(JSON.parse(saved));
    } catch {
      /* use defaults */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(statuses));
  }, [statuses]);

  const setUnitStatus = useCallback((id: string, status: UnitStatus) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  }, []);

  const visibleUnits = useMemo(
    () =>
      model.plots.filter((unit) => {
        const status = statuses[unit.id];
        const query = filters.search.trim().toUpperCase();
        return (
          (!query ||
            unit.id.toUpperCase().includes(query) ||
            String(unit.n) === query) &&
          (filters.status === "all" || status === filters.status) &&
          (!filters.sectors.length || filters.sectors.includes(unit.s)) &&
          (!filters.sizes.length || filters.sizes.includes(unit.a)) &&
          (filters.hatched === "all" ||
            (filters.hatched === "hatched" ? unit.hx : !unit.hx))
        );
      }),
    [filters, statuses],
  );

  const selectedUnit = useMemo(
    () => model.plots.find((unit) => unit.id === selectedId),
    [selectedId],
  );
  const counts = useMemo(
    () =>
      model.plots.reduce(
        (result, unit) => {
          result[statuses[unit.id] ?? "available"] += 1;
          return result;
        },
        { available: 0, allocated: 0, reserved: 0 },
      ),
    [statuses],
  );

  return (
    <EstateContext.Provider
      value={{
        model,
        statuses,
        filters,
        setFilters,
        visibleUnits,
        selectedUnit,
        selectedId,
        selectUnit,
        setUnitStatus,
        counts,
        admin,
        setAdmin,
        shading,
        setShading,
        view,
        setView,
        focusedAmenity,
        setFocusedAmenity,
      }}
    >
      {children}
    </EstateContext.Provider>
  );
}

export function useEstate() {
  const context = useContext(EstateContext);
  if (!context) throw new Error("useEstate must be used inside EstateProvider");
  return context;
}
