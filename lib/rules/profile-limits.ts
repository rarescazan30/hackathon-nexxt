// Sanity limits for what a user tells us about themselves (onboarding and Profile).
// One place, used by the browser (to show an error) and the server (to reject the input),
// so a typo like a salary of 1 RON can't produce absurd numbers.

/** Net salary floor, close to the Romanian net minimum wage (team decision, 28 Oct 2026). */
export const MIN_NET_SALARY_BANI = 200_000; // 2,000 RON
export const MAX_NET_SALARY_BANI = 10_000_000; // 100,000 RON
export const MIN_AGE = 18;
/** At 65 you are already retired; the app is about the years before. */
export const MAX_AGE = 64;
/** Earliest age for a work contract, so years worked can't exceed age − 16. */
export const MIN_WORK_AGE = 16;

const ron = (bani: number) => (bani / 100).toLocaleString("en-US");

export interface ProfileFacts {
  birthYear: number;
  netSalaryBani: number;
  yearsWorked: number;
}

export type ProfileField = keyof ProfileFacts;

/** The first problem with the input, or null when it all makes sense. */
export function profileError(facts: ProfileFacts, year: number = new Date().getFullYear()): { field: ProfileField; message: string } | null {
  const age = year - facts.birthYear;
  if (!Number.isInteger(facts.birthYear) || age < MIN_AGE || age > MAX_AGE) {
    return { field: "birthYear", message: `Enter a birth year between ${year - MAX_AGE} and ${year - MIN_AGE}.` };
  }
  if (!Number.isFinite(facts.netSalaryBani) || facts.netSalaryBani < MIN_NET_SALARY_BANI || facts.netSalaryBani > MAX_NET_SALARY_BANI) {
    return {
      field: "netSalaryBani",
      message: `Enter your monthly net salary, between ${ron(MIN_NET_SALARY_BANI)} and ${ron(MAX_NET_SALARY_BANI)} RON.`,
    };
  }
  const maxYears = age - MIN_WORK_AGE;
  if (!Number.isInteger(facts.yearsWorked) || facts.yearsWorked < 0 || facts.yearsWorked > maxYears) {
    return { field: "yearsWorked", message: `At your age, years worked can be from 0 to ${maxYears}.` };
  }
  return null;
}
