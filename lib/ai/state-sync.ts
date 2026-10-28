// Client-side live state synchronization for the AI Agent's changes (round-up rule, risk profile).
// Allows changes made by the AI agent in chat to be immediately visible across the site.

import {
  DEFAULT_USER_CONTEXT,
  executeUpdateRoundUpRule,
  type RoundUpRuleToolResult,
  type UserFinancialContext,
} from "./tools";

const STORAGE_KEY = "nexxt_user_financial_context_v1";
export const CONTEXT_UPDATED_EVENT = "nexxt:financial-context-updated";

export function loadUserFinancialContext(): UserFinancialContext {
  if (typeof window === "undefined") {
    return DEFAULT_USER_CONTEXT;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_CONTEXT;
    const parsed = JSON.parse(raw) as Partial<UserFinancialContext>;
    return {
      ...DEFAULT_USER_CONTEXT,
      ...parsed,
      roundUpRule: {
        ...DEFAULT_USER_CONTEXT.roundUpRule,
        ...(parsed.roundUpRule ?? {}),
      },
    };
  } catch {
    return DEFAULT_USER_CONTEXT;
  }
}

export function saveUserFinancialContext(ctx: UserFinancialContext): RoundUpRuleToolResult {
  const computed = executeUpdateRoundUpRule(ctx.roundUpRule, ctx);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
      window.dispatchEvent(
        new CustomEvent(CONTEXT_UPDATED_EVENT, {
          detail: { context: ctx, computed },
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return computed;
}

