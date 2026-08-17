import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import { LineSchema, PortSchema } from "../types/index.js";

// 起動: tsx scripts/server.ts --host 0.0.0.0 --port 5174 --root .
const { values: args } = parseArgs({
  options: {
    host: { type: "string", short: "h", default: "0.0.0.0" },
    port: { type: "string", short: "p", default: "5174" },
    root: { type: "string", short: "r", default: `${process.cwd()}/data` },
    origin: { type: "string", short: "o", default: "*" },
  },
});

const save = async (ctx: Context, dir: string, schema: z.ZodTypeAny) => {
  const id = ctx.req.param("id") ?? "";
  if (!/^[a-z0-9-]+$/.test(id)) {
    return ctx.json({ ok: false, error: "invalid id" }, 400);
  }

  const body = await ctx.req.text();
  let value: unknown;
  try {
    value = parseYaml(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return ctx.json({ ok: false, error: `YAML parse failed: ${msg}` }, 400);
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    return ctx.json({ ok: false, error: "validation failed", details }, 422);
  }

  const file = join(args.root, dir, `${id}.yaml`);
  writeFileSync(file, body.endsWith("\n") ? body : `${body}\n`);
  return ctx.json({ ok: true, path: relative(args.root, file) });
};

const app = new Hono();
app.use("*", cors({ origin: args.origin }));
app.post("/line/:id", (c) => save(c, "lines", LineSchema));
app.post("/port/:id", (c) => save(c, "ports", PortSchema));

serve(
  { fetch: app.fetch, hostname: args.host, port: Number(args.port) },
  (info) =>
    console.log(`server listening on http://${info.address}:${info.port}`),
);
