import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`
  }
  return points.toString()
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const SUBJECTS = [
  'Math',
  'Physics',
  'Chemistry',
  'Biology',
  'CS',
  'English',
  'History',
  'Geography',
  'Economics',
  'Other',
] as const

export type Subject = (typeof SUBJECTS)[number]

export const SUBJECT_COLORS: Record<string, string> = {
  Math: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Physics: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Chemistry: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Biology: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  English: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  History: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Geography: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Economics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function generateUPILink({
  upiId,
  name,
  amount,
}: {
  upiId: string
  name: string
  amount: number
}): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`
}
