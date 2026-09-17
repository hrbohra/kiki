// Message drafts — the three things the cold-state card offers when two people have nobody in
// common: "Let us introduce you properly", "Have a quick call before you say yes", "Offer them a
// shorter first stay". Each is an AiTask: Kiki drafts the message from what the graph can prove,
// and the person reads it, edits it, and sends it themselves. The model never sends anything.

import { baseGuard, dataBlock, DATA_RULE, namesGuard, type AiTask, type GuardResult } from './task';
import { shorterStay, stayLength } from '../domain/stay';
import type { TrustStory } from '../domain/types';

export type DraftKind = 'introduce' | 'call' | 'shorter';
/** Who is writing: the host deciding on a request, or the guest reaching out to a host. */
export type DraftAs = 'host' | 'guest';

export interface DraftFacts {
  kind: DraftKind;
  as: DraftAs;
  recipient: string; // first name
  degrees: number | null; // null = not connected
  via: string | null; // the first person on the route, when there is one
  invitedBy: string | null;
  sharedGround: string[]; // overlap sentences, written as "we both …"
  trackRecordCount: number; // guest-book entries about the recipient as a guest
  stay: string | null; // "2 weeks"
  shorter: string | null; // "1 week"
  unknowns: string[];
  /** Member-written text, fenced as data in the prompt. */
  memberText: { label: string; text: string }[];
}

