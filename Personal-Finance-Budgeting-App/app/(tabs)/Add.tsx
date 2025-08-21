import Screen from "@/components/Screen";
import Field from "@/components/form/Field";
import DateField from "@/components/form/DateField";
import { parseAmountToCents } from "@/lib/utils/money";
import { isISODate } from "@/lib/utils/date";
import { addTransaction } from "@/lib/db/transactions";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { View } from "react-native";
import { Button, Text, Snackbar } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

const schema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine(
      (v) => /^\d+(\.\d{0,2})?$/.test(v.replace(/[, ]/g, "")),
      "Use format like 12.34"
    ),
  payee: z.string().trim().optional(),
  dateISO: z
    .string()
    .trim()
    .default(dayjs().format("YYYY-MM-DD"))
    .refine(isISODate, "Use YYYY-MM-DD"),
});

type FormValues = z.input<typeof schema>;

export default function NewTxn() {
  const [snack, setSnack] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      payee: "",
      dateISO: dayjs().format("YYYY-MM-DD"),
    },
    mode: "onTouched",
  });

  useFocusEffect(
    useCallback(() => {
      reset({
        amount: "",
        payee: "",
        dateISO: dayjs().format("YYYY-MM-DD"),
      });
    }, [])
  );

  const onSubmit = async (v: FormValues) => {
    try {
      const amountCents = parseAmountToCents(v.amount);
      await addTransaction({
        accountId: "acc_cash",
        categoryId: null,
        amountCents,
        currency: "USD",
        dateISO: v.dateISO ?? dayjs().format("YYYY-MM-DD"),
        payee: v.payee,
      });
      setSnack("Saved");
      router.back();
    } catch (e: any) {
      setSnack(e?.message || "Could not save");
    }
  };

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text variant="titleLarge">Add Transaction</Text>

        <Field<FormValues>
          control={control}
          name="amount"
          label="Amount (e.g. 12.34)"
          keyboardType="decimal-pad"
          inputMode="decimal"
          leftIcon="currency-usd"
        />

        <Field<FormValues>
          control={control}
          name="payee"
          label="Payee"
          leftIcon="account"
        />

        <DateField<FormValues> control={control} name="dateISO" />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Add new
        </Button>
      </View>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2000}
      >
        {snack}
      </Snackbar>
    </Screen>
  );
}
