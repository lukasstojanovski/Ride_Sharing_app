import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, radius, shadows } from '@/constants/theme';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'social';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, loading = false, disabled = false, variant = 'primary', icon, style,
}) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        isPrimary && styles.btnPrimary,
        variant === 'outline' && styles.btnOutline,
        variant === 'social' && styles.btnSocial,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.primary} />
      ) : (
        <>
          {icon && <View style={styles.btnIcon}>{icon}</View>}
          <Text style={[styles.btnLabel, isPrimary ? styles.btnLabelPrimary : styles.btnLabelDark]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Phone Input (Macedonian only — kept for phone sign-in flow) ──────────────

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
  placeholder?: string;
  autoFocus?: boolean;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value, onChangeText, countryCode = '+389', placeholder = '07X XXX XXX', autoFocus = false, error,
}) => (
  <View>
    <View style={[styles.phoneContainer, error ? styles.fieldError : null]}>
      <View style={styles.countryCode}>
        <Text style={styles.flag}>🇲🇰</Text>
        <Text style={styles.countryCodeText}>{countryCode}</Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        autoFocus={autoFocus}
        style={styles.phoneInput}
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;  // e.g. show/hide password button
}

export const Input: React.FC<InputProps> = ({ label, error, style, rightElement, ...props }) => (
  <View style={styles.inputWrapper}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={[styles.inputRow, error ? styles.fieldError : null]}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style as any]}
        {...props}
      />
      {rightElement && <View style={styles.inputRight}>{rightElement}</View>}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ─── Date Picker Input ────────────────────────────────────────────────────────

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DatePickerInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minimumDate = new Date(),
}) => {
  const [show, setShow] = useState(false);
  const dateValue = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00')
    : new Date();

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      onChange(toYMD(selectedDate));
    }
  };

  const handleOpen = () => setShow(true);

  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[styles.inputRow, styles.datePickerTouchable, error ? styles.fieldError : null]}
      >
        <Text style={[styles.input, value ? styles.datePickerValue : styles.datePickerPlaceholder]}>
          {value ? formatDateForDisplay(value) : placeholder}
        </Text>
        <Text style={styles.datePickerChevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          themeVariant="light"
          {...(Platform.OS === 'ios' && { textColor: colors.text })}
          {...(Platform.OS === 'android' && { accentColor: colors.primary })}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity onPress={() => setShow(false)} style={styles.datePickerDone}>
          <Text style={styles.datePickerDoneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Time Picker Input ────────────────────────────────────────────────────────

function formatTimeForDisplay(timeStr: string): string {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function toHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

interface TimePickerInputProps {
  label?: string;
  value: string; // HH:mm
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select time',
  error,
}) => {
  const [show, setShow] = useState(false);
  const timeValue = value && /^\d{1,2}:\d{2}$/.test(value)
    ? (() => {
        const [h, m] = value.split(':').map(Number);
        return new Date(2000, 0, 1, h, m);
      })()
    : new Date();

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      onChange(toHHMM(selectedDate));
    }
  };

  const handleOpen = () => setShow(true);

  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[styles.inputRow, styles.datePickerTouchable, error ? styles.fieldError : null]}
      >
        <Text style={[styles.input, value ? styles.datePickerValue : styles.datePickerPlaceholder]}>
          {value ? formatTimeForDisplay(value) : placeholder}
        </Text>
        <Text style={styles.datePickerChevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {show && (
        <DateTimePicker
          value={timeValue}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          is24Hour
          themeVariant="light"
          {...(Platform.OS === 'ios' && { textColor: colors.text })}
          {...(Platform.OS === 'android' && { accentColor: colors.primary })}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity onPress={() => setShow(false)} style={styles.datePickerDone}>
          <Text style={styles.datePickerDoneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── OTP Input ────────────────────────────────────────────────────────────────

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6, error = false }) => {
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);
  return (
    <View style={styles.otpRow}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={[
            styles.otpCell,
            d ? styles.otpCellFilled : null,
            error ? styles.otpCellError : null,
            i === value.length && styles.otpCellActive,
          ]}
        >
          <Text style={styles.otpDigit}>{d}</Text>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={v => onChange(v.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.otpHiddenInput}
        autoFocus
      />
    </View>
  );
};

// ─── Or Divider ───────────────────────────────────────────────────────────────

export const OrDivider: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.orRow}>
    <View style={styles.orLine} />
    <Text style={styles.orText}>{label}</Text>
    <View style={styles.orLine} />
  </View>
);

// ─── Language Toggle ──────────────────────────────────────────────────────────

export const LangToggle: React.FC<{ language: 'en' | 'mk'; onToggle: () => void }> = ({ language, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={styles.langToggle} activeOpacity={0.7}>
    <Text style={styles.langToggleText}>{language === 'mk' ? 'EN' : 'МК'}</Text>
  </TouchableOpacity>
);

// ─── Back Button ──────────────────────────────────────────────────────────────

export const BackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.backBtn}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
  },
  btnPrimary: { backgroundColor: colors.primary, ...shadows.lg },
  btnOutline: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  btnSocial: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, ...shadows.sm },
  btnDisabled: { opacity: 0.5 },
  btnIcon: { marginRight: spacing.sm },
  btnLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  btnLabelPrimary: { color: colors.textInverse },
  btnLabelDark: { color: colors.text },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 54,
    paddingHorizontal: spacing.base,
  },
  countryCode: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingRight: spacing.md },
  flag: { fontSize: 20 },
  countryCodeText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.text },
  divider: { width: 1, height: 24, backgroundColor: colors.border, marginRight: spacing.md },
  phoneInput: { flex: 1, fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },

  inputWrapper: { gap: spacing.xs },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 54,
    paddingHorizontal: spacing.base,
  },
  input: { flex: 1, fontSize: typography.sizes.base, color: colors.text },
  datePickerValue: { flex: 1, fontSize: typography.sizes.base, color: colors.text, fontWeight: typography.weights.medium },
  datePickerPlaceholder: { flex: 1, fontSize: typography.sizes.base, color: colors.textSecondary },
  datePickerTouchable: { justifyContent: 'space-between' },
  datePickerChevron: { fontSize: 16, color: colors.textMuted, marginLeft: spacing.sm },
  datePickerDone: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  datePickerDoneText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.primary },
  inputRight: { marginLeft: spacing.xs },
  fieldError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, marginTop: 4 },

  otpRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', position: 'relative' },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  otpCellActive: { borderColor: colors.primary, borderWidth: 2 },
  otpCellError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  otpDigit: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  otpHiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: typography.sizes.sm, color: colors.textMuted, fontWeight: typography.weights.medium },

  langToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  langToggleText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text, letterSpacing: 0.5 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: colors.text },
});
