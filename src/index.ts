import { Hono } from "hono";
import userRouter from "./routers/userRouter";
import postRouter from "./routers/postRouter";

const app = new Hono();

app.route("/users", userRouter);

app.route("/posts", postRouter);
export default app;
