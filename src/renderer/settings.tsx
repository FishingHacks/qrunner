import { useEffect, useState } from 'react';
import { API } from './api';
import { DefaultViewProps, loader } from './App';
import { colors, ColorScheme, colorSchemes } from './constants';
import { chevronDown, chevronUp } from './icons';
import { KbdList } from './kbd';
import { srgbaToHex, useAsyncState } from './utils';

const fonts = [
  'Figtree',
  'Ubuntu',
  'B612',
  'Blinker',
  'Cambo',
  'Carrois Gothic',
  'Epilogue',
  'Gayathri',
  'Flamenco',
];

let $save = () => {};
let $reload = () => {};
let $reloadSchemes = () => {};
let $tid = 0;

const tailwindCssColors: Record<string, Record<number, string>> = {
  slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
  },
  gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
  },
  zinc: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
  },
  neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
  },
  stone: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09',
  },
  red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
  },
  orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
  },
  amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
  },
  yellow: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
  },
  lime: {
      50: '#f7fee7',
      100: '#ecfccb',
      200: '#d9f99d',
      300: '#bef264',
      400: '#a3e635',
      500: '#84cc16',
      600: '#65a30d',
      700: '#4d7c0f',
      800: '#3f6212',
      900: '#365314',
      950: '#1a2e05',
  },
  green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
  },
  emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
  },
  teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
  },
  cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
  },
  sky: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
  },
  blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
  },
  indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
  },
  violet: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
  },
  purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
  },
  fuchsia: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
  },
  pink: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724',
  },
  rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519',
  },
};
const tailwindCssColorLookup = {
  'slate-950': '#020617',
  'gray-950': '#030712',
  'zinc-950': '#09090b',
  'neutral-950': '#0a0a0a',
  'stone-950': '#0c0a09',
  'red-950': '#450a0a',
  'orange-950': '#431407',
  'amber-950': '#451a03',
  'yellow-950': '#422006',
  'lime-950': '#1a2e05',
  'green-950': '#052e16',
  'emerald-950': '#022c22',
  'teal-950': '#042f2e',
  'cyan-950': '#083344',
  'sky-950': '#082f49',
  'blue-950': '#172554',
  'indigo-950': '#1e1b4b',
  'violet-950': '#2e1065',
  'purple-950': '#3b0764',
  'fuchsia-950': '#4a044e',
  'pink-950': '#500724',
  'rose-950': '#4c0519',
  '#020617': 'slate-950',
  '#030712': 'gray-950',
  '#09090b': 'zinc-950',
  '#0a0a0a': 'neutral-950',
  '#0c0a09': 'stone-950',
  '#450a0a': 'red-950',
  '#431407': 'orange-950',
  '#451a03': 'amber-950',
  '#422006': 'yellow-950',
  '#1a2e05': 'lime-950',
  '#052e16': 'green-950',
  '#022c22': 'emerald-950',
  '#042f2e': 'teal-950',
  '#083344': 'cyan-950',
  '#082f49': 'sky-950',
  '#172554': 'blue-950',
  '#1e1b4b': 'indigo-950',
  '#2e1065': 'violet-950',
  '#3b0764': 'purple-950',
  '#4a044e': 'fuchsia-950',
  '#500724': 'pink-950',
  '#4c0519': 'rose-950',
  'slate-50': '#f8fafc',
  '#f8fafc': 'slate-50',
  'slate-100': '#f1f5f9',
  '#f1f5f9': 'slate-100',
  'slate-200': '#e2e8f0',
  '#e2e8f0': 'slate-200',
  'slate-300': '#cbd5e1',
  '#cbd5e1': 'slate-300',
  'slate-400': '#94a3b8',
  '#94a3b8': 'slate-400',
  'slate-500': '#64748b',
  '#64748b': 'slate-500',
  'slate-600': '#475569',
  '#475569': 'slate-600',
  'slate-700': '#334155',
  '#334155': 'slate-700',
  'slate-800': '#1e293b',
  '#1e293b': 'slate-800',
  'slate-900': '#0f172a',
  '#0f172a': 'slate-900',
  'gray-50': '#f9fafb',
  '#f9fafb': 'gray-50',
  'gray-100': '#f3f4f6',
  '#f3f4f6': 'gray-100',
  'gray-200': '#e5e7eb',
  '#e5e7eb': 'gray-200',
  'gray-300': '#d1d5db',
  '#d1d5db': 'gray-300',
  'gray-400': '#9ca3af',
  '#9ca3af': 'gray-400',
  'gray-500': '#6b7280',
  '#6b7280': 'gray-500',
  'gray-600': '#4b5563',
  '#4b5563': 'gray-600',
  'gray-700': '#374151',
  '#374151': 'gray-700',
  'gray-800': '#1f2937',
  '#1f2937': 'gray-800',
  'gray-900': '#111827',
  '#111827': 'gray-900',
  'zinc-50': '#fafafa',
  '#fafafa': 'neutral-50',
  'zinc-100': '#f4f4f5',
  '#f4f4f5': 'zinc-100',
  'zinc-200': '#e4e4e7',
  '#e4e4e7': 'zinc-200',
  'zinc-300': '#d4d4d8',
  '#d4d4d8': 'zinc-300',
  'zinc-400': '#a1a1aa',
  '#a1a1aa': 'zinc-400',
  'zinc-500': '#71717a',
  '#71717a': 'zinc-500',
  'zinc-600': '#52525b',
  '#52525b': 'zinc-600',
  'zinc-700': '#3f3f46',
  '#3f3f46': 'zinc-700',
  'zinc-800': '#27272a',
  '#27272a': 'zinc-800',
  'zinc-900': '#18181b',
  '#18181b': 'zinc-900',
  'neutral-50': '#fafafa',
  'neutral-100': '#f5f5f5',
  '#f5f5f5': 'neutral-100',
  'neutral-200': '#e5e5e5',
  '#e5e5e5': 'neutral-200',
  'neutral-300': '#d4d4d4',
  '#d4d4d4': 'neutral-300',
  'neutral-400': '#a3a3a3',
  '#a3a3a3': 'neutral-400',
  'neutral-500': '#737373',
  '#737373': 'neutral-500',
  'neutral-600': '#525252',
  '#525252': 'neutral-600',
  'neutral-700': '#404040',
  '#404040': 'neutral-700',
  'neutral-800': '#262626',
  '#262626': 'neutral-800',
  'neutral-900': '#171717',
  '#171717': 'neutral-900',
  'stone-50': '#fafaf9',
  '#fafaf9': 'stone-50',
  'stone-100': '#f5f5f4',
  '#f5f5f4': 'stone-100',
  'stone-200': '#e7e5e4',
  '#e7e5e4': 'stone-200',
  'stone-300': '#d6d3d1',
  '#d6d3d1': 'stone-300',
  'stone-400': '#a8a29e',
  '#a8a29e': 'stone-400',
  'stone-500': '#78716c',
  '#78716c': 'stone-500',
  'stone-600': '#57534e',
  '#57534e': 'stone-600',
  'stone-700': '#44403c',
  '#44403c': 'stone-700',
  'stone-800': '#292524',
  '#292524': 'stone-800',
  'stone-900': '#1c1917',
  '#1c1917': 'stone-900',
  'red-50': '#fef2f2',
  '#fef2f2': 'red-50',
  'red-100': '#fee2e2',
  '#fee2e2': 'red-100',
  'red-200': '#fecaca',
  '#fecaca': 'red-200',
  'red-300': '#fca5a5',
  '#fca5a5': 'red-300',
  'red-400': '#f87171',
  '#f87171': 'red-400',
  'red-500': '#ef4444',
  '#ef4444': 'red-500',
  'red-600': '#dc2626',
  '#dc2626': 'red-600',
  'red-700': '#b91c1c',
  '#b91c1c': 'red-700',
  'red-800': '#991b1b',
  '#991b1b': 'red-800',
  'red-900': '#7f1d1d',
  '#7f1d1d': 'red-900',
  'orange-50': '#fff7ed',
  '#fff7ed': 'orange-50',
  'orange-100': '#ffedd5',
  '#ffedd5': 'orange-100',
  'orange-200': '#fed7aa',
  '#fed7aa': 'orange-200',
  'orange-300': '#fdba74',
  '#fdba74': 'orange-300',
  'orange-400': '#fb923c',
  '#fb923c': 'orange-400',
  'orange-500': '#f97316',
  '#f97316': 'orange-500',
  'orange-600': '#ea580c',
  '#ea580c': 'orange-600',
  'orange-700': '#c2410c',
  '#c2410c': 'orange-700',
  'orange-800': '#9a3412',
  '#9a3412': 'orange-800',
  'orange-900': '#7c2d12',
  '#7c2d12': 'orange-900',
  'amber-50': '#fffbeb',
  '#fffbeb': 'amber-50',
  'amber-100': '#fef3c7',
  '#fef3c7': 'amber-100',
  'amber-200': '#fde68a',
  '#fde68a': 'amber-200',
  'amber-300': '#fcd34d',
  '#fcd34d': 'amber-300',
  'amber-400': '#fbbf24',
  '#fbbf24': 'amber-400',
  'amber-500': '#f59e0b',
  '#f59e0b': 'amber-500',
  'amber-600': '#d97706',
  '#d97706': 'amber-600',
  'amber-700': '#b45309',
  '#b45309': 'amber-700',
  'amber-800': '#92400e',
  '#92400e': 'amber-800',
  'amber-900': '#78350f',
  '#78350f': 'amber-900',
  'yellow-50': '#fefce8',
  '#fefce8': 'yellow-50',
  'yellow-100': '#fef9c3',
  '#fef9c3': 'yellow-100',
  'yellow-200': '#fef08a',
  '#fef08a': 'yellow-200',
  'yellow-300': '#fde047',
  '#fde047': 'yellow-300',
  'yellow-400': '#facc15',
  '#facc15': 'yellow-400',
  'yellow-500': '#eab308',
  '#eab308': 'yellow-500',
  'yellow-600': '#ca8a04',
  '#ca8a04': 'yellow-600',
  'yellow-700': '#a16207',
  '#a16207': 'yellow-700',
  'yellow-800': '#854d0e',
  '#854d0e': 'yellow-800',
  'yellow-900': '#713f12',
  '#713f12': 'yellow-900',
  'lime-50': '#f7fee7',
  '#f7fee7': 'lime-50',
  'lime-100': '#ecfccb',
  '#ecfccb': 'lime-100',
  'lime-200': '#d9f99d',
  '#d9f99d': 'lime-200',
  'lime-300': '#bef264',
  '#bef264': 'lime-300',
  'lime-400': '#a3e635',
  '#a3e635': 'lime-400',
  'lime-500': '#84cc16',
  '#84cc16': 'lime-500',
  'lime-600': '#65a30d',
  '#65a30d': 'lime-600',
  'lime-700': '#4d7c0f',
  '#4d7c0f': 'lime-700',
  'lime-800': '#3f6212',
  '#3f6212': 'lime-800',
  'lime-900': '#365314',
  '#365314': 'lime-900',
  'green-50': '#f0fdf4',
  '#f0fdf4': 'green-50',
  'green-100': '#dcfce7',
  '#dcfce7': 'green-100',
  'green-200': '#bbf7d0',
  '#bbf7d0': 'green-200',
  'green-300': '#86efac',
  '#86efac': 'green-300',
  'green-400': '#4ade80',
  '#4ade80': 'green-400',
  'green-500': '#22c55e',
  '#22c55e': 'green-500',
  'green-600': '#16a34a',
  '#16a34a': 'green-600',
  'green-700': '#15803d',
  '#15803d': 'green-700',
  'green-800': '#166534',
  '#166534': 'green-800',
  'green-900': '#14532d',
  '#14532d': 'green-900',
  'emerald-50': '#ecfdf5',
  '#ecfdf5': 'emerald-50',
  'emerald-100': '#d1fae5',
  '#d1fae5': 'emerald-100',
  'emerald-200': '#a7f3d0',
  '#a7f3d0': 'emerald-200',
  'emerald-300': '#6ee7b7',
  '#6ee7b7': 'emerald-300',
  'emerald-400': '#34d399',
  '#34d399': 'emerald-400',
  'emerald-500': '#10b981',
  '#10b981': 'emerald-500',
  'emerald-600': '#059669',
  '#059669': 'emerald-600',
  'emerald-700': '#047857',
  '#047857': 'emerald-700',
  'emerald-800': '#065f46',
  '#065f46': 'emerald-800',
  'emerald-900': '#064e3b',
  '#064e3b': 'emerald-900',
  'teal-50': '#f0fdfa',
  '#f0fdfa': 'teal-50',
  'teal-100': '#ccfbf1',
  '#ccfbf1': 'teal-100',
  'teal-200': '#99f6e4',
  '#99f6e4': 'teal-200',
  'teal-300': '#5eead4',
  '#5eead4': 'teal-300',
  'teal-400': '#2dd4bf',
  '#2dd4bf': 'teal-400',
  'teal-500': '#14b8a6',
  '#14b8a6': 'teal-500',
  'teal-600': '#0d9488',
  '#0d9488': 'teal-600',
  'teal-700': '#0f766e',
  '#0f766e': 'teal-700',
  'teal-800': '#115e59',
  '#115e59': 'teal-800',
  'teal-900': '#134e4a',
  '#134e4a': 'teal-900',
  'cyan-50': '#ecfeff',
  '#ecfeff': 'cyan-50',
  'cyan-100': '#cffafe',
  '#cffafe': 'cyan-100',
  'cyan-200': '#a5f3fc',
  '#a5f3fc': 'cyan-200',
  'cyan-300': '#67e8f9',
  '#67e8f9': 'cyan-300',
  'cyan-400': '#22d3ee',
  '#22d3ee': 'cyan-400',
  'cyan-500': '#06b6d4',
  '#06b6d4': 'cyan-500',
  'cyan-600': '#0891b2',
  '#0891b2': 'cyan-600',
  'cyan-700': '#0e7490',
  '#0e7490': 'cyan-700',
  'cyan-800': '#155e75',
  '#155e75': 'cyan-800',
  'cyan-900': '#164e63',
  '#164e63': 'cyan-900',
  'sky-50': '#f0f9ff',
  '#f0f9ff': 'sky-50',
  'sky-100': '#e0f2fe',
  '#e0f2fe': 'sky-100',
  'sky-200': '#bae6fd',
  '#bae6fd': 'sky-200',
  'sky-300': '#7dd3fc',
  '#7dd3fc': 'sky-300',
  'sky-400': '#38bdf8',
  '#38bdf8': 'sky-400',
  'sky-500': '#0ea5e9',
  '#0ea5e9': 'sky-500',
  'sky-600': '#0284c7',
  '#0284c7': 'sky-600',
  'sky-700': '#0369a1',
  '#0369a1': 'sky-700',
  'sky-800': '#075985',
  '#075985': 'sky-800',
  'sky-900': '#0c4a6e',
  '#0c4a6e': 'sky-900',
  'blue-50': '#eff6ff',
  '#eff6ff': 'blue-50',
  'blue-100': '#dbeafe',
  '#dbeafe': 'blue-100',
  'blue-200': '#bfdbfe',
  '#bfdbfe': 'blue-200',
  'blue-300': '#93c5fd',
  '#93c5fd': 'blue-300',
  'blue-400': '#60a5fa',
  '#60a5fa': 'blue-400',
  'blue-500': '#3b82f6',
  '#3b82f6': 'blue-500',
  'blue-600': '#2563eb',
  '#2563eb': 'blue-600',
  'blue-700': '#1d4ed8',
  '#1d4ed8': 'blue-700',
  'blue-800': '#1e40af',
  '#1e40af': 'blue-800',
  'blue-900': '#1e3a8a',
  '#1e3a8a': 'blue-900',
  'indigo-50': '#eef2ff',
  '#eef2ff': 'indigo-50',
  'indigo-100': '#e0e7ff',
  '#e0e7ff': 'indigo-100',
  'indigo-200': '#c7d2fe',
  '#c7d2fe': 'indigo-200',
  'indigo-300': '#a5b4fc',
  '#a5b4fc': 'indigo-300',
  'indigo-400': '#818cf8',
  '#818cf8': 'indigo-400',
  'indigo-500': '#6366f1',
  '#6366f1': 'indigo-500',
  'indigo-600': '#4f46e5',
  '#4f46e5': 'indigo-600',
  'indigo-700': '#4338ca',
  '#4338ca': 'indigo-700',
  'indigo-800': '#3730a3',
  '#3730a3': 'indigo-800',
  'indigo-900': '#312e81',
  '#312e81': 'indigo-900',
  'violet-50': '#f5f3ff',
  '#f5f3ff': 'violet-50',
  'violet-100': '#ede9fe',
  '#ede9fe': 'violet-100',
  'violet-200': '#ddd6fe',
  '#ddd6fe': 'violet-200',
  'violet-300': '#c4b5fd',
  '#c4b5fd': 'violet-300',
  'violet-400': '#a78bfa',
  '#a78bfa': 'violet-400',
  'violet-500': '#8b5cf6',
  '#8b5cf6': 'violet-500',
  'violet-600': '#7c3aed',
  '#7c3aed': 'violet-600',
  'violet-700': '#6d28d9',
  '#6d28d9': 'violet-700',
  'violet-800': '#5b21b6',
  '#5b21b6': 'violet-800',
  'violet-900': '#4c1d95',
  '#4c1d95': 'violet-900',
  'purple-50': '#faf5ff',
  '#faf5ff': 'purple-50',
  'purple-100': '#f3e8ff',
  '#f3e8ff': 'purple-100',
  'purple-200': '#e9d5ff',
  '#e9d5ff': 'purple-200',
  'purple-300': '#d8b4fe',
  '#d8b4fe': 'purple-300',
  'purple-400': '#c084fc',
  '#c084fc': 'purple-400',
  'purple-500': '#a855f7',
  '#a855f7': 'purple-500',
  'purple-600': '#9333ea',
  '#9333ea': 'purple-600',
  'purple-700': '#7e22ce',
  '#7e22ce': 'purple-700',
  'purple-800': '#6b21a8',
  '#6b21a8': 'purple-800',
  'purple-900': '#581c87',
  '#581c87': 'purple-900',
  'fuchsia-50': '#fdf4ff',
  '#fdf4ff': 'fuchsia-50',
  'fuchsia-100': '#fae8ff',
  '#fae8ff': 'fuchsia-100',
  'fuchsia-200': '#f5d0fe',
  '#f5d0fe': 'fuchsia-200',
  'fuchsia-300': '#f0abfc',
  '#f0abfc': 'fuchsia-300',
  'fuchsia-400': '#e879f9',
  '#e879f9': 'fuchsia-400',
  'fuchsia-500': '#d946ef',
  '#d946ef': 'fuchsia-500',
  'fuchsia-600': '#c026d3',
  '#c026d3': 'fuchsia-600',
  'fuchsia-700': '#a21caf',
  '#a21caf': 'fuchsia-700',
  'fuchsia-800': '#86198f',
  '#86198f': 'fuchsia-800',
  'fuchsia-900': '#701a75',
  '#701a75': 'fuchsia-900',
  'pink-50': '#fdf2f8',
  '#fdf2f8': 'pink-50',
  'pink-100': '#fce7f3',
  '#fce7f3': 'pink-100',
  'pink-200': '#fbcfe8',
  '#fbcfe8': 'pink-200',
  'pink-300': '#f9a8d4',
  '#f9a8d4': 'pink-300',
  'pink-400': '#f472b6',
  '#f472b6': 'pink-400',
  'pink-500': '#ec4899',
  '#ec4899': 'pink-500',
  'pink-600': '#db2777',
  '#db2777': 'pink-600',
  'pink-700': '#be185d',
  '#be185d': 'pink-700',
  'pink-800': '#9d174d',
  '#9d174d': 'pink-800',
  'pink-900': '#831843',
  '#831843': 'pink-900',
  'rose-50': '#fff1f2',
  '#fff1f2': 'rose-50',
  'rose-100': '#ffe4e6',
  '#ffe4e6': 'rose-100',
  'rose-200': '#fecdd3',
  '#fecdd3': 'rose-200',
  'rose-300': '#fda4af',
  '#fda4af': 'rose-300',
  'rose-400': '#fb7185',
  '#fb7185': 'rose-400',
  'rose-500': '#f43f5e',
  '#f43f5e': 'rose-500',
  'rose-600': '#e11d48',
  '#e11d48': 'rose-600',
  'rose-700': '#be123c',
  '#be123c': 'rose-700',
  'rose-800': '#9f1239',
  '#9f1239': 'rose-800',
  'rose-900': '#881337',
  '#881337': 'rose-900',
};

