import { create } from "zustand";
import dayjs from "dayjs";

type UIState = {
  month: string; // "YYYY-MM"
  setMonth: (m: string) => void;
};

export const useUI = create<UIState>((set) => ({
  month: dayjs().format("YYYY-MM"),
  setMonth: (m) => set({ month: m }),
}));
