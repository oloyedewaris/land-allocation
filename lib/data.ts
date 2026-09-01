import apartmentsJson from "@/data/apartments.json";
import assetsJson from "@/data/unit-assets.json";
import planLabelsJson from "@/data/plan-labels.json";
import type { Apartment, AssetRegistry, PlanRegistry } from "./types";

// JSON imports infer literal unions and ordinary number arrays. These runtime
// files are validated by the synchronization scripts before reaching here.
export const apartments = apartmentsJson as unknown as Apartment[];
const originalAssetRegistry = assetsJson as unknown as AssetRegistry;
const fallbackAssets = Object.values(originalAssetRegistry.units);

if (!fallbackAssets.length) throw new Error("unit-assets.json does not contain any reusable unit assets.");

export const assetRegistry: AssetRegistry = {
  units: Object.fromEntries(
    apartments.map((unit, index) => [unit.number_num, originalAssetRegistry.units[unit.number_num] ?? fallbackAssets[index % fallbackAssets.length]]),
  ),
  disabled: [],
};
export const planRegistry = planLabelsJson as unknown as PlanRegistry;

export function findApartment(unitNumber: string): Apartment | undefined {
  return apartments.find((unit) => Number(unit.number_num) === Number(unitNumber));
}

export function canOpenUnit(unit: Apartment): boolean {
  return unit.allocated === false;
}

export function sortUnitsByFloorDescending(units: Apartment[]): Apartment[] {
  return [...units].sort((left, right) => {
    const floorDifference = Number(right.min_floor || right.floor) - Number(left.min_floor || left.floor);
    return floorDifference || Number(left.number_num) - Number(right.number_num);
  });
}