let $reloadEditor = () => {};
let $setShortcut = (s: string) => {};
let $setTempShortcut = (s: string) => {};

export default function Settings(props: DefaultViewProps) {
  props.config.disableBar = false;
  props.config.disableTabs = false;
  props.config.disableSearch = true;
  const { state: font, setState: setFont } = useAsyncState(API.getFont);
  const {
    state: shortcut,
    setState: setShortcut,
    reload: reloadShortcut,
  } = useAsyncState(API.getShortcut);
  const [colorsExpanded, setColorsExpanded] = useState(false);
  $setShortcut = setShortcut;

  const {
    state: config,
    setState: _setConfig,
    reload,
  } = useAsyncState(API.getColors);
  const { state: schemes, reload: reloadColorSchemes } = useAsyncState(
    API.getColorSchemes
  );
  const { state: editor, reload: reloadEditor } = useAsyncState(() =>
    API.getConfig('editor')
  );
  const [saved, setSaved] = useState(false);
  const [updated, setUpdated] = useState(true);
  const [tempShortcut, setTempShortcut] = useState(shortcut);
  $setTempShortcut = setTempShortcut;

  function setConfig(
    set:
      | 'loading'
      | ColorScheme
      | ((value: 'loading' | ColorScheme) => 'loading' | ColorScheme)
  ): void {
    _setConfig(set);
    setUpdated(false);
  }

  $reloadEditor = reloadEditor;
  $reload = reload;
  $reloadSchemes = reloadColorSchemes;
  $save = () => {
    const sLoader = loader('Saving settings');
    if (config !== 'loading')
      API.setColors(config).then(
        sLoader.stop(() => $reload),
        sLoader.stop()
      );
  };

  useEffect(() => $setTempShortcut(shortcut), [shortcut]);

  useEffect(() => {
    const footer = [
      <p onClick={() => $save()} style={{ cursor: 'pointer' }}>
        <KbdList keys={['cmd/ctrl', 's']} />: Save Theme
      </p>,
      <p onClick={() => $reload()} style={{ cursor: 'pointer' }}>
        <KbdList keys={['f5']} />: Reload Theme
      </p>,
    ];

    footer.unshift(<p>Theme {updated ? 'Saved' : 'Unsaved'}</p>);
    if (saved) footer.unshift(<p>Color copied to Clipboard!</p>);

    props.config.setFooter(footer);

    function onChange() {
      setUpdated(true);
    }
    API.addEventListener('color-change', onChange);
    return () => API.removeEventListener('color-change', onChange);
  }, [saved, updated]);

  useEffect(
    () =>
      API.addEventListener('shortcut-change', (ev, newShortcut: string) =>
        $setShortcut(newShortcut)
      ),
    []
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'F5') {
        e.preventDefault();
        $reload();
        $reloadSchemes();
      }
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        $save();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="page settings">
      <div className="flex" style={{ marginTop: 10 }}>
        <label htmlFor="select-font">
          <h3
            style={{
              margin: 0,
              marginRight: '1rem',
            }}
          >
            Font:{' '}
          </h3>
        </label>
        <select
          name="select-font"
          id="select-font"
          onChange={(e) => {
            API.setFont(e.target.value);
            setFont(e.target.value);
          }}
          value={font}
        >
          {fonts.map((f) => (
            <option
              key={'font-' + f}
              value={f.toLowerCase().replaceAll(' ', '-')}
            >
              {f}
            </option>
          ))}
        </select>
        <label htmlFor="select-font">
          <h3
            style={{
              margin: 0,
              marginRight: '1rem',
              marginLeft: '1rem',
            }}
          >
            Editor:{' '}
          </h3>
        </label>
        <select
          name="select-font"
          id="select-font"
          onChange={(e) => {
            API.setConfig('editor', e.target.value).then(() => $reloadEditor());
          }}
          value={editor || 'code'}
        >
          <option value="code">Visual Studio Code</option>
          <option value="emacs">Emacs</option>
          <option value="subl">Sublime</option>
        </select>
        <h3 style={{ marginLeft: '1rem', marginRight: '.3rem' }}>Shortcut:</h3>
        <KbdList
          keys={tempShortcut
            .split('+')
            .map((el) => el.toLowerCase())
            .map((el) =>
              ['commandorcontrol', 'cmdorctrl'].includes(el.toLowerCase())
                ? 'cmd/ctrl'
                : el
            )
            .filter((el) => el.length > 0)}
        />
        <input
          value={tempShortcut}
          style={{ marginLeft: '.25rem', width: '5rem', marginRight: '.3rem' }}
          onChange={(e) => setTempShortcut(e.target.value || '')}
          onKeyDown={(ev) =>
            ev.key === 'Enter'
              ? API.setShortcut(tempShortcut).then(() =>
                  $setShortcut(tempShortcut)
                )
              : null
          }
        />
        <p>
          ({tempShortcut === shortcut ? 'Saved' : 'Unsaved, hit Enter to save!'}
          )
        </p>
      </div>
      {config === 'loading' ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div>
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '5vw',
                }}
              >
                <h3>Colors</h3>
                <div
                  className="apply-button"
                  onClick={async () => {
                    try {
                      const name = await API.arg('Colorscheme Name');
                      await API.createColorScheme(name, config);
                      $reloadSchemes();
                    } catch {}
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 5l0 14"></path>
                    <path d="M5 12l14 0"></path>
                  </svg>
                  Save Colorscheme
                </div>
              </div>
              <table>
                <tbody>
                  {colors.map((c) => (
                    <tr key={c}>
                      <td>
                        <label htmlFor={'color-' + c}>
                          {c[0].toUpperCase()}
                          {c.substring(1)}:{' '}
                        </label>
                      </td>
                      <td
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '2.5rem',
                            height: '1.75rem',
                            borderRadius: 3,
                            backgroundColor: config[c],
                            marginLeft: '2vw',
                            border: '1px var(--color-text) solid',
                          }}
                        />
                        <input
                          style={{
                            marginLeft: '1rem',
                            marginRight: '.5rem',
                          }}
                          type="text"
                          value={config[c]}
                          onChange={(e) => {
                            setConfig((cfg) => {
                              if (cfg === 'loading') return cfg;
                              return {
                                ...cfg,
                                [c]: e.target.value,
                              };
                            });
                          }}
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          strokeWidth="1.25"
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            marginRight: '1rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            new (window as any).EyeDropper()
                              .open()
                              .then(({ sRGBHex }: { sRGBHex: string }) => {
                                sRGBHex = sRGBHex.substring(
                                  5,
                                  sRGBHex.length - 1
                                );
                                const [r, g, b, a] = sRGBHex.split(', ');

                                setConfig((cfg) => {
                                  if (cfg === 'loading') return cfg;

                                  return {
                                    ...cfg,
                                    [c]: srgbaToHex(
                                      Number(r),
                                      Number(g),
                                      Number(b),
                                      Number(a)
                                    ),
                                  };
                                });
                              });
                          }}
                        >
                          <path
                            stroke="none"
                            d="M0 0h24v24H0z"
                            fill="none"
                          ></path>
                          <path d="M11 7l6 6"></path>
                          <path d="M4 16l11.7 -11.7a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4l-11.7 11.7h-4v-4z"></path>
                        </svg>
                        {tailwindCssColorLookup[
                          config[c] as keyof typeof tailwindCssColorLookup
                        ] ? (
                          <>
                            (
                            {
                              tailwindCssColorLookup[
                                config[c] as keyof typeof tailwindCssColorLookup
                              ]
                            }
                            )
                          </>
                        ) : (
                          <>({config[c]})</>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginBottom: 5 }}>JSON:</p>
              <textarea readOnly value={JSON.stringify(config)} />
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                className="flex"
                style={{
                  cursor: 'pointer',
                  marginTop: 20,
                  width: 'fit-content',
                }}
                onClick={() => setColorsExpanded((e) => !e)}
              >
                <h3 style={{ margin: 0, marginRight: 10 }}>
                  TailwindCSS Colors
                </h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: colorsExpanded ? chevronUp : chevronDown,
                  }}
                />
              </div>
              {colorsExpanded &&
                Object.keys(tailwindCssColors).map((k) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      gap: 20,
                      alignItems: 'center',
                    }}
                  >
                    <p style={{ width: '3vw' }}>
                      <b>
                        {k[0].toUpperCase()}
                        {k.substring(1)}
                      </b>
                    </p>
                    {Object.keys(tailwindCssColors[k]).map((val) => (
                      <div
                        key={k + '-' + val}
                        style={{
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            tailwindCssColors[k][val as any as number]
                          );
                          setSaved(true);
                          clearTimeout($tid);
                          $tid = setTimeout(
                            () => setSaved(false),
                            1000
                          ) as any as number;
                        }}
                        className="tooltip"
                        data-tooltip={
                          tailwindCssColors[k][val as any as number] +
                          ' | Click to copy'
                        }
                      >
                        <div
                          style={{
                            backgroundColor:
                              tailwindCssColors[k][val as any as number],
                            width: '2.5rem',
                            height: '1.75rem',
                            borderRadius: 3,
                            marginBottom: 7,
                            border: '1px var(--color-text) solid',
                          }}
                        />
                        <div>{val}</div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
          <div
            style={{
              borderLeft: 'var(--color-primary) 1px solid',
              marginLeft: '2.5vw',
              paddingLeft: '2.5vw',
              paddingBottom: 30,
              marginBottom: -30,
            }}
          >
            <h3>Color Schemes</h3>
            <table>
              <tbody>
                {Object.entries(schemes === 'loading' ? [] : schemes)
                  .sort(([namea], [nameb]) => namea.localeCompare(nameb))
                  .sort(([namea], [nameb]) =>
                    namea.toLowerCase().includes('light') &&
                    !nameb.toLowerCase().includes('light')
                      ? 1
                      : !namea.toLowerCase().includes('light') &&
                        nameb.toLowerCase().includes('light')
                      ? -1
                      : 0
                  )
                  .map(([name, scheme]) => (
                    <tr key={name}>
                      <td
                        style={{
                          paddingRight: '2.5rem',
                        }}
                      >
                        <b>{name}</b>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                          }}
                        >
                          {(
                            ['primary', 'secondary', 'background'] as const
                          ).map((c) => (
                            <div
                              key={name + '-' + c}
                              style={{
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: scheme[c],
                                  width: '2.5rem',
                                  height: '1.75rem',
                                  borderRadius: 3,
                                  marginBottom: 3,
                                  border: '1px var(--color-text) solid',
                                }}
                                className="tooltip"
                                data-tooltip={`${scheme[c]}${
                                  tailwindCssColorLookup[
                                    scheme[
                                      c
                                    ] as keyof typeof tailwindCssColorLookup
                                  ]
                                    ? ' (' +
                                      tailwindCssColorLookup[
                                        scheme[
                                          c
                                        ] as keyof typeof tailwindCssColorLookup
                                      ] +
                                      ')'
                                    : ''
                                }`}
                              />
                              <div>{c}</div>
                            </div>
                          ))}
                          <div
                            className="apply-button tooltip"
                            onClick={() =>
                              API.setColors(scheme).then(() => $reload())
                            }
                            data-tooltip={`Apply Theme "${name}"`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                stroke="none"
                                d="M0 0h24v24H0z"
                                fill="none"
                              ></path>
                              <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            Apply
                          </div>
                          <div
                            className="apply-button tooltip"
                            onClick={() =>
                              API.deleteColorScheme(name).then(() =>
                                $reloadSchemes()
                              )
                            }
                            style={{
                              display:
                                name in colorSchemes ? 'none' : undefined,
                            }}
                            data-tooltip={`Delete Theme "${name}"`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                stroke="none"
                                d="M0 0h24v24H0z"
                                fill="none"
                              ></path>
                              <path d="M4 7l16 0"></path>
                              <path d="M10 11l0 6"></path>
                              <path d="M14 11l0 6"></path>
                              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
                            </svg>
                            Delete
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
