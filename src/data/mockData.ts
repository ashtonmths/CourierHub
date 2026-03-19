export type ShipmentStatus = "Order Created" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered";

export interface Shipment {
  id: string;
  trackingId: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  packageWeight: string;
  packageType: string;
  deliveryType: "Standard" | "Express";
  contactNumber: string;
  status: ShipmentStatus;
  date: string;
  deliveryAgent: string;
  estimatedDelivery: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalShipments: number;
  joinDate: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  zone: string;
  activeDeliveries: number;
  completedDeliveries: number;
  rating: number;
  status: "Available" | "On Delivery" | "Off Duty";
}

export const shipments: Shipment[] = [
  { id: "1", trackingId: "CH-2024-001", senderName: "Priya Sharma",  senderAddress: "42 Bandra West, Mumbai, Maharashtra",     receiverName: "Ramesh Joshi",  receiverAddress: "12 FC Road, Pune, Maharashtra",          packageWeight: "2.5 kg", packageType: "Document",    deliveryType: "Express",  contactNumber: "+91-98765-10101", status: "In Transit",       date: "2024-03-10", deliveryAgent: "Suresh Gupta",  estimatedDelivery: "2024-03-12" },
  { id: "2", trackingId: "CH-2024-002", senderName: "Amit Patel",    senderAddress: "7 Navrangpura, Ahmedabad, Gujarat",        receiverName: "Bhavna Shah",   receiverAddress: "33 Athwa Lines, Surat, Gujarat",         packageWeight: "5.0 kg", packageType: "Parcel",      deliveryType: "Standard", contactNumber: "+91-98765-10202", status: "Delivered",        date: "2024-03-08", deliveryAgent: "Lakshmi Iyer", estimatedDelivery: "2024-03-11" },
  { id: "3", trackingId: "CH-2024-003", senderName: "Sunita Verma",  senderAddress: "15 Lajpat Nagar, New Delhi",              receiverName: "Pooja Gupta",   receiverAddress: "78 Malviya Nagar, Jaipur, Rajasthan",   packageWeight: "1.2 kg", packageType: "Fragile",     deliveryType: "Express",  contactNumber: "+91-98765-10303", status: "Out for Delivery", date: "2024-03-11", deliveryAgent: "Suresh Gupta",  estimatedDelivery: "2024-03-11" },
  { id: "4", trackingId: "CH-2024-004", senderName: "Kiran Rao",     senderAddress: "88 Koramangala, Bengaluru, Karnataka",     receiverName: "Vikram Pillai", receiverAddress: "55 Jubilee Hills, Hyderabad, Telangana", packageWeight: "8.0 kg", packageType: "Electronics", deliveryType: "Express",  contactNumber: "+91-98765-10404", status: "Picked Up",        date: "2024-03-11", deliveryAgent: "Arjun Mehta",   estimatedDelivery: "2024-03-13" },
  { id: "5", trackingId: "CH-2024-005", senderName: "Deepak Singh",  senderAddress: "23 Salt Lake City, Kolkata, West Bengal", receiverName: "Anjali Bose",   receiverAddress: "9 Kalpana Square, Bhubaneswar, Odisha", packageWeight: "3.3 kg", packageType: "Parcel",      deliveryType: "Standard", contactNumber: "+91-98765-10505", status: "Order Created",    date: "2024-03-12", deliveryAgent: "Lakshmi Iyer", estimatedDelivery: "2024-03-16" },
  { id: "6", trackingId: "CH-2024-006", senderName: "Meena Nair",    senderAddress: "5 T Nagar, Chennai, Tamil Nadu",           receiverName: "Suresh Kumar",  receiverAddress: "44 RS Puram, Coimbatore, Tamil Nadu",   packageWeight: "4.7 kg", packageType: "Document",    deliveryType: "Standard", contactNumber: "+91-98765-10606", status: "Delivered",        date: "2024-03-06", deliveryAgent: "Arjun Mehta",   estimatedDelivery: "2024-03-09" },
  { id: "7", trackingId: "CH-2024-007", senderName: "Priya Sharma",  senderAddress: "42 Bandra West, Mumbai, Maharashtra",     receiverName: "Ravi Shankar",  receiverAddress: "31 Civil Lines, Nagpur, Maharashtra",   packageWeight: "6.1 kg", packageType: "Fragile",     deliveryType: "Express",  contactNumber: "+91-98765-10101", status: "In Transit",       date: "2024-03-10", deliveryAgent: "Suresh Gupta",  estimatedDelivery: "2024-03-12" },
  { id: "8", trackingId: "CH-2024-008", senderName: "Amit Patel",    senderAddress: "7 Navrangpura, Ahmedabad, Gujarat",        receiverName: "Geeta Mehta",   receiverAddress: "18 Alkapuri, Vadodara, Gujarat",        packageWeight: "0.8 kg", packageType: "Document",    deliveryType: "Standard", contactNumber: "+91-98765-10202", status: "Delivered",        date: "2024-03-05", deliveryAgent: "Lakshmi Iyer", estimatedDelivery: "2024-03-08" },
];

