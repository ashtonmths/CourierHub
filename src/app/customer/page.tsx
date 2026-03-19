"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShipmentTable, type ShipmentTableRow } from "@/components/dashboard/ShipmentTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle, LayoutDashboard, PackagePlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomerShipments } from "@/app/actions/shipments";
import { ShipmentStatus } from "@prisma/client";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", path: "/customer", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Create Shipment", path: "/create-shipment", icon: <Package className="h-4 w-4" /> },
  { label: "Track", path: "/track", icon: <Clock className="h-4 w-4" /> },
];

type Shipment = Awaited<ReturnType<typeof getCustomerShipments>>[0];

export default function CustomerDashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard: redirect to sign-in if not logged in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/customer");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadShipments();
    }
  }, [isLoaded, isSignedIn]);

  async function loadShipments() {
    try {
      const data = await getCustomerShipments();
      setShipments(data);
    } catch (err) {
      console.error("Error loading shipments:", err);
      const message = err instanceof Error ? err.message : "Failed to load shipments";
      // If user isn't synced to DB yet, show a friendlier message
      if (message.includes("User not found")) {
        setError("Your account is still being set up. Please wait a moment and refresh.");
      } else {
        setError(message);
        toast.error("Failed to load shipments");
      }
    } finally {
      setLoading(false);
    }
  }

  // Still loading Clerk session
  if (!isLoaded || (!isSignedIn && !error)) {
    return (
      <DashboardLayout title="Customer Dashboard" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Customer Dashboard" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  // DB sync error state
  if (error) {
    return (
      <DashboardLayout title="Customer Dashboard" navItems={navItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <p className="text-lg font-semibold text-foreground">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" onClick={() => { setError(null); setLoading(true); loadShipments(); }}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const active = shipments.filter((s) => s.status !== ShipmentStatus.DELIVERED);
  const delivered = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED);

  const formatShipments = (ships: Shipment[]): ShipmentTableRow[] =>
    ships.map((s) => ({
      id: s.id,
      trackingId: s.trackingId,
      receiverAddress: s.receiverAddress,
      date: new Date(s.createdAt).toISOString().split("T")[0],
      status: s.status,
      deliveryAgent: s.deliveryAgent?.name || "Unassigned",
      totalAmount: s.totalAmount,
      currency: s.currency,
    }))

  // Empty state
  if (shipments.length === 0) {
    return (
      <DashboardLayout title="Customer Dashboard" navItems={navItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center rounded-xl border border-dashed p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <PackagePlus className="h-8 w-8 text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">No shipments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first shipment to get started.
            </p>
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow">
            <Link href="/create-shipment">
              <Package className="mr-2 h-4 w-4" />
              Create Shipment
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer Dashboard" navItems={navItems}>
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" /> Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Package className="h-4 w-4" /> All Shipments ({shipments.length})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="gap-2">
            <CheckCircle className="h-4 w-4" /> Delivered ({delivered.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <ShipmentTable shipments={formatShipments(active)} />
        </TabsContent>
        <TabsContent value="history">
          <ShipmentTable shipments={formatShipments(shipments)} />
        </TabsContent>
        <TabsContent value="delivered">
          <ShipmentTable shipments={formatShipments(delivered)} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
