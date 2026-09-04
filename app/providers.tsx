"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import type { EsubDetails } from "@/types/estate";

interface ProvidersProps {
  children: React.ReactNode;
  esubDetails: EsubDetails;
}

export function Providers({ children, esubDetails }: Readonly<ProvidersProps>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    const businessId = esubDetails.business?.business_id;
    const storeName = esubDetails.store?.store_name;
    if (businessId) window.sessionStorage.setItem("business_id", businessId);
    if (storeName) window.sessionStorage.setItem("store_name", storeName);
  }, [esubDetails]);

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ChakraProvider>
  );
}
