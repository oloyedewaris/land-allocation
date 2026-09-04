import { EstateApplication } from "@/components/estate/EstateApplication";
import { getEsubDetails, getProjectAllocations } from "@/lib/estate-api";
import { Providers } from "./providers";

export default async function Home() {
  const [allocations, esubDetails] = await Promise.all([
    getProjectAllocations(),
    getEsubDetails(),
  ]);

  return (
    <Providers esubDetails={esubDetails}>
      <EstateApplication esubDetails={esubDetails} allocations={allocations} />
    </Providers>
  );
}
