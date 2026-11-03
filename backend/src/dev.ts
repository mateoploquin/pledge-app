// Local development server. On Vercel the default export of src/index.ts is used directly.
import { serve } from "@hono/node-server";
import app from "./index.js";

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`pledge-backend listening on http://localhost:${port}`);
});
