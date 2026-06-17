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
  net: z.number().optional().nullable(),
  notes: z.string().optional(),
});

function serializeExpense(entry: {
  id: string;
  date: Date;
  source: string;
  categoryId: string;
  gross: { toNumber(): number };
  tax: { toNumber(): number };
  net: { toNumber(): number } | null;
  notes: string;
  createdAt: Date;
  category?: { id: string; name: string; kind: string; priority: string | null };
}) {
  return {
    ...entry,
    gross: toNumber(entry.gross),
    tax: toNumber(entry.tax),
    net: entry.net != null ? toNumber(entry.net) : null,
    date: entry.date.toISOString().slice(0, 10),
  };
}

export async function expenseRoutes(app: FastifyInstance) {
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

    const entries = await prisma.expenseEntry.findMany({
      where,
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return entries.map(serializeExpense);
  });

  app.post("/", { preHandler: validateBody(entrySchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof entrySchema>;
    const entry = await prisma.expenseEntry.create({
      data: {
        date: parseDate(body.date),
        source: body.source ?? "",
        categoryId: body.categoryId,
        gross: body.gross,
        tax: body.tax ?? 0,
        net: body.net ?? null,
        notes: body.notes ?? "",
      },
      include: { category: true },
    });
    return reply.status(201).send(serializeExpense(entry));
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.expenseEntry.findUnique({ where: { id }, include: { category: true } });
    if (!entry) return reply.status(404).send({ error: "Not found" });
    return serializeExpense(entry);
  });

  app.patch("/:id", { preHandler: validateBody(entrySchema.partial()) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof entrySchema>>;
    try {
      const entry = await prisma.expenseEntry.update({
        where: { id },
        data: {
          ...body,
          date: body.date ? parseDate(body.date) : undefined,
        },
        include: { category: true },
      });
      return serializeExpense(entry);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.expenseEntry.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });
}
