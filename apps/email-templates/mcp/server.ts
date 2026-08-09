import { Server } from "npm:@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "npm:@modelcontextprotocol/sdk/types.js";

// Load catalog
const catalogPath = new URL("../catalog.json", import.meta.url).pathname;
let catalog: any[] = [];
try {
  const catalogContent = await Deno.readTextFile(catalogPath);
  catalog = JSON.parse(catalogContent);
} catch (e) {
  console.error("Failed to load catalog.json:", e);
}

const server = new Server(
  {
    name: "azabot-email-templates-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
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
        name: "render_and_send_email",
        description: "Sends an email using the specified template and parameters via the internal rendering engine.",
        inputSchema: {
          type: "object",
          properties: {
            template_id: {
              type: "string",
              description: "The ID of the template to use.",
            },
            payload: {
              type: "object",
              description: "The JSON object containing the required and optional parameters for the template.",
            },
          },
          required: ["template_id", "payload"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (name === "list_templates") {
    const list = catalog.map((t) => ({
      id: t.id,
      name: t.name,
      system: t.systemName,
      subject: t.subject,
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(list, null, 2),
        },
      ],
    };
  }

  if (name === "get_template_schema") {
    if (!args || typeof args !== "object" || !args.template_id) {
      throw new Error("Missing template_id");
    }
    const templateId = String(args.template_id);
    const template = catalog.find((t) => t.id === templateId);
    
    if (!template) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Template not found: ${templateId}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            required: template.required || [],
            optional: template.optional || [],
            defaults: {
              subject: template.subject,
              preheader: template.preheader,
              defaultMessage: template.defaultMessage,
            },
          }, null, 2),
        },
      ],
    };
  }

  if (name === "render_and_send_email") {
    if (!args || typeof args !== "object" || !args.template_id || !args.payload) {
      throw new Error("Missing template_id or payload");
    }
    
    const templateId = String(args.template_id);
    const payload = args.payload;

    try {
      // In a real environment, this would call the internal Supabase Edge Function
      // Example: POST http://127.0.0.1:54321/functions/v1/send-template-email
      
      const response = await fetch("http://127.0.0.1:54321/functions/v1/send-template-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email-internal-secret": Deno.env.get("EMAIL_INTERNAL_SECRET") || "DEFAULT_SECRET_IF_NEEDED", 
        },
        body: JSON.stringify({
          template_id: templateId,
          ...payload
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to send email. Status: ${response.status}. Response: ${responseText}`,
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Email successfully triggered! Response: ${responseText}`,
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error calling send endpoint: ${e.message}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azabot Email Templates MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  Deno.exit(1);
});
