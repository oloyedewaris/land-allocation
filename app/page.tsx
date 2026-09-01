import { EstateApplication } from "@/components/estate/EstateApplication";
import { getProjectAllocations } from "@/lib/estate-api";

export default async function Home() {
  const allocations = await getProjectAllocations();
  return <EstateApplication allocations={allocations} />;
}
