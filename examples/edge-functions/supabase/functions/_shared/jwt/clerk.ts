// Clerk as a third-party provider alongside Supabase Auth.
// Use this template to validate tokens issued by Clerk integration
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

// Obtain from https://clerk.com/setup/supabase
// Must supply this value from function env
const AUTH_THIRD_PARTY_CLERK_DOMAIN = Deno.env.get(
  "AUTH_THIRD_PARTY_CLERK_DOMAIN",
);

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
  try {
    const JWK = jose.createRemoteJWKSet(
      new URL(AUTH_THIRD_PARTY_CLERK_DOMAIN ?? ""),
    );
    await jose.jwtVerify(jwt, JWK, {
      algorithms: ["RS256"],
    });
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
