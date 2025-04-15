export type Percentile = 50 | 75 | 90 | 95 | 99;

export function calculateSpecificPercentile(
  values: number[],
  percentile: Percentile
) {
  // Step 1: Sort the values in ascending order
  const sortedValues = values.slice().sort((a, b) => a - b);
  const n = sortedValues.length;

  // Step 2: Calculate the index for the given percentile
  const index = (percentile / 100) * (n - 1);

  // Step 3: Handle non-integer index (interpolate between values)
  if (Number.isInteger(index)) {
    return sortedValues[index];
  } else {
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const weight = index - lowerIndex;

    // Interpolate between the two nearest values
    return (
      sortedValues[lowerIndex] * (1 - weight) +
      sortedValues[upperIndex] * weight
    );
  }
}

export function calculatePercentile(values: number[], value: number) {
  // Step 1: Sort the values in ascending order
  const sortedValues = values.slice().sort((a, b) => a - b);
  const n = sortedValues.length;

  // Step 2: Find how many values are less than or equal to the given value
  const rank = sortedValues.filter((val) => val <= value).length;

  // Step 3: Calculate the percentile using the formula
  const percentile = (rank / n) * 100;

  return percentile;
}

export function getPercentileColor(value: number) {
  if (value < 50) {
    return {
      text: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/50",
      border: "border-green-200 dark:border-green-800",
    };
  } else if (value < 75) {
    return {
      text: "text-yellow-500",
      bg: "bg-yellow-100 dark:bg-yellow-900/50",
      border: "border-yellow-200 dark:border-yellow-800",
    };
  } else if (value < 90) {
    return {
      text: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/50",
      border: "border-orange-200 dark:border-orange-800",
    };
  } else {
    return {
      text: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/50",
      border: "border-red-200 dark:border-red-800",
    };
  }
}
