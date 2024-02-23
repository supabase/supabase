const dynamicIconImports = {
  '_example-template': () => import('./icons/_example-template'),
  'insert-code': () => import('./icons/insert-code'),
  'replace-code': () => import('./icons/replace-code'),
};
export default dynamicIconImports;
