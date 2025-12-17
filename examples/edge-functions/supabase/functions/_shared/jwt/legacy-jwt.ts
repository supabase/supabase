// Legacy supabase JWT verification
// Use this template to validate tokens using the legacy symmetric JWT secret

import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

// Automatically supplied by Supabase
const JWT_SECRET = Deno.env.get("JWT_SECRET");

export function getAuthToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer") {
    throw new Error(`Auth header is not 'Bearer {token}'`);
  }
  return token;
}

async function verifyJWT(jwt: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);
  try {
    await jose.jwtVerify(jwt, secretKey);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

// Validates authorization header
export async function AuthMiddleware(
  req: Request,
  next: (req: Request) => Promise<Response>,
) {
  if (req.method === "OPTIONS") return await next(req);

  try {
    const token = getAuthToken(req);
    const isValidJWT = await verifyJWT(token);

    if (isValidJWT) return await next(req);

    return Response.json({ msg: "Invalid JWT" }, {
      status: 401,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ msg: e?.toString() }, {
      status: 401,
    });
  }
}
