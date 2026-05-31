import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StatusBar, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppColors,
  darkColors,
  lightColors,
} from "@/constants/colorPalettes";

const STORAGE_KEY = "@ajdego/theme-mode";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedScheme = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedScheme: ResolvedScheme;
  colors: AppColors;
  setThemeMode: (mode: ThemeMode) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isThemeMode(stored)) {
          setThemeModeState(stored);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const resolvedScheme: ResolvedScheme = useMemo(() => {
    if (themeMode === "light") return "light";
    if (themeMode === "dark") return "dark";
    return systemScheme === "dark" ? "dark" : "light";
  }, [themeMode, systemScheme]);

  const colors = resolvedScheme === "dark" ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedScheme,
      colors,
      setThemeMode,
      ready,
    }),
    [themeMode, resolvedScheme, colors, setThemeMode, ready]
  );

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={resolvedScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
