// Using 'default' Supabase auth middleware
// Change to a specific provider by importing like that:
// import { AuthMiddleware } from "../_shared/jwt/clerk.ts";
import { AuthMiddleware } from "../_shared/jwt/default.ts";

interface reqPayload {
  name: string;
}

Deno.serve((r) =>
  AuthMiddleware(r, async (req) => {
    const { name }: reqPayload = await req.json();
    const data = {
      message: `Hello ${name} from foo!`,
    };

    return Response.json(data);
  })
);
