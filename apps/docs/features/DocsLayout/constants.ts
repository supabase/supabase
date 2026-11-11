import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'

export const DOCS_LAYOUT_FLAG = 'docs-layout-v2'

// runs before paint, so a v2 reader never sees the legacy header height that the server renders
export const DOCS_LAYOUT_CACHE_SCRIPT = `try{var o=new URLSearchParams(location.search).get('${DOCS_LAYOUT_FLAG}');var v=o==='true'||o==='false'?o:sessionStorage.getItem('${DOCS_LAYOUT_FLAG}')||localStorage.getItem('${LOCAL_STORAGE_KEYS.DOCS_LAYOUT_FLAG}');if(v==='true')document.documentElement.dataset.docsLayout='v2'}catch(e){}`
