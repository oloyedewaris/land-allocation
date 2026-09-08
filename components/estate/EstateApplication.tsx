"use client";

import { verifyMagicLink } from "@/lib/api/auth";
import { EstateCanvas } from "./EstateCanvas";
import { EstateHeader } from "./EstateHeader";
import { EstateProvider } from "./EstateProvider";
import { EstateSidebar } from "./EstateSidebar";
import type { BackendAllocation, EsubDetails } from "@/types/estate";
import { useToast } from "@chakra-ui/react";
import { getErrorMessage } from "./UnitDetailsPanel";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function EstateApplication({
  esubDetails,
  allocations,
}: {
  esubDetails: EsubDetails;
  allocations: BackendAllocation[];
}) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const magicToken = searchParams.get("magic");
  const [valid, setValid] = useState(false);

  const verifyLinkMutation = useMutation({
    mutationFn: verifyMagicLink,
    onSuccess: async (res) => {
      sessionStorage.setItem("token", res.data?.token);
      sessionStorage.setItem("refresh_token", res.data?.refresh_token);
      setValid(!!res.data.valid);
    },
    onError: (err: unknown) => {
      toast({
        title: getErrorMessage(err, "There was an error fetching user"),
        description: "",
        status: "error",
      });
    },
  });

  useEffect(() => {
    if (magicToken) verifyLinkMutation.mutate({ token: magicToken });
  }, [magicToken]);

  return (
    <EstateProvider allocations={allocations}>
      <div className="estate-app">
        <EstateHeader valid={valid} />
        <EstateSidebar />
        <EstateCanvas esubDetails={esubDetails} />
      </div>
    </EstateProvider>
  );
}
