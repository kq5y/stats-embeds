import type { Handler } from "hono";

const handler: Handler<Env, "top"> = async (c) => {
  return c.json({test: 0});
}

export { handler };
