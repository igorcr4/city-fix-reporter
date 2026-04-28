import type { Report } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { StatusBadge } from "@/features/reports/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

interface ReportCardProps {
  report: Report;
  index?: number;
}

export function ReportCard({ report, index = 0 }: ReportCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/reports/${report.id}`)}
      className="flex cursor-pointer gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      {report.imageUrl && (
        <img
          src={report.imageUrl}
          alt={report.title}
          className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-heading text-sm font-semibold text-foreground">
            {report.title}
          </h3>
          <StatusBadge status={report.status} />
        </div>
        <span className="text-xs font-medium text-primary">
          {CATEGORY_LABELS[report.category]}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {report.authorUsername}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(report.createdAt).toLocaleDateString("ro-RO")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
