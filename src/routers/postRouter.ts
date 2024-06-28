import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { env } from "hono/adapter";
import z, { number } from "zod";
import { decode, sign, verify } from "hono/jwt";
import { jwtAuthenticate } from "../middlewares/jwtauthenticate";
const SECRET_KEY = "krish_secret_key";

const postRouter = new Hono();

const postSchema = z.object({
  title: z.string(),
  body: z.string(),
});

postRouter.get("", async (c) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = prisma.posts.findMany({});
  return c.json(posts);
});

postRouter.post("", jwtAuthenticate, async (c) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const body: z.infer<typeof postSchema> = await c.req.json();
  const { success } = postSchema.safeParse(body);
  if (!success) {
    return c.json({ error: "Wrong Details" }, 403);
  }
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId");
  await prisma.posts.create({
    data: {
      userId,
      title: body.title,
      body: body.body,
    },
  });
});

export default postRouter;
