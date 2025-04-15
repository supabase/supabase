export function getStatusColor(
  value: number
): Record<"text" | "bg" | "border", string> {
  if (value < 100 || value >= 600)
    return {
      text: "text-gray-500",
      bg: "bg-gray-100 dark:bg-gray-900/50",
      border: "border-gray-200 dark:border-gray-800",
    };
  switch (value.toString().charAt(0)) {
    case "1":
      return {
        text: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/50",
        border: "border-blue-200 dark:border-blue-800",
      };
    case "2":
      return {
        text: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/50",
        border: "border-green-200 dark:border-green-800",
      };
    case "3":
      return {
        text: "text-yellow-500",
        bg: "bg-yellow-100 dark:bg-yellow-900/50",
        border: "border-yellow-200 dark:border-yellow-800",
      };
    case "4":
      return {
        text: "text-orange-500",
        bg: "bg-orange-100 dark:bg-orange-900/50",
        border: "border-orange-200 dark:border-orange-800",
      };
    case "5":
      return {
        text: "text-red-500",
        bg: "bg-red-100 dark:bg-red-900/50",
        border: "border-red-200 dark:border-red-800",
      };
    default:
      return {
        text: "text-gray-500",
        bg: "bg-gray-100 dark:bg-gray-900/50",
        border: "border-gray-200 dark:border-gray-800",
      };
  }
}
