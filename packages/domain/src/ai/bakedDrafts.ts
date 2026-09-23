// Prepared drafts for every cold-state card the demo can show, written ahead of time from the same
// facts the live task receives (see scripts/list-draft-facts.ts). They are the "baked" rung of the
// AI ladder: when the live model is out of quota, slow or rejected by the guard, a visitor still
// gets a considered message, not only the plain template. Each one is checked by the same guard as
// the live model's answer (__tests__/bakedDrafts.test.ts), so a prepared draft can never say more
// than the graph can prove.
//
// Keyed `${recipientId}:${kind}:${writerAs}`. Written for the demo viewer and the cold-state ask of
// two weeks (the only stay length the cold card offers); any other shape falls through to compose.

import type { DraftAs, DraftKind } from './drafts';

const DEMO_NIGHTS = 14;

const BAKED: Record<string, string> = {
  // ── Katelin: two steps, through Amy, who invited her. Paris 2017, both work from home. ──
  'katelin:introduce:host': 'Hi Katelin. Kiki tells me we both studied in Paris in 2017, and that we both work from home, so we might have more in common than a two-week stay. Nobody I know has met you yet, though I can see Amy brought you into Kiki, which helps. What brings you to London, and what would a normal day look like while you’re here?',
  'katelin:call:host': 'Hi Katelin. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'katelin:shorter:host': 'Hi Katelin. I’d like to make this work. Since nobody I know has met you yet, I’d be more comfortable starting with 1 week rather than the full two. If that goes well, which I expect it will, we can talk about the rest. Would that fit your plans?',
  'katelin:introduce:guest': 'Hi Katelin. Kiki tells me we both studied in Paris in 2017 and both work from home, which feels like a good place to start. We don’t know anyone in common yet, so I wanted to introduce myself properly before asking for two weeks at yours. What would you want to know about a guest?',
  'katelin:call:guest': 'Hi Katelin. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty, and I’m free most evenings this week or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'katelin:shorter:guest': 'Hi Katelin. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well we can talk about the rest.',

  // ── Ollie: three steps, through Amy; Katelin invited him. Both mention New Zealand. ──
  'ollie:introduce:host': 'Hi Ollie. Kiki tells me we both mention New Zealand, which is a nice thing to find this far from home. Nobody I know has met you yet, so before I say yes to two weeks at mine I’d like to know you a little. I can see Katelin brought you into Kiki. What brings you to London, and what would your days look like here?',
  'ollie:call:host': 'Hi Ollie. Before I say yes to two weeks at mine, could we have a quick call? Ten minutes is plenty. Most evenings this week work for me, or the weekend if that suits you better. It’s just nice to hear a voice before handing over keys.',
  'ollie:shorter:host': 'Hi Ollie. I’d like to make this work. We’re three steps apart and nobody I know has met you yet, so I’d be more comfortable starting with 1 week instead of two. If it goes well, we can talk about the rest. Would that fit your plans?',
  'ollie:introduce:guest': 'Hi Ollie. Kiki tells me we both mention New Zealand, so I suspect we’d get on. We don’t know anyone in common yet, which is why I wanted to introduce myself properly before asking about two weeks at yours. Is there anything you’d want to know about me first?',
  'ollie:call:guest': 'Hi Ollie. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m around most evenings this week, or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'ollie:shorter:guest': 'Hi Ollie. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot to say yes to. Would 1 week work as a start? If it goes well, we can talk about the rest.',

  // ── Nate: two steps, through Nina, who invited him. Mount Eden, design, climbing. ──
  'nate:introduce:host': 'Hi Nate. Kiki tells me we both moved to London from Mount Eden, and that we both mention design and climbing, which is a lot of overlap for two strangers. Nobody I know has met you yet, though I can see Nina brought you into Kiki. What brings you to London this time, and what would your two weeks look like?',
  'nate:call:host': 'Hi Nate. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'nate:shorter:host': 'Hi Nate. I’d like to make this work. Nobody I know has met you yet, so I’d be more comfortable starting with 1 week rather than two. If it goes well, which I expect it will, we can talk about the rest. Would that fit your plans?',
  'nate:introduce:guest': 'Hi Nate. Kiki tells me we both moved to London from Mount Eden, and we both mention design and climbing. We don’t know anyone in common yet, so I wanted to introduce myself properly before asking about two weeks at yours. What would you want to know about a guest?',
  'nate:call:guest': 'Hi Nate. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m free most evenings this week, or the weekend if that works better. It’s easier to say yes to a voice than to a profile.',
  'nate:shorter:guest': 'Hi Nate. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start instead? If it goes well we can talk about the rest.',

  // ── Priya: three steps, through Amy; Katelin invited her. Two past hosts wrote well of her. ──
  'priya:introduce:host': 'Hi Priya. Nobody I know has met you yet, so before I say yes to two weeks at mine I’d like to know you a little. I can see Katelin brought you into Kiki, and that two past hosts, Daniel and Maya, wrote kindly about you as a guest, which helps a lot. What brings you to London, and what would your days look like while you’re here?',
  'priya:call:host': 'Hi Priya. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. Your guest book reads well; it’s just nice to hear a voice before handing over keys.',
  'priya:shorter:host': 'Hi Priya. I’d like to make this work, and what Daniel and Maya wrote about you as a guest helps. Since nobody I know has met you yet, I’d be more comfortable starting with 1 week rather than two. If it goes well, we can talk about the rest. Would that fit your plans?',
  'priya:introduce:guest': 'Hi Priya. We don’t know anyone in common yet, so I wanted to introduce myself properly before asking about two weeks at yours. I’d love to hear what matters to you in a guest. Is there anything you’d want to know about me first?',
  'priya:call:guest': 'Hi Priya. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m around most evenings this week, or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'priya:shorter:guest': 'Hi Priya. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well, we can talk about the rest.',

  // ── Theo: two steps, through Sophie, who invited him. Both boulder at Blok Shoreditch. ──
  'theo:introduce:host': 'Hi Theo. Kiki tells me we’re both into bouldering at Blok Shoreditch, so we may have already crossed paths on the wall. Nobody I know has met you yet, though I can see Sophie brought you into Kiki. What brings you to London, and what would your two weeks look like?',
  'theo:call:host': 'Hi Theo. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'theo:shorter:host': 'Hi Theo. I’d like to make this work. Nobody I know has met you yet, so I’d be more comfortable starting with 1 week rather than two. If it goes well, we can talk about the rest. Would that fit your plans?',
  'theo:introduce:guest': 'Hi Theo. Kiki tells me we’re both into bouldering at Blok Shoreditch, which seems like a good start. We don’t know anyone in common yet, so I wanted to introduce myself properly before asking about two weeks at yours. What would you want to know about a guest?',
  'theo:call:guest': 'Hi Theo. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty, and I’m free most evenings this week or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'theo:shorter:guest': 'Hi Theo. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well we can talk about the rest.',

  // ── Lena: two steps, through Amy, who invited her. No shared ground on file. ──
  'lena:introduce:host': 'Hi Lena. Nobody I know has met you yet, so before I say yes to two weeks at mine I’d like to know you a little. I can see Amy brought you into Kiki, which helps. What brings you to London, and what would your days look like while you’re here?',
  'lena:call:host': 'Hi Lena. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'lena:shorter:host': 'Hi Lena. I’d like to make this work. Nobody I know has met you yet, so I’d be more comfortable starting with 1 week rather than two. If it goes well, which I expect it will, we can talk about the rest. Would that fit your plans?',
  'lena:introduce:guest': 'Hi Lena. We don’t know anyone in common yet, so I wanted to introduce myself properly before asking about two weeks at yours. Happy to tell you anything that would help you decide. What would you want to know about a guest?',
  'lena:call:guest': 'Hi Lena. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m around most evenings this week, or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'lena:shorter:guest': 'Hi Lena. We don’t know anyone in common yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well, we can talk about the rest.',

  // ── Daniel and Maya: not yet connected to the viewer at all. Nothing to lean on but honesty. ──
  'daniel:introduce:host': 'Hi Daniel. We’re not connected through anyone on Kiki yet, so before I say yes to two weeks at mine I’d like to know you a little. What brings you to London, and what would your days look like while you’re here?',
  'daniel:call:host': 'Hi Daniel. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'daniel:shorter:host': 'Hi Daniel. I’d like to make this work. Since we’re not connected through anyone yet, I’d be more comfortable starting with 1 week rather than two. If it goes well, we can talk about the rest. Would that fit your plans?',
  'daniel:introduce:guest': 'Hi Daniel. We’re not connected through anyone on Kiki yet, so I wanted to introduce myself properly before asking about two weeks at yours. Happy to answer anything that would help you decide. What would you want to know about a guest?',
  'daniel:call:guest': 'Hi Daniel. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m around most evenings this week, or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'daniel:shorter:guest': 'Hi Daniel. We’re not connected through anyone yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well, we can talk about the rest.',
  'maya:introduce:host': 'Hi Maya. We’re not connected through anyone on Kiki yet, so before I say yes to two weeks at mine I’d like to know you a little. What brings you to London, and what would your days look like while you’re here?',
  'maya:call:host': 'Hi Maya. Before I say yes to two weeks at mine, could we do a quick call? Ten minutes is plenty. I’m around most evenings this week, or at the weekend if that’s easier. It’s just nice to hear a voice before handing over keys.',
  'maya:shorter:host': 'Hi Maya. I’d like to make this work. Since we’re not connected through anyone yet, I’d be more comfortable starting with 1 week rather than two. If it goes well, we can talk about the rest. Would that fit your plans?',
  'maya:introduce:guest': 'Hi Maya. We’re not connected through anyone on Kiki yet, so I wanted to introduce myself properly before asking about two weeks at yours. Happy to answer anything that would help you decide. What would you want to know about a guest?',
  'maya:call:guest': 'Hi Maya. Before you decide about two weeks at yours, would a quick call help? Ten minutes is plenty. I’m around most evenings this week, or at the weekend. It’s easier to say yes to a voice than to a profile.',
  'maya:shorter:guest': 'Hi Maya. We’re not connected through anyone yet, so I’d understand if two weeks feels like a lot. Would 1 week work as a start? If it goes well, we can talk about the rest.',
};

/** The prepared draft for this card, or undefined when the shape is not one the demo shows. */
export function bakedDraft(recipientId: string, kind: DraftKind, as: DraftAs, nights?: number): string | undefined {
  if (nights !== undefined && nights !== DEMO_NIGHTS) return undefined;
  return BAKED[`${recipientId}:${kind}:${as}`];
}

/** Every key, for the test that runs each one through its task's guard. */
export const BAKED_DRAFT_KEYS = Object.keys(BAKED);
