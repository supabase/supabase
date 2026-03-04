import { corsHeaders } from "../advisors-shared/cors.ts";
import { toolRegistry } from "./tools/registry.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/advisors-mcp\/?/, "/");

    if (req.method === "GET" && (pathname === "/" || pathname === "/tools")) {
      const tools = Object.entries(toolRegistry).map(([name, tool]) => ({
        name,
        description: tool.description,
        parameters: tool.parameters,
      }));
      return new Response(JSON.stringify({ tools }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && pathname === "/execute") {
      const body = await req.json();
      const { tool: toolName, parameters } = body;

      const tool = toolRegistry[toolName as keyof typeof toolRegistry];
      if (!tool) {
        return new Response(JSON.stringify({ error: `Unknown tool: ${toolName}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await tool.execute(parameters ?? {});
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
