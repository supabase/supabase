import { listAlertsTool } from "./list-alerts.ts";
import { getAlertTool } from "./get-alert.ts";
import { createAlertTool } from "./create-alert.ts";
import { commentOnAlertTool } from "./comment-on-alert.ts";
import { listAgentsTool } from "./list-agents.ts";
import { listTasksTool } from "./list-tasks.ts";
import { listIssuesTool } from "./list-issues.ts";

export const toolRegistry = {
  listAlerts: listAlertsTool,
  getAlert: getAlertTool,
  createAlert: createAlertTool,
  commentOnAlert: commentOnAlertTool,
  listAgents: listAgentsTool,
  listTasks: listTasksTool,
  listIssues: listIssuesTool,
};

export type ToolName = keyof typeof toolRegistry;
