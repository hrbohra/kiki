// The mutual-friend introduction — Kiki's actual moat, made real.
//
// The product vision is an AI that "reads between the lines" of two people and writes the warm,
// mutual-friend-toned message that turns a stranger into a friend-of-a-friend. Today that message
// is composed *deterministically* from the structured overlap data the trust graph already
// produces — [shared origin] + [shared experience] + [mutuals] + [trust anecdote] — in that
// order: address every point of a host's anxiety, and the result reads like a friend wrote it.
//
// This module is pure and platform-agnostic. `composeMutualFriendIntro` is the shipped generator.
// `mutualFriendPrompt` returns the exact prompt you'd hand a tone-trained model (their 10,000
// Instagram conversations) to generate the same message with real nuance — so the deterministic
// output and the model prompt sit side by side, honestly labelled.

import { dataBlock, DATA_RULE } from '../ai/task';
import type { Overlap, Provenance, TraitKind, TrustStory } from './types';

export interface IntroPart {
  kind: TraitKind | 'mutual' | 'anecdote';
  text: string;
  provenance?: Provenance;
}

export interface Anxiety {
  key: 'who' | 'home' | 'accountable' | 'familiar';
  label: string;
  covered: boolean;
}

export interface MutualFriendIntro {
  greeting: string;
  /** The single strongest thing you share — the "I see myself in them" headline (homophily). */
  spotlight: { kind: TraitKind; text: string } | null;
  /** The composed message — one warm paragraph. */
  paragraph: string;
  /** The building blocks, for the provenance chips ("your words" / "we worked it out"). */
  parts: IntroPart[];
  /** The four anxieties a first-time host feels, and whether this intro answers each. */
  anxieties: Anxiety[];
}

