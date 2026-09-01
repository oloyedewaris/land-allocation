import { EstateApplication } from "@/components/estate/EstateApplication";
import { getEsubDetails, getProjectAllocations } from "@/lib/estate-api";

export default async function Home() {
  const allocations = await getProjectAllocations();
  const esubDetails = await getEsubDetails();

  return (
    <EstateApplication esubDetails={esubDetails} allocations={allocations} />
  );
}
