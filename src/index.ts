import { Hono } from "hono";

import { router as embedRouter } from "./routes/embed";

const app = new Hono<Env>();

app.route("/embed", embedRouter);

app.notFound(async (c) => {
  if (c.req.method === "GET" || c.req.method === "HEAD") {
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }
  }

  return c.text("not found", 404);
});

export default app;
