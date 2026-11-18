export const REQUEST_CATEGORIES = [
  "computer",
  "classroom-equipment",
  "internet",
  "hostel-maintenance",
  "electrical",
  "library",
  "other",
];

export const REQUEST_PRIORITIES = ["Low", "Medium", "High"];

export function isNonEmptyString(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
