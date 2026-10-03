import { faker } from "@faker-js/faker";

export function makeText(len: number): string[] {
  return [...Array(len).keys()].map((_) => faker.lorem.text());
}
