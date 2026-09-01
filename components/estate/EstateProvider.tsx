"use client";

import siteJson from "@/data/site-model.json";
import unitsJson from "@/data/units.json";
import type {
  EstateFilters,
  EstateModel,
  EstateUnit,
  BackendAllocation,
  ShadingMode,
  UnitStatus,
  ViewMode,
} from "@/types/estate";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const localModel = { ...siteJson, plots: unitsJson } as unknown as EstateModel;

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

export function EstateProvider({ children, allocations }: { children: ReactNode; allocations: BackendAllocation[] }) {
  const model = useMemo<EstateModel>(() => {
    const allocationsByName = new Map(allocations.map((allocation) => [allocation.name, allocation]));
    return {
      ...localModel,
      plots: localModel.plots.map((unit) => ({
        ...unit,
        allocation: allocationsByName.get(unit.id),
      })),
    };
  }, [allocations]);
  const apiStatuses = useMemo(() => Object.fromEntries(model.plots.map((unit) => [
    unit.id,
    unit.allocation?.allocated ? "allocated" : "available",
  ])) as Record<string, UnitStatus>, [model.plots]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, UnitStatus>>({});
  const statuses = useMemo(() => ({ ...apiStatuses, ...statusOverrides }), [apiStatuses, statusOverrides]);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedId, selectUnit] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [shading, setShading] = useState<ShadingMode>("realistic");
  const [view, setView] = useState<ViewMode>("aerial");
  const [focusedAmenity, setFocusedAmenity] = useState<number | null>(null);

  const setUnitStatus = useCallback((id: string, status: UnitStatus) => {
    setStatusOverrides((current) => ({ ...current, [id]: status }));
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
    [filters, statuses, model.plots],
  );

  const selectedUnit = useMemo(
    () => model.plots.find((unit) => unit.id === selectedId),
    [selectedId, model.plots],
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
    [statuses, model.plots],
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