const first = (name: string) => name.split(' ')[0];
const asWe = (label: string) => label
  .replace(/^You both /, 'we both ')
  .replace(/^You're both /, 'we’re both ')
  .replace(/^You were both /, 'we were both ')
  .replace(/^You've both /, 'we’ve both ');

/** Everything a draft may say, taken from the trust story. Pure — the API and the tests share it. */
export function buildDraftFacts(story: TrustStory, kind: DraftKind, as: DraftAs, nights?: number): DraftFacts {
  const route = story.rankedRoutes[0]?.members ?? [];
  const unknowns: string[] = [];
  if (!story.warm && !story.direct) unknowns.push('nobody the writer knows has met the recipient');
  if (!story.guestTrackRecord.length) unknowns.push('the recipient has no record as a guest on Kiki');
  const memberText = story.guestTrackRecord.slice(0, 2).map((g) => ({ label: `guest-book entry: what ${first(g.author.name)}, a past host, wrote about ${first(story.host.name)} as a guest`, text: g.text }));
  return {
    kind,
    as,
    recipient: first(story.host.name),
    degrees: story.reachable ? story.degrees : null,
    via: route.length > 2 ? first(route[1].name) : null,
    invitedBy: story.inviter ? first(story.inviter.member.name) : null,
    sharedGround: story.overlaps.slice(0, 3).map((o) => asWe(o.label)),
    trackRecordCount: story.guestTrackRecord.length,
    stay: nights ? stayLength(nights) : null,
    // a fact the task does not need is a fact the model will find a use for: only the
    // shorter-stay draft is told there is a shorter stay
    shorter: nights && kind === 'shorter' ? stayLength(shorterStay(nights)) : null,
    unknowns,
    memberText,
  };
}

const ASK: Record<DraftKind, string> = {
  introduce: 'Write a first message that introduces the writer properly: open with the shared ground if there is any, say plainly that they have nobody in common yet, and ask one or two easy questions about the trip and the person.',
  call: 'Write a short message proposing a quick call (about ten minutes) before anything is agreed. Offer two loose time windows without inventing dates. Say why: it is nice to hear a voice before handing over keys.',
  shorter: 'Write a short message proposing a smaller first stay (the "shorter" fact) instead of the full stay, framed as a way to start, with the rest open once it has gone well. Ask whether that fits their plans.',
};

function instructionsFor(kind: DraftKind): string {
  return [
    'You are drafting a message that one Kiki member will read, edit and send to another. You are not sending it.',
    ASK[kind],
    'Rules: write in the first person as the writer ("I"), addressed to the recipient by first name.',
    '3 to 5 sentences. Plain, warm, honest. No emojis, at most one exclamation mark, no links, no markdown, no sign-off name.',
    'Use ONLY the facts given. Never invent people, places, dates, prices or history. If the facts say something is unknown, it is fine to say so.',
    'Shared ground is common ground, never proof that someone is safe.',
    DATA_RULE,
    'Output only the message.',
  ].join('\n');
}

function promptFor(f: DraftFacts): string {
  const { memberText, ...facts } = f;
  return [
    `WRITER: the ${f.as}. RECIPIENT: ${f.recipient}.`,
    `FACTS (only use these):\n${JSON.stringify(facts, null, 2)}`,
    ...memberText.map((m) => dataBlock(m.label, m.text)),
  ].join('\n\n');
}

function guardFor(text: string, f: DraftFacts): GuardResult {
  const base = baseGuard(text, { min: 60, max: 700 });
  if (!base.ok) return base;
  if (!text.includes(f.recipient)) return { ok: false, reason: 'does not address the recipient' };
  if (f.kind === 'shorter' && f.shorter && !text.toLowerCase().includes(f.shorter.toLowerCase())) return { ok: false, reason: 'does not state the shorter stay' };
  if (f.kind === 'call' && !/\bcall\b/i.test(text)) return { ok: false, reason: 'does not propose a call' };
  return namesGuard(text, JSON.stringify(f));
}

/** The deterministic twin: the same facts as a plain, true message. Always available. */
function composeFor(f: DraftFacts): string {
  const hi = `Hi ${f.recipient}.`;
  const ground = f.sharedGround.length ? `Kiki tells me ${f.sharedGround[0]}${f.sharedGround[1] ? `, and ${f.sharedGround[1]}` : ''}.` : '';
  const cold = f.degrees === null || f.degrees > 2;
  const stayAtMine = f.stay ? `${f.stay} at mine` : 'a stay at mine';
  const stayAtYours = f.stay ? `${f.stay} at yours` : 'a stay at yours';

  if (f.kind === 'introduce') {
    return f.as === 'host'
      ? [hi, ground, cold ? `Nobody I know has met you yet, so before I say yes to ${stayAtMine} I’d like to know you a little.` : `Before I say yes to ${stayAtMine} I’d like to know you a little.`, f.invitedBy ? `I can see ${f.invitedBy} brought you into Kiki, which helps.` : '', 'What brings you to London, and what would your days look like while you’re here?'].filter(Boolean).join(' ')
      : [hi, ground, cold ? 'We don’t know anyone in common yet, so I wanted to introduce myself properly before asking for anything.' : 'I wanted to introduce myself properly before asking for anything.', f.stay ? `I’m looking for somewhere for ${f.stay}.` : '', 'Happy to tell you anything that would help you decide. What would you want to know about a guest?'].filter(Boolean).join(' ');
  }
  if (f.kind === 'call') {
    return f.as === 'host'
      ? [hi, `Before I say yes to ${stayAtMine}, could we do a quick call? Ten minutes is plenty.`, 'I’m around most evenings this week, or at the weekend if that’s easier. Tell me what suits and I’ll ring you.', 'It’s just nice to hear a voice before handing over keys.'].join(' ')
      : [hi, `Before you decide about ${stayAtYours}, would a quick call help? Ten minutes is plenty.`, 'I’m around most evenings this week, or at the weekend if that’s easier.', 'It’s easier to say yes to a voice than to a profile.'].join(' ');
  }
  // shorter
  const smaller = f.shorter ?? 'a shorter stay';
  return f.as === 'host'
    ? [hi, 'I’d like to make this work.', cold ? `Since we don’t know anyone in common yet, I’d be more comfortable starting smaller: ${smaller}${f.stay ? ` rather than ${f.stay}` : ''}.` : `I’d be more comfortable starting smaller: ${smaller}${f.stay ? ` rather than ${f.stay}` : ''}.`, 'If it goes well, which I expect it will, we can talk about the rest. Would that fit your plans?'].join(' ')
    : [hi, cold ? 'We don’t know anyone in common yet, so I’d understand if the full stay feels like a lot.' : 'I’d understand if the full stay feels like a lot.', `Would ${smaller} work as a start${f.stay ? `, instead of ${f.stay}` : ''}?`, 'If it goes well we can talk about the rest.'].join(' ');
}

function draftTask(kind: DraftKind): AiTask<DraftFacts> {
  return { id: `draft.${kind}`, version: 2, instructions: instructionsFor(kind), prompt: promptFor, guard: guardFor, compose: composeFor };
}

export const DRAFT_TASKS: Record<DraftKind, AiTask<DraftFacts>> = {
  introduce: draftTask('introduce'),
  call: draftTask('call'),
  shorter: draftTask('shorter'),
};

/** The card's three rows, with the third computed from the actual ask (never "1 night instead of 3" by rote). */
export function draftOptions(as: DraftAs, nights?: number): { kind: DraftKind; label: string }[] {
  const full = nights ? stayLength(nights) : null;
  const smaller = nights ? stayLength(shorterStay(nights)) : null;
  return [
    { kind: 'introduce', label: 'Let us introduce you properly' },
    { kind: 'call', label: as === 'host' ? 'Have a quick call before you say yes' : 'Have a quick call before you ask' },
    { kind: 'shorter', label: as === 'host' ? (full && smaller ? `Offer them ${smaller} instead of ${full}` : 'Offer them a shorter first stay') : (full && smaller ? `Ask for ${smaller} first, not ${full}` : 'Ask for a shorter first stay') },
  ];
}
