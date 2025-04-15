import { format } from "date-fns";

export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(ms / 1000) + "s"
    );
  }

  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(ms) +
    "ms"
  );
}

export function formatMilliseconds(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
    value
  );
}

export function formatDate(value: Date | string) {
  return format(new Date(`${value}`), "LLL dd, y HH:mm");
}

export function formatCompactNumber(value: number) {
  if (value >= 100 && value < 1000) {
    return value.toString(); // Keep the number as is if it's in the hundreds
  } else if (value >= 1000 && value < 1000000) {
    return (value / 1000).toFixed(1) + "k"; // Convert to 'k' for thousands
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M"; // Convert to 'M' for millions
  } else {
    return value.toString(); // Optionally handle numbers less than 100 if needed
  }
}
