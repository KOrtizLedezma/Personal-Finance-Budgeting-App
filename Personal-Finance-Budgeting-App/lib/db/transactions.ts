// lib/db/transactions.ts
import dayjs from "dayjs";
import { all, first, run } from "./index";

/** DB row shape (joined with category name for convenience) */
export type TxnRow = {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number; // cents (INTEGER)
  currency: string; // e.g., "USD"
  date: string; // YYYY-MM-DD
  payee?: string | null;
  note?: string | null;
  created_at: string; // ISO
  categoryName?: string; // from JOIN categories.name
};

export type NewTxn = {
  accountId: string;
  categoryId: string | null;
  amountCents: number; // store integer cents
  currency: string; // "USD"
  dateISO: string; // YYYY-MM-DD
  payee?: string;
  note?: string;
};

export type UpdateTxn = Partial<{
  accountId: string;
  categoryId: string | null;
  amountCents: number;
  currency: string;
  dateISO: string;
  payee: string | null;
  note: string | null;
}>;

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Add a transaction
 * Returns the generated id.
 */
export async function addTransaction(t: NewTxn): Promise<string> {
  const id = uid("txn");
  const created = new Date().toISOString();
  await run(
    `
    INSERT INTO transactions
      (id, account_id, category_id, amount, currency, date, payee, note, created_at)
    VALUES
      (?,?,?,?,?,?,?,?,?)
    `,
    [
      id,
      t.accountId,
      t.categoryId,
      t.amountCents,
      t.currency,
      t.dateISO,
      t.payee ?? null,
      t.note ?? null,
      created,
    ]
  );
  return id;
}

/**
 * Update a transaction (partial).
 * No-op if patch is empty.
 */
export async function updateTransaction(
  id: string,
  patch: UpdateTxn
): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (patch.accountId !== undefined) {
    fields.push("account_id = ?");
    params.push(patch.accountId);
  }
  if (patch.categoryId !== undefined) {
    fields.push("category_id = ?");
    params.push(patch.categoryId);
  }
  if (patch.amountCents !== undefined) {
    fields.push("amount = ?");
    params.push(patch.amountCents);
  }
  if (patch.currency !== undefined) {
    fields.push("currency = ?");
    params.push(patch.currency);
  }
  if (patch.dateISO !== undefined) {
    fields.push("date = ?");
    params.push(patch.dateISO);
  }
  if (patch.payee !== undefined) {
    fields.push("payee = ?");
    params.push(patch.payee);
  }
  if (patch.note !== undefined) {
    fields.push("note = ?");
    params.push(patch.note);
  }

  if (fields.length === 0) return;

  const sql = `UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`;
  params.push(id);
  await run(sql, params);
}

/**
 * Delete a transaction by id
 */
export async function deleteTransaction(id: string): Promise<void> {
  await run(`DELETE FROM transactions WHERE id = ?`, [id]);
}

/**
 * List transactions for a given month (YYYY-MM), newest first
 */
export async function listTransactionsByMonth(
  yyyyMm: string
): Promise<TxnRow[]> {
  const start = dayjs(yyyyMm + "-01")
    .startOf("month")
    .format("YYYY-MM-DD");
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

  return all<TxnRow>(
    `
    SELECT t.*, c.name AS categoryName
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC, t.created_at DESC
    `,
    [start, end]
  );
}

/**
 * Flexible list with filters (all optional).
 * - month: "YYYY-MM"
 * - categoryId, accountId: filter by id
 * - search: matches payee or note (LIKE %term%)
 */
export async function listTransactions(
  params: {
    month?: string;
    categoryId?: string | null;
    accountId?: string;
    search?: string;
  } = {}
): Promise<TxnRow[]> {
  const where: string[] = [];
  const args: any[] = [];

  if (params.month) {
    const s = dayjs(params.month + "-01")
      .startOf("month")
      .format("YYYY-MM-DD");
    const e = dayjs(s).endOf("month").format("YYYY-MM-DD");
    where.push("t.date BETWEEN ? AND ?");
    args.push(s, e);
  }
  if (params.categoryId !== undefined) {
    if (params.categoryId === null) {
      where.push("t.category_id IS NULL");
    } else {
      where.push("t.category_id = ?");
      args.push(params.categoryId);
    }
  }
  if (params.accountId) {
    where.push("t.account_id = ?");
    args.push(params.accountId);
  }
  if (params.search) {
    where.push("(t.payee LIKE ? OR t.note LIKE ?)");
    const q = `%${params.search}%`;
    args.push(q, q);
  }

  const sql = `
    SELECT t.*, c.name AS categoryName
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY t.date DESC, t.created_at DESC
  `;
  return all<TxnRow>(sql, args);
}

/**
 * Totals for a month (in cents)
 * - expenseCents: sum of expense category amounts (absolute values)
 * - incomeCents: sum of income category amounts
 * - netCents: income - expense
 */
export async function getMonthlyTotals(yyyyMm: string): Promise<{
  expenseCents: number;
  incomeCents: number;
  netCents: number;
}> {
  const start = dayjs(yyyyMm + "-01")
    .startOf("month")
    .format("YYYY-MM-DD");
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

  // Sum expenses
  const exp = await first<{ total: number }>(
    `
    SELECT COALESCE(SUM(t.amount), 0) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE c.type = 'expense' AND t.date BETWEEN ? AND ?
    `,
    [start, end]
  );

  // Sum income
  const inc = await first<{ total: number }>(
    `
    SELECT COALESCE(SUM(t.amount), 0) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE c.type = 'income' AND t.date BETWEEN ? AND ?
    `,
    [start, end]
  );

  const expenseCents = Math.abs(Number(exp?.total ?? 0));
  const incomeCents = Number(inc?.total ?? 0);
  return {
    expenseCents,
    incomeCents,
    netCents: incomeCents - expenseCents,
  };
}

/**
 * Spend by category for a month (expense categories only)
 */
export async function getSpendByCategory(
  yyyyMm: string
): Promise<{ categoryId: string; categoryName: string; totalCents: number }[]> {
  const start = dayjs(yyyyMm + "-01")
    .startOf("month")
    .format("YYYY-MM-DD");
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

  return all<{ categoryId: string; categoryName: string; totalCents: number }>(
    `
    SELECT
      c.id AS categoryId,
      c.name AS categoryName,
      COALESCE(SUM(t.amount), 0) AS totalCents
    FROM categories c
    LEFT JOIN transactions t
      ON t.category_id = c.id
     AND t.date BETWEEN ? AND ?
    WHERE c.type = 'expense'
    GROUP BY c.id, c.name
    ORDER BY totalCents DESC, c.name ASC
    `,
    [start, end]
  );
}

/**
 * Helper to get a single transaction (e.g., for edit screen)
 */
export async function getTransaction(id: string): Promise<TxnRow | undefined> {
  return first<TxnRow>(
    `
    SELECT t.*, c.name AS categoryName
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.id = ?
    `,
    [id]
  );
}
