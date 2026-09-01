export interface PropertyProduct {
  label: string;
  title: string;
  price?: number;
  paymentPlan: string;
}

export const propertyProducts: Record<number, PropertyProduct> = {
  300: { label: "300 m² land-banking plot", title: "Certificate of Occupancy", paymentPlan: "Available" },
  500: { label: "500 m² land-banking plot", title: "Certificate of Occupancy", price: 12_500_000, paymentPlan: "Available" },
  1000: { label: "1,000 m² premium plot", title: "Certificate of Occupancy", paymentPlan: "Available" },
  3000: { label: "3,000 m² acreage plot", title: "Certificate of Occupancy", price: 70_000_000, paymentPlan: "Available" },
};

export const allocationContacts = [
  { name: "Ahmed Ibraheem", initials: "AI", role: "Customer Relations Manager", email: "ahmed@myxellia.io" },
  { name: "David Peter", initials: "DP", role: "Sales Manager", email: "david@myxellia.io" },
];
