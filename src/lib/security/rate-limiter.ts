// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SECURITY, RLS AUTHORIZATION & RATE LIMITING
// Enforces per-user data access boundaries and protects expensive AI routes
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

interface BucketEntry {
  count: number;
  windowStartMs: number;
}

const rateLimitStore = new Map<string, BucketEntry>();

/**
 * Sliding window per-user rate limiter for expensive AI operations.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    rateLimitStore.set(identifier, { count: 1, windowStartMs: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, windowMs - (now - existing.windowStartMs)),
    };
  }

  existing.count += 1;
  rateLimitStore.set(identifier, existing);

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInMs: Math.max(0, windowMs - (now - existing.windowStartMs)),
  };
}

/**
 * Enforces Row-Level Security (RLS) ownership semantics in application service layer.
 * Never trusts user IDs supplied by client requests unless they match the authenticated session user ID.
 */
export function verifyResourceOwnership(params: {
  sessionUserId: string | null | undefined;
  resourceOwnerUserId: string | null | undefined;
}): { authorized: boolean; error?: string } {
  if (!params.sessionUserId || params.sessionUserId.trim().length === 0) {
    return {
      authorized: false,
      error: "Unauthorized: No active authenticated user session.",
    };
  }

  if (!params.resourceOwnerUserId || params.resourceOwnerUserId.trim().length === 0) {
    return {
      authorized: false,
      error: "Forbidden: Resource owner ID is missing.",
    };
  }

  if (params.sessionUserId !== params.resourceOwnerUserId) {
    return {
      authorized: false,
      error: "Forbidden (RLS Boundary Violation): Users may only access their own private fitness records.",
    };
  }

  return { authorized: true };
}
