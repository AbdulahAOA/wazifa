import type { ApplicationStatus, UserRole } from "@/lib/types";

const adminTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  Pending: ["Under Review", "Accepted", "Rejected"],
  "Under Review": ["Accepted", "Rejected", "Pending"],
  Accepted: [],
  Rejected: ["Under Review"],
  Withdrawn: [],
};

const candidateTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  Pending: ["Withdrawn"],
  "Under Review": ["Withdrawn"],
  Accepted: [],
  Rejected: [],
  Withdrawn: [],
};

export function nextStatuses(role: UserRole, from: ApplicationStatus) {
  return role === "admin" ? adminTransitions[from] : candidateTransitions[from];
}

export function canTransition(role: UserRole, from: ApplicationStatus, to: ApplicationStatus) {
  return nextStatuses(role, from).includes(to);
}
