import dayjs from "dayjs";
import { View } from "react-native";
import { Button } from "react-native-paper";

type Props = {
  month: string;
  setMonth: (m: string) => void;
  rightExtra?: React.ReactNode;
};
export default function MonthSwitcher({ month, setMonth, rightExtra }: Props) {
  const prev = dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM");
  const next = dayjs(`${month}-01`).add(1, "month").format("YYYY-MM");
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Button
        mode="outlined"
        onPress={() => setMonth(prev)}
        style={{ marginRight: 8 }}
      >
        Prev
      </Button>
      <Button
        mode="outlined"
        onPress={() => setMonth(next)}
        style={{ marginRight: 8 }}
      >
        Next
      </Button>
      <View style={{ flex: 1 }} />
      {rightExtra}
    </View>
  );
}
