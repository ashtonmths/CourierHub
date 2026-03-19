"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, CheckCircle, Truck, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { getAgentShipments, updateShipmentStatus } from "@/app/actions/shipments";
import { getCurrentUserProfile } from "@/app/actions/users";
import { ShipmentStatus } from "@prisma/client";
import { shipmentStatusLabels } from "@/lib/shipment";
import { toast } from "sonner";
import { format } from "date-fns";

const navItems = [
  { label: "Today's Deliveries", path: "/agent", icon: <Truck className="h-4 w-4" /> },
  { label: "Completed", path: "/agent", icon: <CheckCircle className="h-4 w-4" /> },
  { label: "Overview", path: "/agent", icon: <LayoutDashboard className="h-4 w-4" /> },
];

type Shipment = Awaited<ReturnType<typeof getAgentShipments>>[0];

const statusActions: ShipmentStatus[] = [
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
  ShipmentStatus.DELIVERED,
];

const statusLabels = shipmentStatusLabels

export default function AgentDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [agentName, setAgentName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profile, shipmentsData] = await Promise.all([
        getCurrentUserProfile(),
        getAgentShipments(),
      ]);

      setAgentName(profile?.name || 'Agent');
      setShipments(shipmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(shipmentId: string, status: ShipmentStatus) {
    try {
      await updateShipmentStatus(shipmentId, status);
      toast.success('Status updated successfully');
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Delivery Agent Dashboard" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const todayActive = shipments.filter((s) => s.status !== ShipmentStatus.DELIVERED);
  const completed = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED);

  return (
    <DashboardLayout title="Delivery Agent Dashboard" navItems={navItems}>
      <div className="mb-4 rounded-xl border bg-accent/10 p-4">
        <p className="text-sm text-muted-foreground">Logged in as</p>
        <p className="font-display text-lg font-bold">{agentName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Today's Deliveries" value={todayActive.length} icon={<Truck className="h-5 w-5" />} color="warning" />
        <StatCard title="Completed" value={completed.length} icon={<CheckCircle className="h-5 w-5" />} color="success" />
        <StatCard title="Total Assigned" value={shipments.length} icon={<Package className="h-5 w-5" />} color="info" />
      </div>

      {/* Today's deliveries */}
      <h2 className="mt-8 font-display text-xl font-bold">Today&apos;s Deliveries</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {todayActive.length === 0 ? (
          <div className="col-span-2 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            No active deliveries at the moment.
          </div>
        ) : (
          todayActive.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-bold">{s.trackingId}</p>
                  <p className="mt-1 text-sm text-foreground">{s.receiverName}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {s.receiverAddress}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {s.packageWeight}kg • {s.packageType} • {s.deliveryType}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusActions.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant={s.status === action ? "default" : "outline"}
                    className={`text-xs ${s.status === action ? "bg-accent text-accent-foreground" : ""}`}
                    onClick={() => handleUpdateStatus(s.id, action)}
                    disabled={s.status === action}
                  >
                    {statusLabels[action]}
                  </Button>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Completed */}
      <h2 className="mt-10 font-display text-xl font-bold">Completed Deliveries</h2>
      <div className="mt-4 rounded-xl border bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tracking ID</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Receiver</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Destination</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {completed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No completed deliveries yet.
                </td>
              </tr>
            ) : (
              completed.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{s.trackingId}</td>
                  <td className="px-4 py-3">{s.receiverName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.receiverAddress}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(s.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