export const customers: Customer[] = [
  { id: "1", name: "Priya Sharma",  email: "priya@example.com",  phone: "+91-98765-10101", address: "42 Bandra West, Mumbai, Maharashtra 400050",    totalShipments: 12, joinDate: "2023-06-15" },
  { id: "2", name: "Amit Patel",   email: "amit@example.com",   phone: "+91-98765-10202", address: "7 Navrangpura, Ahmedabad, Gujarat 380009",       totalShipments: 8,  joinDate: "2023-08-22" },
  { id: "3", name: "Sunita Verma", email: "sunita@example.com", phone: "+91-98765-10303", address: "15 Lajpat Nagar, New Delhi, Delhi 110024",       totalShipments: 5,  joinDate: "2023-11-01" },
  { id: "4", name: "Kiran Rao",    email: "kiran@example.com",  phone: "+91-98765-10404", address: "88 Koramangala, Bengaluru, Karnataka 560034",    totalShipments: 15, joinDate: "2023-04-10" },
  { id: "5", name: "Deepak Singh", email: "deepak@example.com", phone: "+91-98765-10505", address: "23 Salt Lake City, Kolkata, West Bengal 700091", totalShipments: 3,  joinDate: "2024-01-20" },
  { id: "6", name: "Meena Nair",   email: "meena@example.com",  phone: "+91-98765-10606", address: "5 T Nagar, Chennai, Tamil Nadu 600017",          totalShipments: 20, joinDate: "2023-02-05" },
];

export const deliveryAgents: DeliveryAgent[] = [
  { id: "1", name: "Suresh Gupta",  email: "suresh@courierhub.com",  phone: "+91-98765-20101", zone: "North India", activeDeliveries: 3, completedDeliveries: 142, rating: 4.8, status: "On Delivery" },
  { id: "2", name: "Lakshmi Iyer",  email: "lakshmi@courierhub.com", phone: "+91-98765-20202", zone: "South India", activeDeliveries: 2, completedDeliveries: 198, rating: 4.9, status: "On Delivery" },
  { id: "3", name: "Arjun Mehta",   email: "arjun@courierhub.com",   phone: "+91-98765-20303", zone: "West India",  activeDeliveries: 1, completedDeliveries: 87,  rating: 4.6, status: "Available" },
  { id: "4", name: "Nandini Reddy", email: "nandini@courierhub.com", phone: "+91-98765-20404", zone: "East India",  activeDeliveries: 0, completedDeliveries: 165, rating: 4.7, status: "Off Duty" },
];

export const statusSteps: ShipmentStatus[] = [
  "Order Created",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

export function getStatusIndex(status: ShipmentStatus): number {
  return statusSteps.indexOf(status);
}
