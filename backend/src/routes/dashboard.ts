import { FastifyInstance } from "fastify";
import { monthRange, prisma, toNumber } from "../lib/prisma.js";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/monthly", async (request) => {
    const { year } = request.query as { year?: string };
    const y = year ? Number(year) : new Date().getFullYear();

    const months = MONTH_LABELS.map((label, index) => {
      const month = `${y}-${String(index + 1).padStart(2, "0")}`;
      return { label, month, start: monthRange(month).start, end: monthRange(month).end };
    });

    const results = await Promise.all(
      months.map(async ({ label, month, start, end }) => {
        const [income, expense] = await Promise.all([
          prisma.incomeEntry.findMany({ where: { date: { gte: start, lte: end } } }),
          prisma.expenseEntry.findMany({ where: { date: { gte: start, lte: end } } }),
        ]);

        const incomeTotal = income.reduce((sum, e) => sum + (toNumber(e.gross) - toNumber(e.tax)), 0);
        const expenseTotal = expense.reduce((sum, e) => sum + toNumber(e.gross), 0);

        return {
          label,
          month,
          income: incomeTotal,
          expenses: expenseTotal,
          net: incomeTotal - expenseTotal,
        };
      }),
    );

    return { year: y, months: results };
  });

  app.get("/category-spend", async (request) => {
    const { year } = request.query as { year?: string };
    const y = year ? Number(year) : new Date().getFullYear();
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31));

    const expenses = await prisma.expenseEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true },
    });

    const map = new Map<string, { category: string; total: number }>();
    for (const e of expenses) {
      const key = e.categoryId;
      const existing = map.get(key) ?? { category: e.category.name, total: 0 };
      existing.total += toNumber(e.gross);
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  });

  app.get("/upcoming-recurring", async (request) => {
    const { days } = request.query as { days?: string };
    const dayCount = days ? Number(days) : 7;
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + dayCount);

    const entries = await prisma.recurringEntry.findMany({
      where: {
        active: true,
        nextDueDate: { lte: end },
      },
      include: { category: true },
      orderBy: { nextDueDate: "asc" },
    });

    return entries.map((e) => ({
      id: e.id,
      kind: e.kind,
      source: e.source,
      category: e.category,
      gross: toNumber(e.gross),
      tax: toNumber(e.tax),
      frequency: e.frequency,
      nextDueDate: e.nextDueDate.toISOString().slice(0, 10),
    }));
  });

  app.get("/savings-summary", async () => {
    const goals = await prisma.savingsGoal.findMany({ orderBy: { createdAt: "asc" } });
    return goals.map((g) => {
      const targetAmount = toNumber(g.targetAmount);
      const currentAmount = toNumber(g.currentAmount);
      return {
        id: g.id,
        name: g.name,
        targetAmount,
        currentAmount,
        progress: targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0,
        targetDate: g.targetDate ? g.targetDate.toISOString().slice(0, 10) : null,
      };
    });
  });
}
