/**
 * Design Tokens - Type-Safe Access to Figma Design System
 * 
 * This file provides type-safe access to all design tokens defined in globals.css.
 * All tokens are based on the Figma design system built on Untitled UI with
 * Neura-specific semantic tokens.
 * 
 * Usage:
 *   import { tokens } from '@/app/tokens';
 *   <div style={{ color: tokens.colors.text.primary900 }}>...</div>
 */

export const tokens = {
  colors: {
    brand: {
      600: 'var(--colors-brand-600)',
      500: 'var(--colors-brand-500)',
      solid: 'var(--colors-brand-solid)',
    },
    background: {
      primary: 'var(--colors-background-bg-primary)',
      primaryAlt: 'var(--colors-background-bg-primary-alt)',
      secondary: 'var(--colors-background-bg-secondary)',
      secondarySubtle: 'var(--colors-background-bg-secondary-subtle)',
      brandSolid: 'var(--colors-background-bg-brand-solid)',
      successSecondary: 'var(--colors-background-bg-success-secondary)',
      errorSecondary: 'var(--colors-background-bg-error-secondary)',
    },
    text: {
      primary900: 'var(--colors-text-text-primary-900)',
      secondary700: 'var(--colors-text-text-secondary-700)',
      quaternary500: 'var(--colors-text-text-quaternary-500)',
      white: 'var(--colors-text-text-white)',
      brandTertiary600: 'var(--colors-text-text-brand-tertiary-600)',
    },
    border: {
      primary: 'var(--colors-border-border-primary)',
      secondary: 'var(--colors-border-border-secondary)',
    },
    foreground: {
      primary900: 'var(--colors-foreground-fg-primary-900)',
      quaternary400: 'var(--colors-foreground-fg-quaternary-400)',
      brandPrimary600: 'var(--colors-foreground-fg-brand-primary-600)',
      brandSecondary500: 'var(--colors-foreground-fg-brand-secondary-500)',
    },
    utility: {
      gray200: 'var(--component-colors-utility-gray-200)',
      gray300: 'var(--component-colors-utility-gray-300)',
      gray600: 'var(--component-colors-utility-gray-600)',
      fuchsia300: 'var(--component-colors-utility-fuchsia-300)',
      brand500: 'var(--component-colors-utility-brand-500)',
    },
    icon: {
      success: 'var(--component-colors-components-icons-featured-icon-light-fg-success)',
      error: 'var(--component-colors-components-icons-featured-icon-light-fg-error)',
    },
  },
  spacing: {
    xxs: 'var(--spacing-xxs)',
    xs: 'var(--spacing-xs)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    containerPaddingDesktop: 'var(--container-padding-desktop)',
    containerMaxWidthDesktop: 'var(--container-max-width-desktop)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    xl: 'var(--radius-xl)',
    '4xl': 'var(--radius-4xl)',
    full: 'var(--radius-full)',
  },
  typography: {
    fontFamily: {
      display: 'var(--font-family-display)',
      body: 'var(--font-family-body)',
    },
    fontSize: {
      displayMd: 'var(--font-size-display-md)',
      displaySm: 'var(--font-size-display-sm)',
      displayXs: 'var(--font-size-display-xs)',
      textLg: 'var(--font-size-text-lg)',
      textMd: 'var(--font-size-text-md)',
      textSm: 'var(--font-size-text-sm)',
      textXs: 'var(--font-size-text-xs)',
    },
    lineHeight: {
      displayMd: 'var(--line-height-display-md)',
      displaySm: 'var(--line-height-display-sm)',
      displayXs: 'var(--line-height-display-xs)',
      textLg: 'var(--line-height-text-lg)',
      textMd: 'var(--line-height-text-md)',
      textSm: 'var(--line-height-text-sm)',
      textXs: 'var(--line-height-text-xs)',
    },
    fontWeight: {
      regular: 'var(--font-weight-regular)',
      medium: 'var(--font-weight-medium)',
      semibold: 'var(--font-weight-semibold)',
      bold: 'var(--font-weight-bold)',
    },
    letterSpacing: {
      displayMd: 'var(--letter-spacing-display-md)',
    },
  },
  shadows: {
    xs: 'var(--colors-effects-shadows-shadow-xs)',
    sm01: 'var(--colors-effects-shadows-shadow-sm-01)',
    sm02: 'var(--colors-effects-shadows-shadow-sm-02)',
    skeumorphicInner: 'var(--colors-effects-shadows-shadow-skeumorphic-inner)',
    skeumorphicInnerBorder: 'var(--colors-effects-shadows-shadow-skeumorphic-inner-border)',
  },
} as const;

/**
 * Helper function to get shadow styles for skeuomorphic buttons
 */
export const getSkeumorphicShadow = () => ({
  boxShadow: `
    0px 1px 2px 0px ${tokens.shadows.xs},
    inset 0px 0px 0px 1px ${tokens.shadows.skeumorphicInnerBorder},
    inset 0px -2px 0px 0px ${tokens.shadows.skeumorphicInner}
  `,
});

/**
 * Helper function to get shadow styles for sm shadow
 */
export const getShadowSm = () => ({
  boxShadow: `
    0px 1px 3px 0px ${tokens.shadows.sm01},
    0px 1px 2px -1px ${tokens.shadows.sm02}
  `,
});
