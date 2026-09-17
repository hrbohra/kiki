// "Kiki has your back" — onboarding card 4 of 4 (17 Sep handoff). Three costs, then three covers,
// so the contract reads as one thing. The structure ships; the sentences are Kiki's to state, so
// every string lives here and nowhere else. No shield icon, no "protection", no insurer voice:
// every sentence names who does what.

export const COVERS = {
  eyebrow: 'AND WHAT KIKI CARRIES',
  title: 'Three things you’ll never have to sort out yourself.',
  sub: 'You just read what joining costs you. This is the other side of it.',
  items: [
    {
      title: 'If rent isn’t paid, Kiki pays it.',
      body: 'You get the money on the date you were told. We sort it out with the guest afterwards, not you.',
    },
    {
      title: 'If something breaks, Kiki handles it.',
      body: 'One message to us with a photo. We arrange the fix or the replacement and settle up with whoever’s responsible.',
    },
    {
      title: 'If someone’s out of line, it follows them.',
      body: 'Tell us. It goes on their record, the person who vouched for them hears about it, and they don’t stay in the club.',
    },
  ],
  footnote: 'This is why the door can stay open to someone you haven’t met. It isn’t in a terms page either.',
  /** One line reused on the match moment: the promise that makes the yes possible. */
  matchLine: 'You do nothing.',
} as const;
