import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, shadow } from '../theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  compact?: boolean;
  icon?: string;
};

export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  variant = 'primary',
  compact = false,
  icon,
}: ButtonProps) {
  const textVariant = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    quiet: styles.quietText,
    danger: styles.dangerText,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        compact && styles.compact,
        pressed && !disabled && !busy && styles.pressed,
        (disabled || busy) && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.surface : colors.green} />
      ) : (
        <Text style={[styles.buttonText, textVariant]}>
          {icon ? `${icon}  ` : ''}{label}
        </Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#9AA49F"
        selectionColor={colors.green}
        style={[styles.field, style]}
        {...props}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}><Text style={styles.emptyEmoji}>{icon}</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function PageHeading({ eyebrow, title, detail, trailing }: {
  eyebrow?: string;
  title: string;
  detail?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {detail ? <Text style={styles.pageDetail}>{detail}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 17,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: colors.green, ...shadow },
  secondary: { backgroundColor: colors.greenLight },
  quiet: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.red },
  compact: { minHeight: 42, borderRadius: 14, paddingHorizontal: 15, ...shadow },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  buttonText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  primaryText: { color: colors.surface },
  secondaryText: { color: colors.greenDark },
  quietText: { color: colors.ink },
  dangerText: { color: colors.surface },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  field: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 15,
  },
  fieldHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 27 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  emptyAction: { marginTop: 18, width: '100%' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1 },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 6 },
  pageTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
  pageDetail: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
});
