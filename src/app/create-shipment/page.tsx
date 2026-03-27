"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Copy, Check, Info, AlertTriangle, ChevronDown, ChevronUp, Truck, Zap,
} from "lucide-react";
import { createShipment, syncCurrentUser } from "@/app/actions/shipments";
import { PackageType, DeliveryType } from "@prisma/client";
import { toast } from "sonner";
import {
  WEIGHT_LIMITS,
  WEIGHT_TIERS,
  PACKAGE_TYPE_MULTIPLIER,
  DELIVERY_TYPE_MULTIPLIER,
  PACKAGE_TYPE_LABELS,
  PACKAGE_TYPE_ICONS,
  calculatePrice,
  validateWeight,
} from "@/lib/pricing";

// ── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  packageWeight: string;
  packageType: PackageType;
  deliveryType: DeliveryType;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateShipment() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    senderName: "",
    senderAddress: "",
    senderPhone: "",
    receiverName: "",
    receiverAddress: "",
    receiverPhone: "",
    packageWeight: "",
    packageType: "PARCEL",
    deliveryType: "STANDARD",
  });

  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPricingInfo, setShowPricingInfo] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in?redirect_url=/create-shipment");
  }, [isLoaded, isSignedIn, router]);

  // Pre-sync user to DB
  useEffect(() => {
    if (isLoaded && isSignedIn) syncCurrentUser().catch(console.error);
  }, [isLoaded, isSignedIn]);

  const update = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Derived pricing & validation ──────────────────────────────────────────

  const weightNum = parseFloat(form.packageWeight) || 0;
  const limit = WEIGHT_LIMITS[form.packageType];

  const weightValidation = useMemo(() => {
    if (!form.packageWeight) return null;
    return validateWeight(weightNum, form.packageType);
  }, [form.packageWeight, weightNum, form.packageType]);

  const estimatedPrice = useMemo(() => {
    if (!form.packageWeight || weightNum <= 0) return null;
    if (weightValidation && !weightValidation.valid) return null;
    return calculatePrice(weightNum, form.packageType, form.deliveryType);
  }, [form.packageWeight, weightNum, form.packageType, form.deliveryType, weightValidation]);

  const filled =
    form.senderName &&
    form.senderPhone &&
    form.senderAddress &&
    form.receiverName &&
    form.receiverPhone &&
    form.receiverAddress &&
    form.packageWeight &&
    weightValidation?.valid;

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleCreateShipment = async () => {
    if (!filled) { toast.error("Please fill in all required fields"); return; }
    if (!weightValidation?.valid) { toast.error(weightValidation?.message); return; }

    setLoading(true);
    try {
      const shipment = await createShipment({
        senderName: form.senderName,
        senderAddress: form.senderAddress,
        senderPhone: form.senderPhone || undefined,
        receiverName: form.receiverName,
        receiverAddress: form.receiverAddress,
        receiverPhone: form.receiverPhone || undefined,
        packageWeight: weightNum,
        packageType: form.packageType,
        deliveryType: form.deliveryType,
      });
      setTrackingId(shipment.trackingId);
      setFinalPrice(shipment.price);
      toast.success("Shipment created successfully!");
    } catch (error) {
      console.error("Error creating shipment:", error);
      toast.error("Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">Create Shipment</h1>
          <p className="mt-2 text-muted-foreground">
            Fill in the details below. Prices are calculated based on weight, package type, and delivery speed.
          </p>
        </motion.div>

        {/* Pricing Info Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-xl border border-accent/30 bg-accent/5 overflow-hidden"
        >
          <button
            onClick={() => setShowPricingInfo((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground hover:bg-accent/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" />
              Pricing & Weight Limits Guide
            </span>
            {showPricingInfo ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />}
          </button>

          <AnimatePresence>
            {showPricingInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-1 grid gap-6 lg:grid-cols-2">
                  {/* Package type limits */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Weight Limits by Package Type
                    </h4>
                    <div className="space-y-2">
                      {(Object.keys(WEIGHT_LIMITS) as PackageType[]).map((type) => {
                        const l = WEIGHT_LIMITS[type];
                        const mul = PACKAGE_TYPE_MULTIPLIER[type];
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span>{PACKAGE_TYPE_ICONS[type]}</span>
                              <span className="font-medium">{PACKAGE_TYPE_LABELS[type]}</span>
                            </span>
                            <div className="flex items-center gap-3 text-right">
                              <span className="text-muted-foreground">{l.min}–{l.max} kg</span>
                              {mul > 1 && (
                                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                                  +{Math.round((mul - 1) * 100)}% surcharge
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weight tier table */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Base Rates by Weight · Express ×1.8
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Weight</th>
                            <th className="px-3 py-2 text-right font-semibold text-muted-foreground flex items-center justify-end gap-1">
                              <Truck className="h-3 w-3" /> Standard
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-muted-foreground">
                              <span className="flex items-center justify-end gap-1"><Zap className="h-3 w-3 text-accent" /> Express</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {WEIGHT_TIERS.map((tier, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2 text-muted-foreground">{tier.label}</td>
                              <td className="px-3 py-2 text-right font-medium">₹{tier.basePrice}</td>
                              <td className="px-3 py-2 text-right font-medium text-accent">
                                ₹{Math.round(tier.basePrice * DELIVERY_TYPE_MULTIPLIER.EXPRESS)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
                        Fragile +40% · Electronics +60% applied on top of base rate
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main form */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">

            {/* Sender */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Sender Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Sender Name <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.senderName} onChange={(e) => update("senderName", e.target.value)} placeholder="Rahul Verma" />
                </div>
                <div>
                  <Label>Sender Phone <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.senderPhone} onChange={(e) => update("senderPhone", e.target.value)} placeholder="+91-98765-10000" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Sender Address <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.senderAddress} onChange={(e) => update("senderAddress", e.target.value)} placeholder="22 MG Road, Indiranagar, Bengaluru" />
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Receiver Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Receiver Name <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} placeholder="Ananya Iyer" />
                </div>
                <div>
                  <Label>Receiver Phone <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.receiverPhone} onChange={(e) => update("receiverPhone", e.target.value)} placeholder="+91-98765-20000" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Receiver Address <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={form.receiverAddress} onChange={(e) => update("receiverAddress", e.target.value)} placeholder="14 Park Street, Kolkata" />
                </div>
              </div>
            </div>

            {/* Package */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Package Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                {/* Package type */}
                <div>
                  <Label>Package Type <span className="text-destructive">*</span></Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    value={form.packageType}
                    onChange={(e) => {
                      update("packageType", e.target.value);
                      // Clear weight if it now violates new type limit
                      const newLimit = WEIGHT_LIMITS[e.target.value as PackageType];
                      const w = parseFloat(form.packageWeight);
                      if (!isNaN(w) && w > newLimit.max) update("packageWeight", "");
                    }}
                  >
                    {(Object.keys(WEIGHT_LIMITS) as PackageType[]).map((t) => (
                      <option key={t} value={t}>
                        {PACKAGE_TYPE_ICONS[t]} {PACKAGE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Max {limit.max} kg
                    {PACKAGE_TYPE_MULTIPLIER[form.packageType] > 1 &&
                      ` · +${Math.round((PACKAGE_TYPE_MULTIPLIER[form.packageType] - 1) * 100)}% surcharge`}
                  </p>
                </div>

                {/* Delivery type */}
                <div>
                  <Label>Delivery Type <span className="text-destructive">*</span></Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    value={form.deliveryType}
                    onChange={(e) => update("deliveryType", e.target.value)}
                  >
                    <option value="STANDARD">🚚 Standard (5 days)</option>
                    <option value="EXPRESS">⚡ Express (2 days)</option>
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {form.deliveryType === "EXPRESS" ? "×1.8 price multiplier" : "Base rate"}
                  </p>
                </div>

                {/* Weight */}
                <div>
                  <Label>Weight (kg) <span className="text-destructive">*</span></Label>
                  <Input
                    className={`mt-1 ${weightValidation && !weightValidation.valid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    type="number"
                    value={form.packageWeight}
                    onChange={(e) => update("packageWeight", e.target.value)}
                    placeholder={`0.1 – ${limit.max}`}
                    min={limit.min}
                    max={limit.max}
                    step="0.1"
                  />
                  <AnimatePresence mode="wait">
                    {weightValidation && !weightValidation.valid ? (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
                      >
                        <AlertTriangle className="h-3 w-3" /> {weightValidation.message}
                      </motion.p>
                    ) : (
                      <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1.5 text-xs text-muted-foreground"
                      >
                        Allowed: {limit.min}–{limit.max} kg
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Live price preview inside the package card */}
              <AnimatePresence>
                {estimatedPrice !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">Estimated price</span>
                    <span className="text-xl font-bold text-accent">₹{estimatedPrice.toLocaleString("en-IN")}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleCreateShipment}
              disabled={!filled || loading}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow w-full sm:w-auto"
            >
              <Package className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Shipment"}
            </Button>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Order summary */}
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold">Order Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Sender" value={form.senderName || "—"} />
                  <Row label="Phone" value={form.senderPhone || "—"} />
                  <Row label="Receiver" value={form.receiverName || "—"} />
                  <Row label="Phone" value={form.receiverPhone || "—"} />
                  <Row label="From" value={form.senderAddress || "—"} />
                  <Row label="To" value={form.receiverAddress || "—"} />
                  <Row label="Weight" value={form.packageWeight ? `${form.packageWeight} kg` : "—"} />
                  <Row label="Type" value={PACKAGE_TYPE_LABELS[form.packageType]} />
                  <Row label="Delivery" value={form.deliveryType === "EXPRESS" ? "⚡ Express" : "🚚 Standard"} />

                  {estimatedPrice !== null && (
                    <div className="flex justify-between border-t pt-3 mt-1">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-lg font-bold text-accent">₹{estimatedPrice.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* Success state */}
                <AnimatePresence>
                  {trackingId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 rounded-lg bg-success/10 p-4"
                    >
                      <p className="text-xs font-medium text-success">Shipment Created!</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="font-mono text-lg font-bold text-success">{trackingId}</p>
                        <button onClick={copyId} className="text-success hover:text-success/80">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      {finalPrice !== null && (
                        <p className="mt-2 text-sm font-semibold text-success">
                          Charged: ₹{finalPrice.toLocaleString("en-IN")}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">Save this ID to track your shipment</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick pricing reference */}
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-accent" /> Quick Reference
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {(Object.keys(WEIGHT_LIMITS) as PackageType[]).map((t) => (
                    <div key={t} className={`flex justify-between py-1 border-b last:border-0 transition-colors ${form.packageType === t ? "text-foreground font-medium" : ""}`}>
                      <span>{PACKAGE_TYPE_ICONS[t]} {PACKAGE_TYPE_LABELS[t]}</span>
                      <span>up to {WEIGHT_LIMITS[t].max} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
