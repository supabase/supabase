import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { z } from "zod";
import { createClient } from "@/registry/default/blocks/assistant/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get Supabase auth session
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Initialize MCP client with auth token
    const mcpServerUrl =
      process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
      "http://localhost:54321/functions/v1/mcp-server";

    const mcpClient = await createMCPClient({
      transport: {
        type: "http",
        url: mcpServerUrl,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    });

    // Define MCP tools with schemas for type safety
    const tools = await mcpClient.tools({
      schemas: {
        queryDatabase: {
          inputSchema: z.object({
            table: z.string().describe("The name of the table to query"),
            columns: z
              .string()
              .optional()
              .describe("Columns to select (comma-separated). Defaults to '*' for all columns."),
            filters: z
              .array(
                z.object({
                  column: z.string().describe("The column to filter on"),
                  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]).describe("The filter operator"),
                  value: z.any().describe("The value to filter by"),
                })
              )
              .optional()
              .describe("Array of filter conditions to apply"),
            limit: z
              .number()
              .optional()
              .describe("Maximum number of rows to return"),
            orderBy: z
              .object({
                column: z.string().describe("Column to order by"),
                ascending: z.boolean().optional().describe("Sort order (default: true)"),
              })
              .optional()
              .describe("Ordering options"),
            explanation: z
              .string()
              .optional()
              .describe("Optional explanation of what the query does"),
          }),
        },
      },
    });

    // Stream the AI response with MCP tools
    const result = await streamText({
      model: openai("gpt-4o"),
      messages,
      tools,
      system: `You are a helpful AI assistant with access to a database.
You can help users query their database using natural language.
Use the queryDatabase tool to fetch data from tables with filters and options.
Always provide clear explanations of what the query does.
The database respects Row Level Security (RLS), so users can only access their own data.
When building queries:
- Use the table parameter to specify which table to query
- Use filters array to add conditions (eq, neq, gt, gte, lt, lte, like, ilike, in, is)
- Use limit to control the number of results
- Use orderBy to sort results by a specific column`,
      onFinish: async () => {
        await mcpClient.close();
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
