import { FastifyInstance } from "fastify";
import { z } from "zod";
import { monthRange, prisma, toNumber } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const lineSchema = z.object({
  categoryId: z.string().uuid(),
  planned: z.number(),
  notes: z.string().optional(),
});

const upsertSchema = z.object({
  lines: z.array(lineSchema),
});

export async function budgetRoutes(app: FastifyInstance) {
  app.get("/:month", async (request, reply) => {
    const { month } = request.params as { month: string };
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return reply.status(400).send({ error: "Month must be YYYY-MM" });
    }

    const lines = await prisma.budgetLine.findMany({
      where: { month },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });

    const { start, end } = monthRange(month);
    const expenses = await prisma.expenseEntry.groupBy({
      by: ["categoryId"],
      where: { date: { gte: start, lte: end } },
      _sum: { gross: true },
    });

    const actualMap = new Map(
      expenses.map((e) => [e.categoryId, toNumber(e._sum.gross)]),
    );

    return lines.map((line) => {
      const planned = toNumber(line.planned);
      const actual = actualMap.get(line.categoryId) ?? 0;
      return {
        id: line.id,
        categoryId: line.categoryId,
        category: line.category,
        month: line.month,
        planned,
        actual,
        difference: planned - actual,
        notes: line.notes,
      };
    });
  });

  app.put("/:month", { preHandler: validateBody(upsertSchema) }, async (request, reply) => {
    const { month } = request.params as { month: string };
    const { lines } = request.body as z.infer<typeof upsertSchema>;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return reply.status(400).send({ error: "Month must be YYYY-MM" });
    }

    await prisma.$transaction(
      lines.map((line) =>
        prisma.budgetLine.upsert({
          where: {
            categoryId_month: { categoryId: line.categoryId, month },
          },
          create: {
            categoryId: line.categoryId,
            month,
            planned: line.planned,
            notes: line.notes ?? "",
          },
          update: {
            planned: line.planned,
            notes: line.notes ?? "",
          },
        }),
      ),
    );

    const updated = await prisma.budgetLine.findMany({
      where: { month },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });
    const { start, end } = monthRange(month);
    const expenses = await prisma.expenseEntry.groupBy({
      by: ["categoryId"],
      where: { date: { gte: start, lte: end } },
      _sum: { gross: true },
    });
    const actualMap = new Map(
      expenses.map((e) => [e.categoryId, toNumber(e._sum.gross)]),
    );
    return updated.map((line) => {
      const planned = toNumber(line.planned);
      const actual = actualMap.get(line.categoryId) ?? 0;
      return {
        id: line.id,
        categoryId: line.categoryId,
        category: line.category,
        month: line.month,
        planned,
        actual,
        difference: planned - actual,
        notes: line.notes,
      };
    });
  });

  app.post("/:month/lines", { preHandler: validateBody(lineSchema) }, async (request, reply) => {
    const { month } = request.params as { month: string };
    const body = request.body as z.infer<typeof lineSchema>;

    const line = await prisma.budgetLine.upsert({
      where: {
        categoryId_month: { categoryId: body.categoryId, month },
      },
      create: {
        categoryId: body.categoryId,
        month,
        planned: body.planned,
        notes: body.notes ?? "",
      },
      update: {
        planned: body.planned,
        notes: body.notes ?? "",
      },
      include: { category: true },
    });

    const { start, end } = monthRange(month);
    const sum = await prisma.expenseEntry.aggregate({
      where: { categoryId: body.categoryId, date: { gte: start, lte: end } },
      _sum: { gross: true },
    });
    const planned = toNumber(line.planned);
    const actual = toNumber(sum._sum.gross);

    return reply.status(201).send({
      id: line.id,
      categoryId: line.categoryId,
      category: line.category,
      month: line.month,
      planned,
      actual,
      difference: planned - actual,
      notes: line.notes,
    });
  });

  app.delete("/:month/lines/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.budgetLine.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });
}
