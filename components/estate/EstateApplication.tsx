import { EstateCanvas } from "./EstateCanvas";
import { EstateHeader } from "./EstateHeader";
import { EstateProvider } from "./EstateProvider";
import { EstateSidebar } from "./EstateSidebar";
import type { BackendAllocation } from "@/types/estate";

export function EstateApplication({ allocations }: { allocations: BackendAllocation[] }) {
  return (
    <EstateProvider allocations={allocations}>
      <div className="estate-app">
        <EstateHeader />
        <EstateSidebar />
        <EstateCanvas />
      </div>
    </EstateProvider>
  );
}
