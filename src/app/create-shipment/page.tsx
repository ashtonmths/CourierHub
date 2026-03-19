"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Package, Copy, Check } from "lucide-react";
import { createShipment, syncCurrentUser } from "@/app/actions/shipments";
import { PackageType, DeliveryType } from "@prisma/client";
import { toast } from "sonner";

export default function CreateShipment() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    senderName: "",
    senderAddress: "",
    senderPhone: "",
    receiverName: "",
    receiverAddress: "",
    receiverPhone: "",
    packageWeight: "",
    packageType: "PARCEL" as PackageType,
    deliveryType: "STANDARD" as DeliveryType,
  });
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/create-shipment");
    }
  }, [isLoaded, isSignedIn, router]);

  // Pre-sync user to DB as soon as they land on this page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncCurrentUser().catch(console.error);
    }
  }, [isLoaded, isSignedIn]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleCreateShipment = async () => {
    if (!filled) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const shipment = await createShipment({
        senderName: form.senderName,
        senderAddress: form.senderAddress,
        senderPhone: form.senderPhone || undefined,
        receiverName: form.receiverName,
        receiverAddress: form.receiverAddress,
        receiverPhone: form.receiverPhone || undefined,
        packageWeight: parseFloat(form.packageWeight),
        packageType: form.packageType,
        deliveryType: form.deliveryType,
      });

      setTrackingId(shipment.trackingId);
      toast.success('Shipment created successfully!');
      
      // Reset form after successful creation
      // setForm({
      //   senderName: "",
      //   senderAddress: "",
      //   receiverName: "",
      //   receiverAddress: "",
      //   packageWeight: "",
      //   packageType: "PARCEL" as PackageType,
      //   deliveryType: "STANDARD" as DeliveryType,
      // });
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
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

  const filled =
    form.senderName &&
    form.receiverName &&
    form.senderPhone &&
    form.receiverPhone &&
    form.senderAddress &&
    form.receiverAddress &&
    form.packageWeight;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">Create Shipment</h1>
          <p className="mt-2 text-muted-foreground">
            Fill in the details to create a new courier shipment.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Sender */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Sender Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Sender Name</Label>
                  <Input
                    className="mt-1"
                    value={form.senderName}
                    onChange={(e) => update("senderName", e.target.value)}
                    placeholder="Rahul Verma"
                  />
                </div>
                <div>
                  <Label>Sender Phone</Label>
                  <Input
                    className="mt-1"
                    value={form.senderPhone}
                    onChange={(e) => update("senderPhone", e.target.value)}
                    placeholder="+91-98765-10000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Sender Address</Label>
                  <Input
                    className="mt-1"
                    value={form.senderAddress}
                    onChange={(e) => update("senderAddress", e.target.value)}
                    placeholder="22 MG Road, Indiranagar, Bengaluru"
                  />
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Receiver Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Receiver Name</Label>
                  <Input
                    className="mt-1"
                    value={form.receiverName}
                    onChange={(e) => update("receiverName", e.target.value)}
                    placeholder="Ananya Iyer"
                  />
                </div>
                <div>
                  <Label>Receiver Phone</Label>
                  <Input
                    className="mt-1"
                    value={form.receiverPhone}
                    onChange={(e) => update("receiverPhone", e.target.value)}
                    placeholder="+91-98765-20000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Receiver Address</Label>
                  <Input
                    className="mt-1"
                    value={form.receiverAddress}
                    onChange={(e) => update("receiverAddress", e.target.value)}
                    placeholder="14 Park Street, Kolkata"
                  />
                </div>
              </div>
            </div>

            {/* Package */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Package Details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={form.packageWeight}
                    onChange={(e) => update("packageWeight", e.target.value)}
                    placeholder="2.5"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Package Type</Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    value={form.packageType}
                    onChange={(e) => update("packageType", e.target.value)}
                  >
                    <option value="DOCUMENT">Document</option>
                    <option value="PARCEL">Parcel</option>
                    <option value="FRAGILE">Fragile</option>
                    <option value="ELECTRONICS">Electronics</option>
                  </select>
                </div>
                <div>
                  <Label>Delivery Type</Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    value={form.deliveryType}
                    onChange={(e) => update("deliveryType", e.target.value)}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateShipment}
              disabled={!filled || loading}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow"
            >
              <Package className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Shipment'}
            </Button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Shipment Summary</h3>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Sender" value={form.senderName || "—"} />
                <Row label="Sender Phone" value={form.senderPhone || "—"} />
                <Row label="Receiver" value={form.receiverName || "—"} />
                <Row label="Receiver Phone" value={form.receiverPhone || "—"} />
                <Row label="From" value={form.senderAddress || "—"} />
                <Row label="To" value={form.receiverAddress || "—"} />
                <Row
                  label="Weight"
                  value={form.packageWeight ? `${form.packageWeight} kg` : "—"}
                />
                <Row label="Type" value={form.packageType.replace('_', ' ')} />
                <Row label="Delivery" value={form.deliveryType} />
              </div>

              {trackingId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 rounded-lg bg-success/10 p-4"
                >
                  <p className="text-xs font-medium text-success">Tracking ID Generated</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-lg font-bold text-success">{trackingId}</p>
                    <button onClick={copyId} className="text-success hover:text-success/80">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Save this ID to track your shipment
                  </p>
                </motion.div>
              )}
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
