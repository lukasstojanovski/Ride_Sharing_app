import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ScrollView,
  Modal,
  Keyboard,
  Animated,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { typography, spacing, radius, shadows, MAX_SEATS } from '@/constants/theme';
import { useTheme } from '@/lib/ThemeContext';
import type { AppColors } from '@/constants/colorPalettes';

function useAuthStyles() {
  const { colors } = useTheme();
  return useMemo(() => createAuthStyles(colors), [colors]);
}

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
  const { colors } = useTheme();
  const styles = useAuthStyles();
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

// ─── Seats Stepper (1 to MAX_SEATS) ───────────────────────────────────────────

interface SeatsStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export const SeatsStepper: React.FC<SeatsStepperProps> = ({ label, value, onChange, error }) => {
  const styles = useAuthStyles();
  const min = 1;
  const max = MAX_SEATS;
  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.seatsStepperRow, error ? styles.fieldError : null]}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={styles.seatsStepperBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.seatsStepperArrow, value <= min && styles.seatsStepperArrowDisabled]}>−</Text>
        </TouchableOpacity>
        <Text style={styles.seatsStepperValue}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={styles.seatsStepperBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.seatsStepperArrow, value >= max && styles.seatsStepperArrowDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ─── Seats Picker (1 to MAX_SEATS, wheel like date picker) ─────────────────────

const SEAT_OPTIONS = Array.from({ length: MAX_SEATS }, (_, i) => i + 1);

interface SeatsPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  leftElement?: React.ReactNode;
  error?: string;
  onOpenChange?: (open: boolean) => void;
}

