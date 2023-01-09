export function wrapWithTransaction(sql: string) {
  return /* SQL */ `
    begin;

    ${sql}
    
    commit;
  `
}
