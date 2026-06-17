// Lightweight haptics wrapper around @capacitor/haptics.
//
// Every call is a no-op on the web (where there is no haptic engine) and
// swallows errors, so callers can fire these freely without guarding. The
// plugin is lazy-imported so it never adds weight to the web bundle's first
// paint, and only runs inside a Capacitor native app (iOS / Android).

let nativeChecked = false;
let isNative = false;

async function ensureNative(): Promise<boolean> {
  if (nativeChecked) return isNative;
  nativeChecked = true;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch {
    isNative = false;
  }
  return isNative;
}

/** Tiny tick for incremental selection changes — ideal for slider steps. */
export async function hapticSelection(): Promise<void> {
  if (!(await ensureNative())) return;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {
    // Haptics unavailable on this device — ignore.
  }
}

/** A firmer bump — use for committing an action like advancing a step. */
export async function hapticImpact(strength: "light" | "medium" | "heavy" = "medium"): Promise<void> {
  if (!(await ensureNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const style =
      strength === "light" ? ImpactStyle.Light :
      strength === "heavy" ? ImpactStyle.Heavy :
      ImpactStyle.Medium;
    await Haptics.impact({ style });
  } catch {
    // ignore
  }
}

/** Celebratory success pattern — use when the check-in completes. */
export async function hapticSuccess(): Promise<void> {
  if (!(await ensureNative())) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // ignore
  }
}
