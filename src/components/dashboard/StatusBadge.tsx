import { ShipmentStatus } from '@prisma/client'
import { shipmentStatusLabels } from '@/lib/shipment'

const statusStyles: Record<ShipmentStatus, string> = {
  [ShipmentStatus.ORDER_CREATED]: 'bg-muted text-muted-foreground',
  [ShipmentStatus.PICKED_UP]: 'bg-info/15 text-info',
  [ShipmentStatus.IN_TRANSIT]: 'bg-warning/15 text-warning',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'bg-accent/15 text-accent',
  [ShipmentStatus.DELIVERED]: 'bg-success/15 text-success',
}

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>
      {shipmentStatusLabels[status]}
    </span>
  )
}
