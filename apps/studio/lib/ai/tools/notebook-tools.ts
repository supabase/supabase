import { createTool as createCreateNotebookTool } from './create-notebook.server'
import { createTool as createDeleteNotebookTool } from './delete-notebook.server'
import { createTool as createGetNotebookTool } from './get-notebook.server'
import { createTool as createListDatabasesTool } from './list-databases.server'
import { createTool as createListNotebooksTool } from './list-notebooks.server'
import { createTool as createRunNotebookTool } from './run-notebook.server'
import type { ToolContext } from './types'
import { createTool as createUpdateNotebookTool } from './update-notebook.server'

export const getNotebookTools = (ctx: ToolContext = {}) => {
  return {
    list_databases: createListDatabasesTool(ctx),
    list_notebooks: createListNotebooksTool(ctx),
    get_notebook: createGetNotebookTool(ctx),
    run_notebook: createRunNotebookTool(ctx),
    create_notebook: createCreateNotebookTool(ctx),
    update_notebook: createUpdateNotebookTool(ctx),
    delete_notebook: createDeleteNotebookTool(ctx),
  }
}
