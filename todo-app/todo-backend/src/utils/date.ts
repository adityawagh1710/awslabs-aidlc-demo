import { startOfDay, isBefore, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Returns true if the given ISO date string (YYYY-MM-DD) is strictly before
 * today in the supplied IANA timezone. Used to reject past due dates.
 */
export function isPastDate(isoDate: string, timezone: string): boolean {
  const serverNow = new Date()
  const zonedNow = toZonedTime(serverNow, timezone)
  const startOfTodayZoned = startOfDay(zonedNow)
  // Convert start-of-today-in-tz back to UTC for comparison
  const startOfTodayUTC = fromZonedTime(startOfTodayZoned, timezone)
  const dueDateUTC = parseISO(isoDate)
  return isBefore(dueDateUTC, startOfTodayUTC)
}

/**
 * Returns true if a task is overdue: has a due date, is not completed,
 * and the due date is strictly before today UTC midnight.
 * "Due today" is NOT overdue (US-11).
 */
export function computeIsOverdue(
  dueDate: Date | null,
  isCompleted: boolean,
  now: Date,
): boolean {
  if (dueDate === null) return false
  if (isCompleted) return false
  return isBefore(dueDate, startOfDay(now))
}
