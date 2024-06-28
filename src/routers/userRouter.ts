import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { env } from "hono/adapter";
import z from "zod";
import { decode, sign, verify } from "hono/jwt";
const SECRET_KEY = "krish_secret_key";
const userRouter = new Hono();

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

userRouter.post("/signup", async (c) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const body: z.infer<typeof signupSchema> = await c.req.json();
  const { success } = signupSchema.safeParse(body);
  if (!success) {
    return c.json({ error: "Wrong Details" }, 403);
  }

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: body.username }, { email: body.email }],
    },
  });
  if (user) {
    return c.json({ message: "User Already Exists" });
  }

  await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      password: body.password,
    },
  });

  return c.json({ message: "User Created Successfully" });
});

userRouter.post("/signin", async (c) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const body: z.infer<typeof signinSchema> = await c.req.json();
  const { success } = signinSchema.safeParse(body);
  if (!success) {
    return c.json({ error: "Wrong Details" }, 403);
  }

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate()); 

  const user = await prisma.user.findFirst({
    where: {
      AND: [{ email: body.email }, { password: body.password }],
    },
  });
  if (!user) {
    return c.json({ message: "User Does Not Exist" });
  }
  const token = await sign(
    {
      id: user.id,
    },
    SECRET_KEY
  );
  return c.json({
    token,
  });
});
export default userRouter;