export const SeatsPickerInput: React.FC<SeatsPickerInputProps> = ({
  value,
  onChange,
  leftElement,
  error,
  onOpenChange,
}) => {
  const styles = useAuthStyles();
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(1);
  const num = Math.min(MAX_SEATS, Math.max(1, parseInt(value, 10) || 1));

  const handleOpen = () => {
    setDraft(num);
    setShow((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  const close = () => {
    setShow(false);
    onOpenChange?.(false);
  };

  const handleDone = () => {
    if (Platform.OS === 'android') {
      onChange(String(draft));
    }
    close();
  };

  const handleIosValueChange = (v: number) => {
    onChange(String(v));
  };

  const picker = (
    <Picker
      selectedValue={Platform.OS === 'android' ? draft : num}
      onValueChange={(v) => {
        const n = Number(v);
        if (Platform.OS === 'android') setDraft(n);
        else handleIosValueChange(n);
      }}
      style={styles.seatsPicker}
      itemStyle={styles.seatsPickerItem}
    >
      {SEAT_OPTIONS.map((n) => (
        <Picker.Item key={n} label={String(n)} value={n} />
      ))}
    </Picker>
  );

  return (
    <View style={styles.inputWrapper}>
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[styles.inputRow, styles.datePickerTouchable, error ? styles.fieldError : null]}
      >
        {leftElement ? <View style={styles.inputLeft}>{leftElement}</View> : null}
        <Text style={[styles.input, styles.datePickerValue]}>{num}</Text>
        <Text style={styles.datePickerChevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {show && Platform.OS === 'ios' ? (
        <>
          {picker}
          <View style={styles.datePickerDoneRow}>
            <TouchableOpacity onPress={handleDone} style={styles.datePickerDoneBtn} activeOpacity={0.7}>
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
      {show && Platform.OS === 'android' ? (
        <Modal transparent animationType="fade" visible={show} onRequestClose={close}>
          <TouchableOpacity style={styles.seatsPickerModalOverlay} activeOpacity={1} onPress={close}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.seatsPickerModalCard}>
              {picker}
              <TouchableOpacity onPress={handleDone} style={styles.seatsPickerModalDone} activeOpacity={0.7}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
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
}) => {
  const { colors } = useTheme();
  const styles = useAuthStyles();
  return (
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
};

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;  // e.g. show/hide password button
}

export const Input: React.FC<InputProps> = ({ label, error, style, rightElement, ...props }) => {
  const { colors } = useTheme();
  const styles = useAuthStyles();
  return (
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
};

// ─── City Picker Input (searchable dropdown, value only from list) ─────────────

interface CityPickerInputProps {
  label?: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  error?: string;
}

export const CityPickerInput: React.FC<CityPickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select city',
  error,
}) => {
  const { colors } = useTheme();
  const styles = useAuthStyles();
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase
        .from('cities')
        .select('id, city')
        .order('city');
      if (!e && data && Array.isArray(data)) {
        setCities(data.map((r) => (r.city as string) ?? '').filter(Boolean));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, inputValue]);

  const openDropdown = () => setShowDropdown(true);
  const closeDropdown = () => setShowDropdown(false);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    setShowDropdown(true);
    if (value) onChange('');
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    closeDropdown();
    Keyboard.dismiss();
  };

  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={loading ? undefined : openDropdown}
        activeOpacity={0.7}
        style={[styles.inputRow, styles.cityPickerTouchable, error ? styles.fieldError : null]}
      >
        <Text
          style={[
            styles.input,
            inputValue ? styles.datePickerValue : styles.datePickerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {loading ? 'Loading...' : (inputValue || placeholder)}
        </Text>
        {loading ? (
          <View style={styles.cityPickerLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Text style={styles.datePickerChevron}>▾</Text>
        )}
      </TouchableOpacity>
      {showDropdown && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closeDropdown}
        >
          <View style={styles.cityModalOverlay}>
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
              activeOpacity={1}
              onPress={closeDropdown}
            />
            <View style={styles.cityModalContent} pointerEvents="box-none">
              <View style={styles.cityDropdown} pointerEvents="auto">
                <TextInput
                  value={inputValue}
                  onChangeText={handleChangeText}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.cityModalSearch}
                  autoCapitalize="words"
                  autoFocus
                  editable={!loading}
                />
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.cityDropdownScroll}
                  nestedScrollEnabled
                >
                  {filtered.length === 0 ? (
                    <Text style={styles.cityDropdownEmpty}>
                      {loading ? 'Loading...' : 'No matching cities'}
                    </Text>
                  ) : (
                    filtered.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.cityDropdownItem}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cityDropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ─── Date Picker Input ────────────────────────────────────────────────────────

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
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
  onOpenChange?: (open: boolean) => void;
  showTodayLabel?: boolean;
  leftElement?: React.ReactNode;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minimumDate = new Date(),
  onOpenChange,
  showTodayLabel = false,
  leftElement,
}) => {
  const { colors, resolvedScheme } = useTheme();
  const styles = useAuthStyles();
  const [show, setShow] = useState(false);
  const todayYMD = toYMD(new Date());
  const isTodaySelected = value === todayYMD;
  const displayText = value
    ? (showTodayLabel && isTodaySelected ? 'Today' : formatDateForDisplay(value))
    : (showTodayLabel ? '' : placeholder);
  const dateValue = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00')
    : new Date();

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      onOpenChange?.(false);
    }
    if (selectedDate) {
      onChange(toYMD(selectedDate));
    }
  };

  const handleOpen = () => {
    setShow((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  const handleDone = () => {
    setShow(false);
    onOpenChange?.(false);
  };

  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[styles.inputRow, styles.datePickerTouchable, error ? styles.fieldError : null]}
      >
        {leftElement ? <View style={styles.inputLeft}>{leftElement}</View> : null}
        <Text style={[styles.input, value ? styles.datePickerValue : styles.datePickerPlaceholder]}>
          {displayText}
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
          themeVariant={resolvedScheme}
          {...(Platform.OS === 'ios' && { textColor: colors.text })}
          {...(Platform.OS === 'android' && { accentColor: colors.primary })}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <View style={styles.datePickerDoneRow}>
          <TouchableOpacity onPress={handleDone} style={styles.datePickerDoneBtn} activeOpacity={0.7}>
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
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

const TIME_MINUTE_INTERVAL = 10;

function roundMinutesToInterval(date: Date, interval: number): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const rounded = Math.round(minutes / interval) * interval;
  if (rounded === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(rounded);
  }
  d.setSeconds(0, 0);
  return d;
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
  const { colors, resolvedScheme } = useTheme();
  const styles = useAuthStyles();
  const [show, setShow] = useState(false);
  const handleOpen = () => setShow((prev) => !prev);
  const rawTimeValue = value && /^\d{1,2}:\d{2}$/.test(value)
    ? (() => {
        const [h, m] = value.split(':').map(Number);
        return new Date(2000, 0, 1, h, m);
      })()
    : new Date();
  const timeValue = roundMinutesToInterval(rawTimeValue, TIME_MINUTE_INTERVAL);

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const rounded = roundMinutesToInterval(selectedDate, TIME_MINUTE_INTERVAL);
      onChange(toHHMM(rounded));
    }
  };

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
          minuteInterval={TIME_MINUTE_INTERVAL}
          onChange={handleChange}
          is24Hour
          themeVariant={resolvedScheme}
          {...(Platform.OS === 'ios' && { textColor: colors.text })}
          {...(Platform.OS === 'android' && { accentColor: colors.primary })}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity onPress={() => setShow(false)} style={styles.datePickerDoneBtn}>
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
  const styles = useAuthStyles();
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

export const OrDivider: React.FC<{ label: string }> = ({ label }) => {
  const styles = useAuthStyles();
  return (
  <View style={styles.orRow}>
    <View style={styles.orLine} />
    <Text style={styles.orText}>{label}</Text>
    <View style={styles.orLine} />
  </View>
  );
};

// ─── Language Toggle ──────────────────────────────────────────────────────────

const LANG_TRACK_WIDTH = 72;
const LANG_THUMB_OFFSET = 4;
const LANG_THUMB_WIDTH = (LANG_TRACK_WIDTH - LANG_THUMB_OFFSET * 2) / 2;
const LANG_THUMB_SLIDE = LANG_THUMB_WIDTH;

export const LangToggle: React.FC<{ language: 'en' | 'mk'; onToggle: () => void }> = ({ language, onToggle }) => {
  const styles = useAuthStyles();
  const slideAnim = useRef(new Animated.Value(language === 'mk' ? 0 : LANG_THUMB_SLIDE)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: language === 'mk' ? 0 : LANG_THUMB_SLIDE,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [language, slideAnim]);

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85} style={styles.langToggleTrack}>
      <Animated.View
        style={[
          styles.langToggleThumb,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      />
      <View style={styles.langToggleLabels} pointerEvents="none">
        <View style={[styles.langToggleSlot, styles.langToggleSlotFirst]}>
          <Text style={[styles.langToggleLabel, language === 'mk' && styles.langToggleLabelActive]}>MK</Text>
        </View>
        <View style={[styles.langToggleSlot, styles.langToggleSlotLast]}>
          <Text style={[styles.langToggleLabel, language === 'en' && styles.langToggleLabelActive]}>EN</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Back Button ──────────────────────────────────────────────────────────────

export const BackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const styles = useAuthStyles();
  return (
  <TouchableOpacity
    onPress={onPress}
    style={styles.backBtn}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function createAuthStyles(colors: AppColors) {
  return StyleSheet.create({
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
  datePickerDoneRow: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  datePickerDoneBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  datePickerDoneText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.primary },
  inputLeft: { marginRight: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  inputRight: { marginLeft: spacing.xs },
  fieldError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, marginTop: 4 },

  seatsStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 54,
    paddingHorizontal: spacing.sm,
  },
  seatsStepperBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatsStepperArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  seatsStepperArrowDisabled: {
    color: colors.textMuted,
  },
  seatsStepperValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },

  seatsPicker: {
    marginTop: spacing.xs,
    width: '100%',
    ...(Platform.OS === 'ios' ? { height: 180 } : { height: 200 }),
  },
  seatsPickerItem: {
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  seatsPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  seatsPickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.lg,
  },
  seatsPickerModalDone: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  cityPickerLoader: { marginLeft: spacing.sm, justifyContent: 'center' },
  cityPickerTouchable: { justifyContent: 'space-between' },
  cityModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  cityModalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cityModalSearch: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  cityDropdown: {
    maxHeight: 280,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    overflow: 'hidden',
    ...Platform.select({ ios: shadows.lg, android: { elevation: 8 } }),
  },
  cityDropdownScroll: { maxHeight: 280 },
  cityDropdownEmpty: {
    padding: spacing.xl,
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cityDropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cityDropdownItemText: { fontSize: typography.sizes.base, color: colors.text },

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

  langToggleTrack: {
    width: LANG_TRACK_WIDTH,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: LANG_THUMB_OFFSET,
  },
  langToggleThumb: {
    position: 'absolute',
    left: LANG_THUMB_OFFSET,
    top: 4,
    width: LANG_THUMB_WIDTH,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  langToggleLabels: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: LANG_THUMB_OFFSET,
  },
  langToggleSlot: {
    width: LANG_THUMB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleSlotFirst: {
    paddingRight: 6,
  },
  langToggleSlotLast: {
    paddingRight: 9,
  },
  langToggleLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  langToggleLabelActive: {
    color: colors.textInverse,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backArrow: { fontSize: 20, color: colors.text },
  });
}
