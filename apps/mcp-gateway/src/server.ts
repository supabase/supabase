import express from "npm:express";
import { Server } from "npm:@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "npm:@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "npm:@modelcontextprotocol/sdk/types.js";
import { listTemplates, getTemplateSchema, renderAndSendEmail } from "./tools/email.ts";
import { MailboxType } from "./config/mail.ts";

const app = express();
const port = parseInt(Deno.env.get("PORT") || "8080", 10);

const mcpServer = new Server(
  {
    name: "azab-mcp-gateway",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_templates",
        description: "Returns a list of all available email templates, their IDs, and descriptions.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_template_schema",
        description: "Returns the required and optional parameters for a specific email template.",
        inputSchema: {
          type: "object",
          properties: {
            template_id: {
              type: "string",
              description: "The ID of the template (e.g., az.auth.account_created.ar.v1)",
            },
          },
          required: ["template_id"],
        },
      },
      {
        name: "send_email",
        description: "Renders and sends an email via SMTP using the specified template, payload, and sender mailbox.",
        inputSchema: {
          type: "object",
          properties: {
            template_id: {
              type: "string",
              description: "The ID of the template to use.",
            },
            payload: {
              type: "object",
              description: "The JSON object containing the parameters (e.g. recipient_name, action_url).",
            },
            to: {
              type: "string",
              description: "The recipient email address.",
            },
            mailbox: {
              type: "string",
              description: "The mailbox to send from (notifications, noreply, maintenance, agent, uberfix). Defaults to notifications.",
              enum: ["notifications", "noreply", "maintenance", "agent", "uberfix"],
            },
          },
          required: ["template_id", "payload", "to"],
        },
      },
    ],
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (name === "list_templates") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(listTemplates(), null, 2),
        },
      ],
    };
  }

  if (name === "get_template_schema") {
    if (!args || typeof args !== "object" || !args.template_id) {
      throw new Error("Missing template_id");
    }
    const templateId = String(args.template_id);
    try {
      const schema = getTemplateSchema(templateId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [{ type: "text", text: e.message }],
      };
    }
  }

  if (name === "send_email") {
    if (!args || typeof args !== "object" || !args.template_id || !args.payload || !args.to) {
      throw new Error("Missing template_id, payload, or to address");
    }
    
    const templateId = String(args.template_id);
    const payload = args.payload;
    const to = String(args.to);
    const mailbox = (args.mailbox as MailboxType) || "notifications";

    try {
      const result = await renderAndSendEmail(templateId, payload, to, mailbox);
      return {
        content: [
          {
            type: "text",
            text: `Email successfully sent! Message ID: ${result.messageId}, Subject: ${result.subject}`,
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error sending email: ${e.message}` }],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Map of session IDs to SSEServerTransports
const transports = new Map<string, SSEServerTransport>();

app.get("/mail/sse", async (req, res) => {
  // Setup SSE Transport
  const transport = new SSEServerTransport("/mail/messages", res);
  await mcpServer.connect(transport);
  transports.set(transport.sessionId, transport);
  
  res.on("close", () => {
    transports.delete(transport.sessionId);
  });
});

app.post("/mail/messages", express.json(), async (req, res) => {
  // Find the transport for this session from query params or whatever standard MCP uses
  // Note: SDK typically reads sessionId from query params.
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  
  if (!transport) {
    return res.status(404).send("Session not found");
  }
  
  await transport.handlePostMessage(req, res);
});

// Basic health check
app.get("/health", (req, res) => {
  res.send("Azab MCP Gateway is running.");
});

app.listen(port, () => {
  console.log(`Azab MCP Gateway server running on port ${port}`);
});

// Prevent Deno from exiting since Express listen might not block the event loop in Deno compat layer
setInterval(() => {}, 1000 * 60 * 60);
