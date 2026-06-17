import { FastifyInstance } from "fastify";
import { z } from "zod";
import { monthRange, parseDate, prisma, toNumber } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const entrySchema = z.object({
  date: z.string(),
  source: z.string().optional(),
  categoryId: z.string().uuid(),
  gross: z.number(),
  tax: z.number().optional(),
  notes: z.string().optional(),
});

function serializeIncome(entry: {
  id: string;
  date: Date;
  source: string;
  categoryId: string;
  gross: { toNumber(): number };
  tax: { toNumber(): number };
  notes: string;
  createdAt: Date;
  category?: { id: string; name: string; kind: string; priority: string | null };
}) {
  const gross = toNumber(entry.gross);
  const tax = toNumber(entry.tax);
  return {
    ...entry,
    gross,
    tax,
    net: gross - tax,
    date: entry.date.toISOString().slice(0, 10),
  };
}

export async function incomeRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const { month, categoryId, source } = request.query as {
      month?: string;
      categoryId?: string;
      source?: string;
    };

    const where: Record<string, unknown> = {};
    if (month) {
      const { start, end } = monthRange(month);
      where.date = { gte: start, lte: end };
    }
    if (categoryId) where.categoryId = categoryId;
    if (source) where.source = { contains: source, mode: "insensitive" };

    const entries = await prisma.incomeEntry.findMany({
      where,
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return entries.map(serializeIncome);
  });

  app.post("/", { preHandler: validateBody(entrySchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof entrySchema>;
    const entry = await prisma.incomeEntry.create({
      data: {
        date: parseDate(body.date),
        source: body.source ?? "",
        categoryId: body.categoryId,
        gross: body.gross,
        tax: body.tax ?? 0,
        notes: body.notes ?? "",
      },
      include: { category: true },
    });
    return reply.status(201).send(serializeIncome(entry));
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.incomeEntry.findUnique({ where: { id }, include: { category: true } });
    if (!entry) return reply.status(404).send({ error: "Not found" });
    return serializeIncome(entry);
  });

  app.patch("/:id", { preHandler: validateBody(entrySchema.partial()) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof entrySchema>>;
    try {
      const entry = await prisma.incomeEntry.update({
        where: { id },
        data: {
          ...body,
          date: body.date ? parseDate(body.date) : undefined,
        },
        include: { category: true },
      });
      return serializeIncome(entry);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.incomeEntry.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });
}
