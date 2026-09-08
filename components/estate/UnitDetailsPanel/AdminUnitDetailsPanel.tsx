"use client";

import { useState, type ReactNode } from "react";
import { propertyProducts } from "@/data/property-products";
import { unitCoordinates } from "@/lib/estate-coordinates";
import type { BackendAllocation } from "@/types/estate";
import { useEstate } from "../EstateProvider";
import { useQuery } from "@tanstack/react-query";
import { getAdminAllocationDetails } from "@/lib/api/investment";
import { Center } from "@chakra-ui/react";
import { Loader } from "@/components/ui/Loader";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-unit-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BuyerDetails({ allocation }: { allocation?: BackendAllocation }) {
  const [paymentTab, setPaymentTab] = useState<"previous" | "upcoming">(
    "previous",
  );

  const allocationDetailsQuery = useQuery({
    queryKey: ["getAdminAllocationDetails", allocation?.id],
    queryFn: () => getAdminAllocationDetails(allocation?.id || 0),
    enabled: !!allocation?.id,
  });
  const allocationData = allocationDetailsQuery?.data?.data?.data;
  const { buyer, equity, financials } = allocationData || {};
  console.log("allocationData", allocationData);

  return allocationDetailsQuery?.isLoading ? (
    <Center minH={"30vh"}>
      <Loader />
    </Center>
  ) : (
    <section className="admin-buyer">
      <p className="admin-panel-label">Buyer · admin only</p>
      <div className="admin-buyer-profile">
        <span className="admin-buyer-avatar">
          {buyer?.first_name?.[0]} {buyer?.last_name?.[0]}
        </span>
        <div>
          <strong>
            {buyer?.first_name} {buyer?.last_name}
          </strong>
          <small>{buyer?.phone}</small>
        </div>
        {/* <span className="admin-mini-status">Allocated</span> */}
      </div>
      <dl className="admin-buyer-rows">
        <Row label="Allocation" value={allocation?.unit_name} />
        {/* <Row
          label="Account"
          value={
            <span className="admin-account-value">
              9986237995
              <br />
              Providus Bank
            </span>
          }
        /> */}
        <Row label="Payment type" value="Outright" />
        <Row label="Email" value={buyer?.email} />
      </dl>
      <div className="admin-payment-grid">
        <div>
          <small>Purchase price</small>
          <strong>{financials?.purchase_price_formatted}</strong>
        </div>
        <div>
          <small>Total paid</small>
          <strong>{financials?.total_paid_formatted}</strong>
        </div>
        <div>
          <small>Outstanding</small>
          <strong>{financials?.outstanding_formatted}</strong>
        </div>
        <div>
          <small>Plan</small>
          <strong>{equity?.plan}</strong>
        </div>
      </div>
      <div className="admin-payment-history">
        <div
          className="admin-payment-tabs"
          role="tablist"
          aria-label="Buyer payments"
        >
          <button
            type="button"
            role="tab"
            aria-selected={paymentTab === "previous"}
            className={paymentTab === "previous" ? "active" : ""}
            onClick={() => setPaymentTab("previous")}
          >
            Previous Payments
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={paymentTab === "upcoming"}
            className={paymentTab === "upcoming" ? "active" : ""}
            onClick={() => setPaymentTab("upcoming")}
          >
            Upcoming Payments
          </button>
        </div>
        {paymentTab === "previous" ? (
          <>
            {!allocationData?.previous_payments?.length ? (
              <div className="admin-payment-entry" role="tabpanel">
                <span>No previous payments</span>
                <strong>Settled</strong>
              </div>
            ) : (
              allocationData?.previous_payments?.map((payment: any) => (
                <div className="admin-payment-entry" role="tabpanel">
                  <span>{payment?.date}</span>
                  <strong>{payment?.amount_formatted}</strong>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {!allocationData?.upcoming_payments?.length ? (
              <div className="admin-payment-entry" role="tabpanel">
                <span>No upcoming payments</span>
                <strong>Settled</strong>
              </div>
            ) : (
              allocationData?.upcoming_payments?.map((payment: any) => (
                <div className="admin-payment-entry" role="tabpanel">
                  <span>{payment?.date}</span>
                  <strong>{payment?.amount_formatted}</strong>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function AdminUnitDetailsPanel() {
  const { model, selectedUnit, statuses, selectUnit, setUnitStatus } =
    useEstate();
  if (!selectedUnit) return null;

  const status = statuses[selectedUnit.id] ?? "available";
  const allocated = status === "allocated";
  const product = propertyProducts[selectedUnit.a] ?? {
    label: selectedUnit.ptype,
    title: "Certificate of Occupancy",
    paymentPlan: "Available",
  };
  const [latitude, longitude] = unitCoordinates(selectedUnit.c, model.meta);
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <aside
      className="admin-unit-panel"
      aria-label={`${selectedUnit.id} admin plot details`}
    >
      <header className="admin-unit-header">
        <button
          type="button"
          onClick={() => selectUnit(null)}
          aria-label="Close unit details"
        >
          ×
        </button>
        <h2>{selectedUnit.id}</h2>
        <span className={`admin-status-badge ${status}`}>{status}</span>
      </header>

      <dl className="admin-unit-rows">
        <Row label="Product" value={product.label} />
        <Row label="Cluster" value="Not in a cluster" />
        <Row label="Sector" value={selectedUnit.s} />
        <Row label="Plot no." value={selectedUnit.n} />
        <Row label="Area" value={`${selectedUnit.a.toLocaleString()} m²`} />
        <Row label="Dimensions" value={selectedUnit.dim} />
        <Row label="Title" value={product.title} />
        <Row
          label="Boundary"
          value={
            selectedUnit.hx
              ? "Survey-hatched boundary"
              : "Surveyed plot boundary"
          }
        />
        <Row label="Latitude" value={`${latitude.toFixed(6)}°`} />
        <Row label="Longitude" value={`${longitude.toFixed(6)}°`} />
      </dl>

      {selectedUnit.f?.length ? (
        <section className="admin-entitlements">
          <strong>Plot entitlements</strong>
          <p>{selectedUnit.f.join(" · ")}</p>
        </section>
      ) : null}

      {allocated ? <BuyerDetails allocation={selectedUnit.allocation} /> : null}

      <footer className="admin-unit-actions">
        <a href={mapsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
        {/* {!allocated ? (
          <button
            type="button"
            onClick={() => setUnitStatus(selectedUnit.id, "allocated")}
          >
            Mark allocated
          </button>
        ) : null} */}
      </footer>
    </aside>
  );
}
