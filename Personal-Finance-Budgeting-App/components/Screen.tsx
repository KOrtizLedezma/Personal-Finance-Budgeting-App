import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

export default function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }} edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}
