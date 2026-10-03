import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list', async () => {
  const res = await pgMeta.config.list()
  expect(res.data?.find(({ name }) => name === 'autovacuum')).toMatchInlineSnapshot(`
    {
      "boot_val": "on",
      "category": "Autovacuum",
      "context": "sighup",
      "enumvals": null,
      "extra_desc": null,
      "group": "Autovacuum",
      "max_val": null,
      "min_val": null,
      "name": "autovacuum",
      "pending_restart": false,
      "reset_val": "on",
      "setting": "on",
      "short_desc": "Starts the autovacuum subprocess.",
      "source": "default",
      "sourcefile": null,
      "sourceline": null,
      "subgroup": "",
      "unit": null,
      "vartype": "bool",
    }
  `)
})
