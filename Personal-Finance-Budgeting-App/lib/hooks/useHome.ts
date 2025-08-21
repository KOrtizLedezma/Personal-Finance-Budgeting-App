import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import { runMigrations } from "../db";
import { listTransactionsByMonth } from "../db/transactions";

export type TxnRow = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  payee?: string;
  categoryName?: string;
};

export function useHome(month: string) {
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await listTransactionsByMonth(month);
    setTxns(rows as any);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    (async () => {
      await runMigrations();
      await refresh();
    })();
  }, [refresh]);

  const monthLabel = dayjs(`${month}-01`).format("MMMM YYYY");
  const totalCents = txns.reduce((sum, t) => sum + (t.amount || 0), 0);

  return { txns, loading, refresh, monthLabel, totalCents };
}
