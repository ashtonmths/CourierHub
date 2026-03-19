import { ShipmentStatus, DeliveryType, PackageType } from '@prisma/client'

export const shipmentStatusSteps: ShipmentStatus[] = [
  ShipmentStatus.ORDER_CREATED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
  ShipmentStatus.DELIVERED,
]

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  [ShipmentStatus.ORDER_CREATED]: 'Order Created',
  [ShipmentStatus.PICKED_UP]: 'Picked Up',
  [ShipmentStatus.IN_TRANSIT]: 'In Transit',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ShipmentStatus.DELIVERED]: 'Delivered',
}

export function getStatusIndex(status: ShipmentStatus): number {
  return shipmentStatusSteps.indexOf(status)
}

export function formatShipmentStatus(status: ShipmentStatus): string {
  return shipmentStatusLabels[status]
}

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  [DeliveryType.STANDARD]: 'Standard',
  [DeliveryType.EXPRESS]: 'Express',
}

export const packageTypeLabels: Record<PackageType, string> = {
  [PackageType.DOCUMENT]: 'Document',
  [PackageType.PARCEL]: 'Parcel',
  [PackageType.FRAGILE]: 'Fragile',
  [PackageType.ELECTRONICS]: 'Electronics',
}
