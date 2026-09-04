import { EstateCanvas } from "./EstateCanvas";
import { EstateHeader } from "./EstateHeader";
import { EstateProvider } from "./EstateProvider";
import { EstateSidebar } from "./EstateSidebar";
import type { BackendAllocation, EsubDetails } from "@/types/estate";

export function EstateApplication({
  esubDetails,
  allocations,
}: {
  esubDetails: EsubDetails;
  allocations: BackendAllocation[];
}) {
  return (
    <EstateProvider allocations={allocations}>
      <div className="estate-app">
        <EstateHeader />
        <EstateSidebar />
        <EstateCanvas esubDetails={esubDetails} />
      </div>
    </EstateProvider>
  );
}
