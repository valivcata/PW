import { createTheme } from '@mui/material';

/** Design tokens for the dark "night out" look (navy-charcoal surfaces, pink→peach accent). */
export const tokens = {
  bg: '#1b1c29',
  surface: '#222434',
  surfaceRaised: '#2a2c3e',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.28)',
  text: '#f4f2f7',
  textMuted: '#a6a4b6',
  pink: '#e7a6f2',
  peach: '#f6d6a3',
  /** Pill buttons, active chips, highlights. */
  accentGradient: 'linear-gradient(90deg, #e7a6f2 0%, #f6d6a3 100%)',
  onAccent: '#1b1c29',
  displayFont: '"Michroma", "Poppins", system-ui, sans-serif',
  bodyFont: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

/** Wide, uppercase display type used for headings. */
export const display = {
  fontFamily: tokens.displayFont,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  fontWeight: 400,
  lineHeight: 1.15,
} as const;

/**
 * Break out of the centred page container to span the full viewport width.
 * (html/body use `overflow-x: clip`, so the scrollbar's width never causes horizontal scrolling.)
 */
export const fullBleed = {
  width: '100vw',
  ml: 'calc(50% - 50vw)',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: tokens.pink, contrastText: tokens.onAccent },
    secondary: { main: tokens.peach, contrastText: tokens.onAccent },
    success: { main: '#9be7c4', contrastText: tokens.onAccent },
    error: { main: '#ff8a9a' },
    warning: { main: tokens.peach },
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.textMuted },
    divider: tokens.border,
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: tokens.bodyFont,
    h1: display,
    h2: display,
    h3: display,
    h4: display,
    h5: { ...display, fontSize: '1.15rem' },
    h6: { ...display, fontSize: '0.95rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    overline: { fontFamily: tokens.displayFont, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg },
        '::selection': { background: tokens.pink, color: tokens.onAccent },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { backgroundColor: tokens.surface, borderColor: tokens.border } },
    },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'transparent' } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
          // Subtle "float" on hover: lift up with a soft shadow, settle back when pressed.
          transition: 'transform .2s ease, box-shadow .2s ease, background-color .2s, border-color .2s, filter .2s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)' },
          '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)' },
          '&.Mui-disabled': { transform: 'none', boxShadow: 'none' },
          '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: tokens.accentGradient,
            color: tokens.onAccent,
            '&:hover': {
              background: tokens.accentGradient,
              filter: 'brightness(1.06)',
              boxShadow: '0 10px 24px rgba(231, 166, 242, 0.35)',
            },
            '&.Mui-disabled': { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' },
          },
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            borderColor: tokens.borderStrong,
            color: tokens.text,
            '&:hover': { borderColor: tokens.text, backgroundColor: 'rgba(255,255,255,0.04)' },
          },
        },
        {
          props: { variant: 'outlined', color: 'error' },
          style: { borderColor: 'rgba(255,138,154,0.5)', color: '#ff8a9a' },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform .2s ease, background-color .2s',
          '&:hover': { transform: 'translateY(-2px)' },
          '&:active': { transform: 'translateY(0)' },
          '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 500 },
        outlined: { borderColor: tokens.border },
      },
      variants: [
        {
          props: { variant: 'filled', color: 'primary' },
          style: { background: tokens.accentGradient, color: tokens.onAccent },
        },
      ],
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderColor: tokens.border,
          '&.Mui-selected, &.Mui-selected:hover': { background: tokens.accentGradient, color: tokens.onAccent },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.03)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.borderStrong },
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` } },
    },
    MuiMenu: {
      styleOverrides: { paper: { backgroundColor: tokens.surfaceRaised, border: `1px solid ${tokens.border}` } },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTabs: {
      styleOverrides: { indicator: { background: tokens.accentGradient, height: 3, borderRadius: 3 } },
    },
    MuiLinearProgress: {
      styleOverrides: { bar: { background: tokens.accentGradient }, root: { backgroundColor: 'rgba(255,255,255,0.08)' } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: tokens.surfaceRaised, border: `1px solid ${tokens.border}` } } },
  },
});
