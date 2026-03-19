import { useState } from "react";
import { ShipmentStatus } from '@prisma/client'
import { StatusBadge } from "./StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type ShipmentTableRow = {
  id: string
  trackingId: string
  receiverAddress: string
  date: string
  status: ShipmentStatus
  deliveryAgent: string
  totalAmount?: number
  currency?: string
}

interface ShipmentTableProps {
  shipments: ShipmentTableRow[]
  showAgent?: boolean
}

export function ShipmentTable({ shipments, showAgent = true }: ShipmentTableProps) {
  const [search, setSearch] = useState("")

  const filtered = shipments.filter(
    (s) =>
      s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      s.receiverAddress.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search shipments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tracking ID</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Destination</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              {showAgent && <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Agent</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-medium text-foreground">{s.trackingId}</td>
                <td className="px-4 py-3 text-foreground">{s.receiverAddress}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.date}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.totalAmount !== undefined ? formatCurrency(s.totalAmount, s.currency) : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                {showAgent && <td className="px-4 py-3 text-muted-foreground">{s.deliveryAgent}</td>}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showAgent ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                  No shipments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCurrency(amount: number, currency = 'INR') {
  const value = Number.isFinite(amount) ? amount : 0
  return `${currency} ${value.toFixed(2)}`
}
