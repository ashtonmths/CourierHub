"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Users, Truck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { getAllShipments, updateShipmentStatus, assignAgentToShipment, getShipmentStats } from "@/app/actions/shipments";
import { getAllCustomers, getAllAgents, getUserStats } from "@/app/actions/users";
import { ShipmentStatus } from "@prisma/client";
import { toast } from "sonner";
import { format } from "date-fns";

const navItems = [
  { label: "Overview", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Shipments", path: "/admin", icon: <Package className="h-4 w-4" /> },
  { label: "Customers", path: "/admin", icon: <Users className="h-4 w-4" /> },
  { label: "Agents", path: "/admin", icon: <Truck className="h-4 w-4" /> },
];

type Shipment = Awaited<ReturnType<typeof getAllShipments>>[0];
type Customer = Awaited<ReturnType<typeof getAllCustomers>>[0];
type Agent = Awaited<ReturnType<typeof getAllAgents>>[0];

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeDeliveries: 0,
    completedShipments: 0,
    totalCustomers: 0,
    totalAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingShipment, setEditingShipment] = useState<Record<string, { status: ShipmentStatus; agentId: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [shipmentsData, customersData, agentsData, shipmentStats, userStats] = await Promise.all([
        getAllShipments(),
        getAllCustomers(),
        getAllAgents(),
        getShipmentStats(),
        getUserStats(),
      ]);

      setShipments(shipmentsData);
      setCustomers(customersData);
      setAgents(agentsData);
      setStats({
        ...shipmentStats,
        ...userStats,
      });

      // Initialize editing state
      const initialEdit: Record<string, { status: ShipmentStatus; agentId: string }> = {};
      shipmentsData.forEach((s) => {
        initialEdit[s.id] = {
          status: s.status,
          agentId: s.deliveryAgentId || '',
        };
      });
      setEditingShipment(initialEdit);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateShipment(shipmentId: string) {
    const edits = editingShipment[shipmentId];
    if (!edits) return;

    try {
      const shipment = shipments.find(s => s.id === shipmentId);
      if (!shipment) return;

      // Update status if changed
      if (edits.status !== shipment.status) {
        await updateShipmentStatus(shipmentId, edits.status);
      }

      // Update agent if changed
      if (edits.agentId !== (shipment.deliveryAgentId || '')) {
        await assignAgentToShipment(shipmentId, edits.agentId);
      }

      toast.success('Shipment updated successfully');
      await loadData();
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast.error('Failed to update shipment');
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Shipments" value={stats.totalShipments} icon={<Package className="h-5 w-5" />} color="default" />
        <StatCard title="Active Deliveries" value={stats.activeDeliveries} icon={<Truck className="h-5 w-5" />} color="warning" />
        <StatCard title="Completed" value={stats.completedShipments} icon={<Package className="h-5 w-5" />} color="success" />
        <StatCard title="Customers" value={stats.totalCustomers} icon={<Users className="h-5 w-5" />} color="info" />
        <StatCard title="Agents" value={stats.totalAgents} icon={<Star className="h-5 w-5" />} color="accent" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shipments" className="mt-8 space-y-6">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          <div className="rounded-xl border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tracking ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sender</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Receiver</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{s.trackingId}</td>
                      <td className="px-4 py-3">{s.senderName}</td>
                      <td className="px-4 py-3">{s.receiverName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCurrency(s.totalAmount, s.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-md border bg-card px-2 py-1 text-xs"
                          value={editingShipment[s.id]?.status || s.status}
                          onChange={(e) =>
                            setEditingShipment((prev) => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], status: e.target.value as ShipmentStatus },
                            }))
                          }
                        >
                          <option value="ORDER_CREATED">Order Created</option>
                          <option value="PICKED_UP">Picked Up</option>
                          <option value="IN_TRANSIT">In Transit</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-md border bg-card px-2 py-1 text-xs"
                          value={editingShipment[s.id]?.agentId || ''}
                          onChange={(e) =>
                            setEditingShipment((prev) => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], agentId: e.target.value },
                            }))
                          }
                        >
                          <option value="">Unassigned</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleUpdateShipment(s.id)}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="rounded-xl border bg-card shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Shipments</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">{c.totalShipments || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.joinDate ? format(new Date(c.joinDate), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold">{a.name}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      a.status === 'ACTIVE'
                        ? 'bg-success/15 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                      {a.status || 'INACTIVE'}
                  </span>
                </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.zone || 'Unassigned'}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-foreground">{a.activeDeliveries || 0}</p>
                    <p className="text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-foreground">{a.completedDeliveries || 0}</p>
                    <p className="text-muted-foreground">Done</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-foreground">{a.rating?.toFixed(1) || '0.0'}</p>
                    <p className="text-muted-foreground">Rating</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function formatCurrency(amount?: number | null, currency = 'INR') {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return `${currency} ${value.toFixed(2)}`
}
