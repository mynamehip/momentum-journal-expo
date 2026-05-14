// All color palettes for the app - single source of truth

export const lightColors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  background: '#f9fafb',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  inputBackground: '#f3f4f6',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const darkColors: typeof lightColors = {
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',
  background: '#111827',
  card: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#374151',
  inputBackground: '#374151',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const pinkColors: typeof lightColors = {
  primary: '#ec4899',
  primaryLight: '#f472b6',
  primaryDark: '#db2777',
  background: '#fff1f2',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#fecdd3',
  inputBackground: '#fce7f3',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const darkPinkColors: typeof lightColors = {
  primary: '#f472b6',
  primaryLight: '#fbcfe8',
  primaryDark: '#ec4899',
  background: '#500724',
  card: '#831843',
  text: '#fff1f2',
  textSecondary: '#fce7f3',
  border: '#9d174d',
  inputBackground: '#9d174d',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const aquaColors: typeof lightColors = {
  primary: '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark: '#0891b2',
  background: '#ecfeff',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#cffafe',
  inputBackground: '#e0f7fa',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const darkAquaColors: typeof lightColors = {
  primary: '#22d3ee',
  primaryLight: '#67e8f9',
  primaryDark: '#06b6d4',
  background: '#083344',
  card: '#164e63',
  text: '#ecfeff',
  textSecondary: '#a5f3fc',
  border: '#0e7490',
  inputBackground: '#0e7490',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const greenColors: typeof lightColors = {
  primary: '#10b981',
  primaryLight: '#34d399',
  primaryDark: '#059669',
  background: '#f0fdf4',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#dcfce7',
  inputBackground: '#ecfdf5',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export const darkGreenColors: typeof lightColors = {
  primary: '#34d399',
  primaryLight: '#6ee7b7',
  primaryDark: '#10b981',
  background: '#064e3b',
  card: '#065f46',
  text: '#f0fdf4',
  textSecondary: '#d1fae5',
  border: '#047857',
  inputBackground: '#047857',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
};

export type AppColors = typeof lightColors;

export const MOOD_COLORS: Record<number, string> = {
  1: '#5C6BC0', // rất buồn - indigo
  2: '#7986CB', // buồn - light indigo
  3: '#EF5350', // tức giận - red
  4: '#9E9E9E', // chán - grey
  5: '#66BB6A', // bình thường - green
  6: '#FF9800', // bất ngờ - orange
  7: '#AB47BC', // phấn khích - purple
  8: '#42A5F5', // vui - blue
  9: '#FFCA28', // rất vui - yellow
};
