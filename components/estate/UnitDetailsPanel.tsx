"use client";

import { allocationContacts, propertyProducts } from "@/data/property-products";
import { unitCoordinates } from "@/lib/estate-coordinates";
import type { AllocationOwner } from "@/types/estate";
import { useEstate } from "./EstateProvider";

function humanize(key: string) { return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function ownerValue(value: unknown) { return value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value); }
function formatPrice(price?: number) { return price ? `₦${price.toLocaleString("en-NG")}` : "Contact for pricing"; }

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return <div className="drawer-row"><dt>{label}</dt><dd>{value}</dd></div>;
}

function OwnerDetails({ owner }: { owner: AllocationOwner }) {
  const entries = Object.entries(owner).filter(([, value]) => value != null && value !== "");
  return <dl className="drawer-rows">{entries.map(([key, value]) => <DetailRow key={key} label={humanize(key)} value={ownerValue(value)} />)}</dl>;
}

function AllocationContacts() {
  return <section className="drawer-contacts"><p className="drawer-section-label">Your allocation contact</p>{allocationContacts.map((contact) => <article className="contact-card" key={contact.email}><span className="contact-avatar">{contact.initials}</span><div><h4>{contact.name}</h4><p>{contact.role}</p><a href={`mailto:${contact.email}`}>{contact.email}</a></div><a className="contact-action" href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`}>✉</a></article>)}</section>;
}

export function UnitDetailsPanel() {
  const { model, selectedUnit, statuses, selectUnit } = useEstate();
  if (!selectedUnit) return null;
  const allocation = selectedUnit.allocation, status = statuses[selectedUnit.id], available = status === "available";
  const product = propertyProducts[selectedUnit.a] ?? { label: selectedUnit.ptype, title: "Certificate of Occupancy", paymentPlan: "Available" };
  const [latitude, longitude] = unitCoordinates(selectedUnit.c, model.meta);
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const subject = encodeURIComponent(`${available ? "Reserve" : "Waitlist for"} ${selectedUnit.id}`);

  return <aside className="unit-drawer" aria-label={`${selectedUnit.id} plot details`}>
    <header className="drawer-header"><button className="drawer-close" onClick={() => selectUnit(null)} aria-label="Close unit details">×</button><p className="drawer-eyebrow">IBEFUN RESERVE · ZONE {selectedUnit.s} · SECTOR {selectedUnit.s}</p><h2>{selectedUnit.id}</h2><p className="drawer-type">{product.label}</p><p className={`drawer-status ${status}`}><i />{status}</p></header>

    <section className="drawer-section"><dl className="drawer-rows"><DetailRow label="Sector" value={selectedUnit.s} /><DetailRow label="Plot no." value={selectedUnit.n} /><DetailRow label="Area" value={`${selectedUnit.a.toLocaleString()} m²`} /><DetailRow label="Dimensions" value={selectedUnit.dim} /><DetailRow label="Title" value={product.title} /><DetailRow label="Price" value={formatPrice(product.price)} /><DetailRow label="Payment plan" value={product.paymentPlan} /></dl></section>

    <section className="drawer-location"><div><span>Latitude</span><b>{latitude.toFixed(6)}°</b><span>Longitude</span><b>{longitude.toFixed(6)}°</b></div><a href={mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a></section>

    <section className="drawer-conversion"><h3>{available ? `Reserve plot ${selectedUnit.n} in your name` : `Plot ${selectedUnit.id} is allocated`}</h3><p>{available ? "Tell us a few things about yourself, review the parcel terms and payment options, and decide from there." : "This plot already has an allocation. Join the waitlist and we will contact you when a suitable plot becomes available."}</p><a className="drawer-primary-action" href={`mailto:${allocationContacts[0].email}?subject=${subject}`}><span>{available ? "Reserve this plot" : "Join the waitlist"}</span><b>→</b></a></section>

    {allocation?.owner && <section className="drawer-section"><p className="drawer-section-label">Current owner</p><OwnerDetails owner={allocation.owner} /></section>}
    <AllocationContacts />
  </aside>;
}
