export function wrapWithTransaction(sql: string) {
  return /* SQL */ `
    begin;
 
    ${sql}
    
    commit;
  `
}

export function wrapWithRollback(sql: string) {
  return /* SQL */ `
    begin;
 
    ${sql}
    
    rollback;
  `
}
