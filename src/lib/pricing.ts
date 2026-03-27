/**
 * CourierHub Pricing & Weight Configuration
 * Single source of truth — used by both the UI and server actions.
 */

import type { PackageType, DeliveryType } from "@prisma/client";

// ── Weight limits per package type (in kg) ──────────────────────────────────

export const WEIGHT_LIMITS: Record<PackageType, { min: number; max: number }> = {
  DOCUMENT:    { min: 0.1, max: 5 },
  PARCEL:      { min: 0.1, max: 30 },
  FRAGILE:     { min: 0.1, max: 15 },
  ELECTRONICS: { min: 0.1, max: 20 },
};

// ── Weight tier pricing (base rate in ₹, applies to both delivery types) ───

export interface WeightTier {
  /** inclusive lower bound (kg) */
  minKg: number;
  /** inclusive upper bound (kg) */
  maxKg: number;
  /** base price in ₹ */
  basePrice: number;
  /** label shown in UI */
  label: string;
}

export const WEIGHT_TIERS: WeightTier[] = [
  { minKg: 0,   maxKg: 0.5,  basePrice: 60,   label: "Up to 0.5 kg" },
  { minKg: 0.5, maxKg: 1,    basePrice: 100,  label: "0.5 – 1 kg" },
  { minKg: 1,   maxKg: 3,    basePrice: 180,  label: "1 – 3 kg" },
  { minKg: 3,   maxKg: 5,    basePrice: 280,  label: "3 – 5 kg" },
  { minKg: 5,   maxKg: 10,   basePrice: 420,  label: "5 – 10 kg" },
  { minKg: 10,  maxKg: 20,   basePrice: 700,  label: "10 – 20 kg" },
  { minKg: 20,  maxKg: 30,   basePrice: 1100, label: "20 – 30 kg" },
];

// ── Package type surcharge multiplier ───────────────────────────────────────

export const PACKAGE_TYPE_MULTIPLIER: Record<PackageType, number> = {
  DOCUMENT:    1.0,   // no surcharge
  PARCEL:      1.0,   // no surcharge
  FRAGILE:     1.4,   // +40% surcharge
  ELECTRONICS: 1.6,   // +60% surcharge
};

// ── Delivery type multiplier ─────────────────────────────────────────────────

export const DELIVERY_TYPE_MULTIPLIER: Record<DeliveryType, number> = {
  STANDARD: 1.0,
  EXPRESS:  1.8,  // +80% for express
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the WeightTier for a given weight, or null if out of range. */
export function getTierForWeight(weightKg: number): WeightTier | null {
  return (
    WEIGHT_TIERS.find((t) => weightKg > t.minKg && weightKg <= t.maxKg) ??
    // Edge: exactly 0 → first tier; use exclusive lower bound check above
    (weightKg === 0 ? null : null)
  ) ?? WEIGHT_TIERS.find((t) => weightKg <= t.maxKg) ?? null;
}

/** Calculate final price in ₹ for a shipment. */
export function calculatePrice(
  weightKg: number,
  packageType: PackageType,
  deliveryType: DeliveryType
): number {
  const tier = getTierForWeight(weightKg);
  if (!tier) return 0;
  const base = tier.basePrice;
  const price = base * PACKAGE_TYPE_MULTIPLIER[packageType] * DELIVERY_TYPE_MULTIPLIER[deliveryType];
  return Math.round(price);
}

/** Validate weight against the allowed range for a package type. */
export function validateWeight(
  weightKg: number,
  packageType: PackageType
): { valid: boolean; message?: string } {
  const limit = WEIGHT_LIMITS[packageType];
  if (weightKg < limit.min) {
    return { valid: false, message: `Minimum weight for ${packageType.toLowerCase()} is ${limit.min} kg` };
  }
  if (weightKg > limit.max) {
    return { valid: false, message: `Maximum weight for ${packageType.toLowerCase()} is ${limit.max} kg` };
  }
  return { valid: true };
}

/** Human-readable display name for each package type. */
export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  DOCUMENT:    "Document",
  PARCEL:      "Parcel",
  FRAGILE:     "Fragile",
  ELECTRONICS: "Electronics",
};

export const PACKAGE_TYPE_ICONS: Record<PackageType, string> = {
  DOCUMENT:    "📄",
  PARCEL:      "📦",
  FRAGILE:     "🔮",
  ELECTRONICS: "💻",
};
