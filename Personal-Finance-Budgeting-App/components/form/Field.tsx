import { Controller, Control, FieldValues, FieldPath } from "react-hook-form";
import { TextInput, HelperText } from "react-native-paper";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  keyboardType?:
    | "default"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad";
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "email"
    | "tel"
    | "search"
    | "url";
  leftIcon?: string;
  rightIcon?: string;
  secureTextEntry?: boolean;
};

export default function Field<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  keyboardType,
  inputMode,
  leftIcon,
  rightIcon,
  secureTextEntry,
}: Props<TFieldValues>) {
  return (
    <Controller<TFieldValues>
      control={control}
      name={name}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error },
      }) => (
        <>
          <TextInput
            label={label}
            value={(value as any) ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType={keyboardType}
            inputMode={inputMode}
            secureTextEntry={secureTextEntry}
            left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
            right={rightIcon ? <TextInput.Icon icon={rightIcon} /> : undefined}
          />
          <HelperText type="error" visible={!!error}>
            {error?.message}
          </HelperText>
        </>
      )}
    />
  );
}
