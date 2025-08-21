import { Card, Text } from "react-native-paper";
import { View } from "react-native";

type Props = {
  payee?: string;
  categoryName?: string;
  amountText: string;
  currency: string;
  date: string;
};
export default function TxnItem({
  payee,
  categoryName,
  amountText,
  currency,
  date,
}: Props) {
  return (
    <Card style={{ marginVertical: 8 }}>
      <Card.Content>
        <Text>{payee || "(no payee)"}</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Text>{categoryName || "Uncategorized"}</Text>
          <Text>
            — {amountText} {currency}
          </Text>
        </View>
        <Text>{date}</Text>
      </Card.Content>
    </Card>
  );
}
