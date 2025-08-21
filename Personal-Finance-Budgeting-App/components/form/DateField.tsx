import { Control, FieldValues, FieldPath } from "react-hook-form";
import Field from "./Field";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
};

export default function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label = "Date (YYYY-MM-DD)",
}: Props<TFieldValues>) {
  return (
    <Field<TFieldValues>
      control={control}
      name={name}
      label={label}
      keyboardType="numeric"
      inputMode="numeric"
      leftIcon="calendar"
    />
  );
}