/** The strongest overlap as a short, punchy headline chip — homophily at a glance. */
function spotlightOf(o: Overlap): { kind: TraitKind; text: string } {
  const raw = o.label
    .replace(/^You both moved to London from /, '')
    .replace(/^You both studied at /, '')
    .replace(/^You've both worked in /, '')
    .replace(/^You're both into /, '')
    .replace(/^You were both at /, '');
  const text = o.kind === 'origin' ? `Both from ${raw}`
    : o.kind === 'education' ? `Both studied in ${raw}`
      : o.kind === 'work' ? `Both worked in ${raw}`
        : o.kind === 'interest' ? `Both into ${raw}`
          : `Both at ${raw}`;
  return { kind: o.kind, text };
}

/** Strip the overlap's rendered "You both …" phrasing back to a fragment we can re-weave. */
function fragmentOf(kind: TraitKind, label: string): string {
  const raw = label
    .replace(/^You both moved to London from /, '')
    .replace(/^You both studied at /, '')
    .replace(/^You've both worked in /, '')
    .replace(/^You're both into /, '')
    .replace(/^You were both at /, '');
  switch (kind) {
    case 'origin': return `moved to London from ${raw}`;
    case 'education': return `studied at ${raw}`;
    case 'work': return `worked in ${raw}`;
    case 'interest': return `are into ${raw}`;
    case 'event': return `were both at ${raw}`;
    default: return raw;
  }
}

function joinNatural(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Compose the mutual-friend intro from a trust story. Warm/direct/cold each get an honest shape;
 * the paragraph never claims more than the data supports.
 */
export function composeMutualFriendIntro(story: TrustStory): MutualFriendIntro {
  const name = story.host.name;
  const parts: IntroPart[] = [];
  const sentences: string[] = [];

  // Shared ground (overlaps) — the homophily hit, ordered strongest-first by the domain already.
  if (story.overlaps.length) {
    const frags = story.overlaps.slice(0, 3).map((o) => fragmentOf(o.kind, o.label));
    sentences.push(`You both ${joinNatural(frags)}.`);
    for (const o of story.overlaps.slice(0, 3)) parts.push({ kind: o.kind, text: o.label, provenance: o.provenance });
  }

  // Mutuals + the trust anecdote (the accountability + care-of-home signals).
  const anec = story.channels.find((c) => !!c.note?.trim());
  if (story.warm && story.channels.length) {
    const names = story.channels.map((c) => c.voucher.name);
    sentences.push(`You share ${names.length} mutual ${names.length === 1 ? 'friend' : 'friends'} — ${joinNatural(names)} — who can vouch for ${name} in person.`);
    for (const c of story.channels) parts.push({ kind: 'mutual', text: `${c.voucher.name} — a mutual friend of yours` });
    if (anec?.note) {
      sentences.push(`${anec.voucher.name} put it simply: “${anec.note}”`);
      parts.push({ kind: 'anecdote', text: anec.note });
    }
  } else if (story.direct) {
    const reason = story.directLink?.tie.reason ? ` ${story.directLink.tie.reason}` : '';
    sentences.push(`You already know ${name} yourself — the strongest link Kiki can show you.${reason}`);
  } else if (story.reachable) {
    const via = story.inviter ? ` ${story.inviter.member.name} invited them in, ${story.inviter.degrees} steps from you.` : '';
    sentences.push(`Nobody you know has met ${name} yet.${via} Here's everything we do have — and we won't dress up what we don't.`);
  } else {
    sentences.push(`${name} is new to your circle. Here's everything we have, and what we can't answer.`);
  }

  const anxieties: Anxiety[] = [
    { key: 'who', label: 'Who they are', covered: story.overlaps.length > 0 || story.direct },
    { key: 'home', label: 'How they treat a home', covered: !!anec || (story.guestTrackRecord?.length ?? 0) > 0 },
    { key: 'accountable', label: 'Someone accountable', covered: story.channels.length > 0 || story.direct },
    { key: 'familiar', label: 'Shared ground', covered: story.overlaps.length > 0 },
  ];

  return {
    greeting: `${name} hopes to stay in your place.`,
    spotlight: story.overlaps.length ? spotlightOf(story.overlaps[0]) : null,
    paragraph: sentences.join(' '),
    parts,
    anxieties,
  };
}

/**
 * The exact prompt you'd send a tone-trained model to generate this same intro with real nuance.
 * Kept here so the demo can show "deterministic today, this prompt drops the real model in
 * tomorrow" — the model would be fine-tuned on Kiki's 10,000 Instagram conversations for voice.
 */
export function mutualFriendPrompt(story: TrustStory): string {
  const facts = {
    host: story.host.name,
    overlaps: story.overlaps.map((o) => ({ kind: o.kind, fact: o.label, howWeKnow: o.provenance, foundIn: o.source ?? 'profile' })),
    mutuals: story.channels.map((c) => ({ name: c.voucher.name, leftANote: !!c.note })),
    directlyKnown: story.direct,
    invitedBy: story.inviter?.member.name ?? null,
  };
  return [
    'You are a warm mutual friend introducing two people so a host feels safe letting a guest stay.',
    'Write ONE short paragraph, second person, addressed to the host. Lead with what they share,',
    'then the mutuals who can vouch, then a concrete trust anecdote. Never invent facts. If evidence',
    'is thin, say so plainly — honesty builds more trust than polish. Match the voice of a close',
    'friend texting, not a marketplace.',
    '',
    `FACTS (only use these):\n${JSON.stringify(facts, null, 2)}`,
    // vouch notes are written by members: fenced as data, never as instructions
    `The person being introduced is ${story.host.name}. Name them. Nobody else mentioned below is being introduced.`,
    // a note can mention a third person ("She put Iris up for a week"): say so, or the model introduces Iris
    ...story.channels.filter((c) => !!c.note?.trim()).map((c) => dataBlock(
      `vouch note from ${c.voucher.name} about ${story.host.name}${c.noteSubject ? `. It mentions ${c.noteSubject}, who is a different person from ${story.host.name}` : ''}`,
      c.note ?? '',
    )),
    DATA_RULE,
  ].join('\n');
}
