import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/types";

const map: Record<ApplicationStatus, { tone: "electric" | "cobalt" | "ink" | "coral" | "pale"; label: string }> = {
  Pending: { tone: "electric", label: "Pending" },
  "Under Review": { tone: "cobalt", label: "Under Review" },
  Accepted: { tone: "ink", label: "Accepted" },
  Rejected: { tone: "coral", label: "Rejected" },
  Withdrawn: { tone: "pale", label: "Withdrawn" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const item = map[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
