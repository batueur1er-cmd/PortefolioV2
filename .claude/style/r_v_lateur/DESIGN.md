---
version: alpha
name: Révélateur
description: Two-layer portfolio for Baptiste Nodon — a warm editorial surface and
  an X-ray blueprint layer revealed by a lens, sharing the exact same layout.
colors:
  paper: '#F1ECE3'
  paper-2: '#E7DFD2'
  ink: '#15120F'
  muted: '#625B52'
  accent: '#B5320F'
  on-accent: '#FFFFFF'
  line: rgba(21, 18, 15, 0.14)
  status: '#2F8F4E'
  xray-bg: '#06101D'
  xray-grid: rgba(127, 233, 255, 0.08)
  xray-line: '#7FE9FF'
  xray-note: '#FFD84D'
  xray-highlight: '#FF5BD0'
  xray-text: '#CFE9F2'
  xray-dim: rgba(127, 233, 255, 0.35)
  surface: '#fef9f0'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ede8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#4c4640'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#7e766f'
  outline-variant: '#cfc5bd'
  surface-tint: '#635d59'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1e1b18'
  on-primary-container: '#89837e'
  inverse-primary: '#cdc5c0'
  secondary: '#b02e0b'
  on-secondary: '#ffffff'
  secondary-container: '#fd653f'
  on-secondary-container: '#5e1100'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00210b'
  on-tertiary-container: '#369553'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9e1db'
  primary-fixed-dim: '#cdc5c0'
  on-primary-fixed: '#1e1b18'
  on-primary-fixed-variant: '#4a4642'
  secondary-fixed: '#ffdad2'
  secondary-fixed-dim: '#ffb4a2'
  on-secondary-fixed: '#3c0700'
  on-secondary-fixed-variant: '#8a1d00'
  tertiary-fixed: '#98f7ab'
  tertiary-fixed-dim: '#7cda91'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#005225'
  background: '#fef9f0'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  display:
    fontFamily: Instrument Serif
    fontSize: 10.5rem
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: -0.03em
  h2:
    fontFamily: Instrument Serif
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter Tight
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  lead:
    fontFamily: Inter Tight
    fontSize: 1.375rem
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: Inter Tight
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.08em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.4
  note:
    fontFamily: Caveat
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.1
  display-mobile:
    fontFamily: EB Garamond
    fontSize: 4.5rem
    fontWeight: '400'
    lineHeight: '0.95'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 3.5rem
    fontWeight: '400'
    lineHeight: '1.02'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
rounded:
  none: 0px
  sm: 4px
  md: 10px
  lg: 18px
  pill: 999px
  DEFAULT: 0.5rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 72px
  section: 150px
  gutter: 56px
  max-width: 1200px
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4.5rem
  space-section: 9.375rem
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 14px 22px
  button-primary-hover:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.on-accent}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 13px 21px
  tag:
    backgroundColor: '{colors.paper-2}'
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 6px 12px
  section-index:
    textColor: '{colors.accent}'
    typography: '{typography.label}'
  card:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: 24px
  control-dock:
    backgroundColor: rgba(21, 18, 15, 0.86)
    textColor: '{colors.paper}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 6px
    height: 52px
  popover:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: 24px
    width: 380px
  toast:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.mono}'
    rounded: '{rounded.md}'
    padding: 12px 16px
  xray-page:
    backgroundColor: '{colors.xray-bg}'
    textColor: '{colors.xray-text}'
  xray-note:
    backgroundColor: transparent
    textColor: '{colors.xray-note}'
    typography: '{typography.note}'
  xray-stamp:
    backgroundColor: transparent
    textColor: '{colors.xray-highlight}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: 8px 12px
  xray-chip:
    backgroundColor: '{colors.xray-bg}'
    textColor: '{colors.xray-line}'
    typography: '{typography.mono}'
    rounded: '{rounded.sm}'
    padding: 4px 8px
  xray-panel:
    backgroundColor: '{colors.xray-bg}'
    textColor: '{colors.xray-text}'
    typography: '{typography.mono}'
    rounded: '{rounded.md}'
    padding: 20px
  lens-hud:
    backgroundColor: transparent
    textColor: '{colors.xray-line}'
    typography: '{typography.label}'
---

