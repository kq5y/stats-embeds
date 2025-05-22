import { Hono } from "hono";

import { handler as recentHandler } from "./recent";
import { handler as topHandler } from "./top";

const router = new Hono<Env>();

router.get("/recent", recentHandler);
router.get("/top", topHandler);

export { router };
