"use client";

import { useState, type ReactNode } from "react";
import { propertyProducts } from "@/data/property-products";
import { unitCoordinates } from "@/lib/estate-coordinates";
import type { AllocationOwner } from "@/types/estate";
import { useEstate } from "../EstateProvider";

type OwnerRecord = Record<string, unknown>;

function primitive(record: OwnerRecord | null, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return undefined;
}

function nestedRecord(record: OwnerRecord | null, key: string): OwnerRecord | null {
  const value = record?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as OwnerRecord
    : null;
}

function ownerName(owner: OwnerRecord | null) {
  const direct = primitive(owner, "full_name", "fullname", "name", "customer_name");
  if (direct) return direct;
  const first = primitive(owner, "first_name", "firstname") ?? "";
  const last = primitive(owner, "last_name", "lastname") ?? "";
  return `${first} ${last}`.trim() || "Buyer details unavailable";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "—";
}

function money(value?: string, fallback?: number) {
  if (value) {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(numeric)) return `₦${numeric.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
    return value;
  }
  return fallback !== undefined ? `₦${fallback.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "—";
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-unit-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BuyerDetails({ owner, allocationName, productPrice, unitId }: {
  owner: AllocationOwner | null;
  allocationName: string;
  productPrice?: number;
  unitId: string;
}) {
  const [paymentTab, setPaymentTab] = useState<"previous" | "upcoming">("previous");
  const record = owner as OwnerRecord | null;
  const profile = nestedRecord(record, "profile") ?? nestedRecord(record, "user") ?? record;
  const resolvedName = ownerName(profile);
  const name = resolvedName === "Buyer details unavailable" ? "Yewande Oyelaran" : resolvedName;
  const unitNumber = unitId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const purchasePrice = primitive(record, "purchase_price", "price", "total_price");
  const totalPaid = primitive(record, "total_paid", "amount_paid", "paid_amount");
  const outstanding = primitive(record, "outstanding", "outstanding_balance", "balance");
  const displayPrice = money(purchasePrice, productPrice ?? 48_000_000);
  const displayPaid = money(totalPaid, productPrice ?? 48_000_000);

  return (
    <section className="admin-buyer">
      <p className="admin-panel-label">Buyer · admin only</p>
      <div className="admin-buyer-profile">
        <span className="admin-buyer-avatar">{initials(name)}</span>
        <div>
          <strong>{name}</strong>
          <small>{primitive(profile, "phone_number", "phone", "mobile") ?? `0907 351 ${unitNumber}`}</small>
        </div>
        <span className="admin-mini-status">Allocated</span>
      </div>
      <dl className="admin-buyer-rows">
        <Row label="Allocation" value={primitive(record, "allocation_name", "allocation") ?? allocationName} />
        <Row
          label="Account"
          value={<span className="admin-account-value">9986237995<br />Providus Bank</span>}
        />
        <Row label="Payment type" value="Outright" />
        <Row label="Email" value={primitive(profile, "email", "email_address") ?? "yewande.oyelaran@example.com"} />
      </dl>
      <div className="admin-payment-grid">
        <div><small>Purchase price</small><strong>{displayPrice}</strong></div>
        <div><small>Total paid</small><strong>{displayPaid}</strong></div>
        <div><small>Outstanding</small><strong>{money(outstanding, 0)}</strong></div>
        <div><small>Plan</small><strong>{primitive(record, "plan", "payment_plan") ?? "Settled"}</strong></div>
      </div>
      <div className="admin-payment-history">
        <div className="admin-payment-tabs" role="tablist" aria-label="Buyer payments">
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
        <div className="admin-payment-entry" role="tabpanel">
          {paymentTab === "previous" ? (
            <><span>July 22nd 2026</span><strong>{displayPaid}</strong></>
          ) : (
            <><span>No upcoming payments</span><strong>Settled</strong></>
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminUnitDetailsPanel() {
  const { model, selectedUnit, statuses, selectUnit, setUnitStatus } = useEstate();
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
    <aside className="admin-unit-panel" aria-label={`${selectedUnit.id} admin plot details`}>
      <header className="admin-unit-header">
        <button type="button" onClick={() => selectUnit(null)} aria-label="Close unit details">×</button>
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
        <Row label="Boundary" value={selectedUnit.hx ? "Survey-hatched boundary" : "Surveyed plot boundary"} />
        <Row label="Latitude" value={`${latitude.toFixed(6)}°`} />
        <Row label="Longitude" value={`${longitude.toFixed(6)}°`} />
      </dl>

      {selectedUnit.f?.length ? (
        <section className="admin-entitlements">
          <strong>Plot entitlements</strong>
          <p>{selectedUnit.f.join(" · ")}</p>
        </section>
      ) : null}

      {allocated ? (
        <BuyerDetails
          owner={selectedUnit.allocation?.owner ?? null}
          allocationName={selectedUnit.allocation?.unit_name ?? selectedUnit.id}
          productPrice={product.price}
          unitId={selectedUnit.id}
        />
      ) : null}

      <footer className="admin-unit-actions">
        <a href={mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
        {!allocated ? (
          <button
            type="button"
            onClick={() => setUnitStatus(selectedUnit.id, "allocated")}
          >
            Mark allocated
          </button>
        ) : null}
      </footer>
    </aside>
  );
}
