import { ShipmentStatus } from '@prisma/client'
import { shipmentStatusSteps, getStatusIndex, formatShipmentStatus } from '@/lib/shipment'
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface TrackingTimelineProps {
  currentStatus: ShipmentStatus;
}

export function TrackingTimeline({ currentStatus }: TrackingTimelineProps) {
  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="space-y-0">
      {shipmentStatusSteps.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "border-success bg-success text-success-foreground"
                    : "border-border bg-card text-muted-foreground"
                } ${isCurrent ? "ring-4 ring-success/20" : ""}`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
              </div>
              {i < shipmentStatusSteps.length - 1 && (
                <div
                  className={`h-12 w-0.5 ${
                    i < currentIndex ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>
            <div className="pb-12 pt-2">
              <p className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {formatShipmentStatus(step)}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-accent font-medium">Current status</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
