"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { getShipmentByTrackingId } from "@/app/actions/shipments";
import { deliveryTypeLabels, packageTypeLabels, formatShipmentStatus } from "@/lib/shipment";
import { Search, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackShipment() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof getShipmentByTrackingId>> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const track = async () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const found = await getShipmentByTrackingId(trimmed);
      if (found) {
        setResult(found);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error("Tracking lookup failed:", error);
      setResult(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold">Track Your Shipment</h1>
          <p className="mt-2 text-muted-foreground">Enter your tracking ID to see live delivery status</p>
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-lg gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="e.g. CH-2024-DEL"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && track()}
              className="pl-9"
            />
          </div>
          <Button onClick={track} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Searching..." : "Track"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-12 grid gap-8 md:grid-cols-2"
            >
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold">Shipment Details</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <Detail label="Tracking ID" value={result.trackingId} />
                  <Detail label="Status" value={formatShipmentStatus(result.status)} />
                  <Detail label="From" value={result.senderAddress} />
                  <Detail label="To" value={result.receiverAddress} />
                  <Detail
                    label="Package"
                    value={`${result.packageWeight} kg — ${packageTypeLabels[result.packageType]}`}
                  />
                  <Detail
                    label="Delivery"
                    value={deliveryTypeLabels[result.deliveryType]}
                  />
                  <Detail
                    label="Agent"
                    value={result.deliveryAgent?.name || "Unassigned"}
                  />
                  <Detail label="ETA" value={formatDate(result.estimatedDelivery)} />
                </div>
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Pricing</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <Detail label="Base + Weight" value={formatCurrency(result.price, result.currency)} />
                    <Detail label="Fuel Surcharge" value={formatCurrency(result.fuelSurcharge, result.currency)} />
                    <Detail label="Tax" value={formatCurrency(result.taxAmount, result.currency)} />
                    <Detail label="Insurance" value={formatCurrency(result.insuranceFee, result.currency)} />
                    <Detail label="Total" value={formatCurrency(result.totalAmount, result.currency)} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <h3 className="mb-6 font-display text-lg font-semibold">Delivery Progress</h3>
                <TrackingTimeline currentStatus={result.status} />
                {result.statusHistory?.length ? (
                  <div className="mt-6 border-t pt-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Status History</p>
                    <div className="mt-3 space-y-3">
                      {result.statusHistory.map((entry) => (
                        <div key={entry.id} className="rounded-lg border bg-muted/40 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {formatShipmentStatus(entry.status)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.location && (
                            <p className="mt-1 text-muted-foreground">{entry.location}</p>
                          )}
                          {entry.notes && (
                            <p className="mt-1 text-muted-foreground">{entry.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {notFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 rounded-xl border bg-card p-8 text-center shadow-card"
            >
              <p className="text-muted-foreground">No shipment found for &quot;<span className="font-semibold text-foreground">{query}</span>&quot;</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString()
}

function formatDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

function formatCurrency(amount?: number | null, currency = 'INR') {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return `${currency} ${value.toFixed(2)}`
}
