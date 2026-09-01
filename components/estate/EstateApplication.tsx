import { EstateCanvas } from "./EstateCanvas";
import { EstateHeader } from "./EstateHeader";
import { EstateProvider } from "./EstateProvider";
import { EstateSidebar } from "./EstateSidebar";

export function EstateApplication() {
  return (
    <EstateProvider>
      <div className="estate-app">
        <EstateHeader />
        <EstateSidebar />
        <EstateCanvas />
      </div>
    </EstateProvider>
  );
}
