/**
 * Proactive token refresh — schedules a silent refresh before the access token expires.
 * This prevents the user from hitting a 401 mid-session.
 */

let refreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Decode the `exp` claim from a JWT without verifying the signature.
 * Returns the expiry timestamp in milliseconds, or null if the token is malformed.
 */
export function decodeExp(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return null
    return payload.exp * 1000 // convert seconds → ms
  } catch {
    return null
  }
}

/**
 * Schedule a proactive refresh 60 seconds before the access token expires.
 * Calls `onRefresh` when the timer fires.
 */
export function scheduleProactiveRefresh(
  accessToken: string,
  onRefresh: () => void
): void {
  cancelScheduledRefresh()

  const exp = decodeExp(accessToken)
  if (!exp) return

  const now = Date.now()
  const msUntilExpiry = exp - now
  const msUntilRefresh = msUntilExpiry - 60_000 // 60s before expiry

  if (msUntilRefresh <= 0) {
    // Token already close to expiry — refresh immediately
    onRefresh()
    return
  }

  refreshTimer = setTimeout(onRefresh, msUntilRefresh)
}

/** Cancel any pending proactive refresh timer. */
export function cancelScheduledRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

/**
 * Perform a silent refresh using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
export async function silentRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.accessToken ?? null
  } catch {
    return null
  }
}
