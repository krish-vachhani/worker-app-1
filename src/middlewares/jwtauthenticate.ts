import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";

const SECRET_KEY = "krish_secret_key";

export const jwtAuthenticate = createMiddleware(
  async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = await verify(token, SECRET_KEY);
      c.set("userId", payload.id);
      await next();
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    }
  }
);
