import { LOCAL_STORAGE_KEYS } from 'common'

const textSizeKey = JSON.stringify(LOCAL_STORAGE_KEYS.UI_TEXT_SIZE)

const appearanceSettingsScript = `try{const value=JSON.parse(localStorage.getItem(${textSizeKey}));document.documentElement.dataset.textSize=value==='small'||value==='large'?value:'default'}catch{document.documentElement.dataset.textSize='default'}`

/** Applies persisted typography before Studio paints to avoid a layout shift. */
export const AppearanceSettingsScript = () => (
  <script dangerouslySetInnerHTML={{ __html: appearanceSettingsScript }} />
)
