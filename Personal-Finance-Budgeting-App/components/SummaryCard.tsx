import { Card, Text } from "react-native-paper";

type Props = {
  totalLabel: string;
  totalValue: string;
  count: number;
};
export default function SummaryCard({ totalLabel, totalValue, count }: Props) {
  return (
    <Card>
      <Card.Content>
        <Text>
          {totalLabel}: {totalValue}
        </Text>
        <Text>Transactions: {count}</Text>
      </Card.Content>
    </Card>
  );
}
