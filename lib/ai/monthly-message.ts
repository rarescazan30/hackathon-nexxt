// The short message on the month-end offer card ("You saved 229 RON this month...").
// All numbers come from lib/rules and are passed in; the model only writes the sentence.
import { formatRon } from "../rules";
import { callModel } from "./model";

export interface MonthlyMessageFacts {
  firstName: string;
  /** e.g. "October" */
  month: string;
  amountBani: number;
  daysAdded: number;
  /** e.g. "Good groceries"; null at the top level. */
  nextUnlock: string | null;
  levelUpNow: boolean;
}

const MAX_LENGTH = 220;

const SYSTEM = `You write one short, warm message for a retirement-saving app for people aged 30-40.
Rules:
- English, at most 2 sentences, under ${MAX_LENGTH} characters, no emojis, no markdown.
- Use only the numbers given to you, written exactly as given. Never invent numbers.
- Do not give investment advice or promise returns. The user decides.
- Encourage adding this month's amount to their Pillar III pension.`;

/** The message without AI: used on mock, on errors, and if the model breaks the rules. */
export function fallbackMonthlyMessage(facts: MonthlyMessageFacts): string {
  const amount = formatRon(facts.amountBani, { wholeRon: true });
  const reward = facts.levelUpNow && facts.nextUnlock
    ? `That's +${facts.daysAdded} days of freedom, enough to unlock ${facts.nextUnlock.toLowerCase()}.`
    : `That's +${facts.daysAdded} days of freedom in retirement.`;
  return `${facts.firstName}, you saved ${amount} in ${facts.month}. ${reward}`;
}

export async function monthlyOfferMessage(facts: MonthlyMessageFacts): Promise<string> {
  const amount = formatRon(facts.amountBani, { wholeRon: true });
  const prompt = [
    `Name: ${facts.firstName}`,
    `Month: ${facts.month}`,
    `Saved this month: ${amount}`,
    `Days of freedom this adds: ${facts.daysAdded}`,
    facts.levelUpNow && facts.nextUnlock ? `Accepting unlocks in their retirement scene: ${facts.nextUnlock}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await callModel({ system: SYSTEM, prompt });
  const text = result?.text.replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_LENGTH || !text.includes(String(facts.daysAdded))) {
    return fallbackMonthlyMessage(facts);
  }
  return text;
}
