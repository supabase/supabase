export type Usage = { day: string; amount: number; clean: number };

interface Usages {
  water: Array<Usage>;
  gas: Array<Usage>;
  electricity: Array<Usage>;
}

function generateUsages(startDay: number, days: number): Usages {
  const generateUsage = (
    day: number,
    min: number,
    max: number,
    cleanPercentage: number = 0,
  ): Usage => {
    const amount = Number((Math.random() * (max - min) + min).toFixed(1));
    return {
      day: String(day),
      amount,
      clean: Number((amount * cleanPercentage).toFixed(1)),
    };
  };

  const generateSequence = (start: number, count: number) => {
    return Array.from({ length: count }, (_, i) => {
      let day = start + i;
      if (day > 31) day -= 31;
      return day;
    });
  };

  const sequence = generateSequence(startDay, days);

  return {
    water: sequence.map((day) => generateUsage(day, 30, 165)),
    gas: sequence.map((day) => generateUsage(day, 1, 6)),
    electricity: sequence.map((day) => generateUsage(day, 20, 55, 0.55)),
  };
}

export const USAGES: Usages = generateUsages(23, 14);
