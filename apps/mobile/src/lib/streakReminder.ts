// Streak-lapse reminder (A-06) - mission_profile.md "Out of scope" is explicit: no real push
// infra (APNs/FCM). This is BEST-EFFORT LOCAL scheduling only, via expo-notifications' on-device
// scheduler. It only fires if the OS keeps the process/scheduled-notification alive; it is not a
// server-pushed alert and there is no delivery guarantee. That tradeoff is the whole point of the
// scope decision, not an oversight.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Backend streak model (T10, apps/backend/src/routes/gamification.ts, `gmtCalendarDay` +
// `/streak/ping`) is NOT a rolling 24h window from `lastActivityAt` - it's a GMT CALENDAR-DAY
// boundary: dayGap 0 (same GMT day) = no-op, dayGap 1 (next GMT day) = continuity, dayGap >= 2
// = reset. So a check-in on GMT day D is safe all through day D+1 (the grace day) and the streak
// actually lapses the instant GMT day D+2 begins - i.e. real deadline = start of gmtCalendarDay(D)+2,
// which is 24h-48h after `lastActivityAt` depending on what time-of-day within day D the check-in
// landed (T15-remediation, validator BLOCKed the earlier flat-+20h version for this exact drift).
// Reminder fires REMINDER_LEAD_HOURS before that real deadline, not before a flat offset.
export const REMINDER_LEAD_HOURS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_LEAD_MS = REMINDER_LEAD_HOURS * 60 * 60 * 1000;

// Fixed identifier - every call schedules/replaces THIS ONE reminder, never a second one.
export const STREAK_REMINDER_IDENTIFIER = "asaase-streak-lapse-reminder";

let androidChannelReady = false;

// Mirrors backend's gamification.ts `gmtCalendarDay` exactly (days-since-epoch index of a
// timestamp's GMT calendar date) - same rule, same boundary, computed independently on-device.
function gmtCalendarDay(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS);
}

/** Pure: given the user's last-activity ISO timestamp, when should the reminder fire? */
export function computeReminderTrigger(lastActivityAt: string): Date {
  const last = new Date(lastActivityAt);
  // Start of the GMT day AFTER the grace day (D+2) is the real reset instant per backend's rule.
  const lapseBoundaryMs = (gmtCalendarDay(last) + 2) * DAY_MS;
  return new Date(lapseBoundaryMs - REMINDER_LEAD_MS);
}

async function ensureAndroidChannel(): Promise<void> {
  if (androidChannelReady || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("streak-reminders", {
    name: "Streak reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  androidChannelReady = true;
}

// Call whenever the home screen has fresh `lastActivityAt` (initial load, focus refetch,
// post-check-in). Always cancels the previous reminder first so repeated calls never stack
// duplicates - reschedule-in-place, not append.
export async function scheduleStreakReminder(lastActivityAt: string | null): Promise<void> {
  // expo-notifications has no local-scheduling support on web (Notifications.scheduleNotificationAsync
  // is a no-op there) - degrade silently rather than throw, per "best-effort".
  if (Platform.OS === "web") return;

  await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_IDENTIFIER).catch(() => {
    // nothing was scheduled yet - fine
  });

  if (!lastActivityAt) return; // no qualifying activity yet, nothing can lapse

  const trigger = computeReminderTrigger(lastActivityAt);
  if (trigger.getTime() <= Date.now()) return; // stale fetch - don't fire a reminder in the past

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return; // denied - best-effort means degrade quietly, not block the screen

  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_IDENTIFIER,
    content: {
      title: "Your streak is about to lapse 🔥",
      body: "Check in or log an eco action soon to keep your streak alive.",
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });
}
