//csv-utils.ts
export const escapeCsvValue = (value: any): string => {
    const stringValue = String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };
  
  export const generateCSV = (headers: string[], data: any[]): string => {
    const headerLine = headers.map(escapeCsvValue).join(',');
    const dataLines = data.map((row) =>
      headers.map((key) => escapeCsvValue(row[key] ?? '')).join(',')
    );
    return [headerLine, ...dataLines].join('\n');
  };