import Screen from "@/components/Screen";
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { Link } from "expo-router";
import { useUI } from "@/store/ui";
import { useHome } from "@/lib/hooks/useHome";
import MonthSwitcher from "@/components/MonthSwitcher";
import SummaryCard from "@/components/SummaryCard";
import TxnList from "@/components/TxnList";
import { formatCents } from "@/lib/utils/money";

export default function Home() {
  const { month, setMonth } = useUI();
  const { txns, loading, refresh, monthLabel, totalCents } = useHome(month);

  return (
    <Screen>
      <View style={{ gap: 12, flex: 1 }}>
        <Text variant="titleLarge">{monthLabel}</Text>

        <MonthSwitcher
          month={month}
          setMonth={setMonth}
          rightExtra={
            <Link href="/(tabs)/Add" asChild>
              <Button mode="contained">Add new</Button>
            </Link>
          }
        />

        <SummaryCard
          totalLabel="Total"
          totalValue={formatCents(totalCents)}
          count={txns.length}
        />

        <Text variant="titleMedium" style={{ marginTop: 8 }}>
          Recent
        </Text>
        <TxnList data={txns} loading={loading} onRefresh={refresh} />
      </View>
    </Screen>
  );
}
