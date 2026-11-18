export const REQUEST_STATUSES = [
  "Pending",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Rejected",
];

const ALLOWED_TRANSITIONS = {
  Pending: ["Under Review", "Rejected"],
  "Under Review": ["Assigned", "Rejected"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: ["Closed"],
  Closed: [],
  Rejected: [],
};

export function canTransitionRequest(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
