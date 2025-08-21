import { FlatList } from "react-native";
import { Text } from "react-native-paper";
import TxnItem from "./TxnItem";
import { formatCents } from "@/lib/utils/money";

type Row = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  payee?: string;
  categoryName?: string;
};
type Props = {
  data: Row[];
  loading: boolean;
  onRefresh: () => void;
};
export default function TxnList({ data, loading, onRefresh }: Props) {
  if (!loading && data.length === 0) {
    return <Text>No transactions yet.</Text>;
  }
  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={onRefresh}
      data={data}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <TxnItem
          payee={item.payee}
          categoryName={item.categoryName}
          amountText={formatCents(item.amount, item.currency)}
          currency={item.currency}
          date={item.date}
        />
      )}
    />
  );
}
