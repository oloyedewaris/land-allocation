export interface PaymentPlan {
  id: string;
  name?: string;
  title?: string;
  outright?: boolean;
  initialPercentage?: number;
  initial_deposit_in_percentage?: number | string;
  months?: number | null;
  term?: string;
  initial_deposit_in_value?: string;
  purchase_price?: string;
  price?: string;
  payment_period_in_months?: string;
  payment_frequency?: string;
  periodic_payment?: string;
  unit_title?: string;
}

export function formatToCurrency(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (Number.isNaN(n)) return "0.00";
  return `${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatToCurrencyNaira(amount: number | string | null | undefined): string {
  return `₦${formatToCurrency(amount)}`;
}
