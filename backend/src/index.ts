import Fastify from "fastify";
import cors from "@fastify/cors";
import { categoryRoutes } from "./routes/categories.js";
import { incomeRoutes } from "./routes/income.js";
import { expenseRoutes } from "./routes/expenses.js";
import { budgetRoutes } from "./routes/budget.js";
import { taxRoutes } from "./routes/taxes.js";
import { recurringRoutes } from "./routes/recurring.js";
import { savingsGoalRoutes } from "./routes/savings-goals.js";
import { dashboardRoutes } from "./routes/dashboard.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/api/health", async () => ({ status: "ok" }));

await app.register(categoryRoutes, { prefix: "/api/categories" });
await app.register(incomeRoutes, { prefix: "/api/income" });
await app.register(expenseRoutes, { prefix: "/api/expenses" });
await app.register(budgetRoutes, { prefix: "/api/budget" });
await app.register(taxRoutes, { prefix: "/api/taxes" });
await app.register(recurringRoutes, { prefix: "/api/recurring" });
await app.register(savingsGoalRoutes, { prefix: "/api/savings-goals" });
await app.register(dashboardRoutes, { prefix: "/api/dashboard" });

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
