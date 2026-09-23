// The house list: what a host asks of whoever stays, in three sections that mean different things.
//
//   rule   what the host needs ("No parties"). Read before asking; not negotiable.
//   love   what the host would appreciate ("A cuddle for Miso most evenings"). Kindness, not terms.
//   care   what the guest would be looking after ("Feed Miso morning and evening"). A commitment:
//          a guest agrees to each one when they ask to stay, and the host sees that they did.
//
// It sits beside the trust graph, never inside it: nothing here changes degrees, routes, tie
// weights or overlaps. It changes what two people have agreed to before a key changes hands.

export type HouseSection = 'rule' | 'love' | 'care';
/** Drives the glyph beside a line. Free text is the content; the kind is only a hint. */
export type HouseItemKind = 'pet' | 'plants' | 'post' | 'home' | 'quiet' | 'people';

export interface HouseItem {
  id: string;
  section: HouseSection;
  text: string;
  /** One line of detail under the text ("Tuesdays and Fridays"). */
  detail?: string;
  kind?: HouseItemKind;
}

export interface HouseListView {
  rules: HouseItem[];
  love: HouseItem[];
  care: HouseItem[];
}

export const HOUSE_SECTION_LABEL: Record<HouseSection, { title: string; hint: string }> = {
  rule: { title: 'House rules', hint: 'What the host needs. Read these before you ask.' },
  love: { title: 'They’d love it if you', hint: 'Not conditions. The small things that make a stay easy to say yes to again.' },
  care: { title: 'You’d be looking after', hint: 'You agree to each of these when you ask to stay, and the host sees that you did.' },
};

export function houseListSections(items: HouseItem[]): HouseListView {
  return {
    rules: items.filter((i) => i.section === 'rule'),
    love: items.filter((i) => i.section === 'love'),
    care: items.filter((i) => i.section === 'care'),
  };
}

/**
 * A request must agree to every care item on the listing, and nothing that isn't one. Returns the
 * reason it fails, or null when it is valid. Used by the API to validate and by the app to enable
 * the send button, so the two can never disagree.
 */
export function commitmentsProblem(items: HouseItem[], agreed: string[]): string | null {
  const care = items.filter((i) => i.section === 'care').map((i) => i.id);
  const unknown = agreed.filter((id) => !care.includes(id));
  if (unknown.length) return 'That is not something this host asked you to look after.';
  const missing = care.filter((id) => !agreed.includes(id));
  if (missing.length) return missing.length === 1 ? 'Agree to the one thing you’d be looking after first.' : missing.length === 2 ? 'Agree to both things you’d be looking after first.' : `Agree to all ${missing.length} things you’d be looking after first.`;
  return null;
}

/** "the plants and Miso" — how a host's Requests card names what a guest agreed to. */
export function commitmentSummary(items: HouseItem[], agreed: string[]): string {
  const texts = items.filter((i) => i.section === 'care' && agreed.includes(i.id)).map((i) => i.text.replace(/\.$/, ''));
  if (texts.length === 0) return '';
  if (texts.length === 1) return texts[0];
  return `${texts.slice(0, -1).join(', ')} and ${texts[texts.length - 1].charAt(0).toLowerCase()}${texts[texts.length - 1].slice(1)}`;
}

const L = (listingId: string, items: Omit<HouseItem, 'id'>[]): HouseItem[] =>
  items.map((it, i) => ({ ...it, id: `${listingId}:${it.section}:${i + 1}` }));

/** The seeded demo world's house lists, by listing. Real hosts write their own (listings.setHouseList). */
export const HOUSE_LISTS: Record<string, HouseItem[]> = {
  'l-emma': L('l-emma', [
    { section: 'rule', text: 'No parties or overnight visitors', kind: 'home' },
    { section: 'rule', text: 'Quiet after ten', detail: 'Long-term neighbours who keep to themselves', kind: 'quiet' },
    { section: 'love', text: 'Open the windows on sunny mornings', kind: 'home' },
    { section: 'love', text: 'A line in the guest book when you leave', kind: 'people' },
    { section: 'care', text: 'Water the plants twice a week', detail: 'Tuesdays and Fridays; the big fern likes a mist', kind: 'plants' },
  ]),
  'l-danica': L('l-danica', [
    { section: 'rule', text: 'Miso stays', detail: 'If you are allergic to cats, this isn’t the one', kind: 'pet' },
    { section: 'rule', text: 'Keep the garden gate shut', detail: 'Miso wanders', kind: 'pet' },
    { section: 'love', text: 'A cuddle for Miso most evenings', kind: 'pet' },
    { section: 'care', text: 'Feed Miso morning and evening', detail: 'Half a pouch each time; biscuits are already in the bowl', kind: 'pet' },
    { section: 'care', text: 'Fresh water and a clean litter tray daily', kind: 'pet' },
  ]),
  'l-katelin': L('l-katelin', [
    { section: 'rule', text: 'Bins go out on Tuesday night', kind: 'home' },
    { section: 'love', text: 'Use the balcony', detail: 'Just shut the door if it rains', kind: 'home' },
    { section: 'care', text: 'Bring the post in', detail: 'Leave it on the hall table', kind: 'post' },
  ]),
  'l-nate': L('l-nate', [
    { section: 'rule', text: 'No smoking, balcony included', kind: 'home' },
    { section: 'rule', text: 'Quiet after eleven', detail: 'The neighbours are lovely and light sleepers', kind: 'quiet' },
    { section: 'love', text: 'Treat it like your own', kind: 'home' },
    { section: 'care', text: 'Water the balcony herbs every other day', kind: 'plants' },
  ]),
  'l-ollie': L('l-ollie', [
    { section: 'rule', text: 'The studio gear is off-limits', detail: 'Everything else is fair game', kind: 'home' },
    { section: 'love', text: 'Play the records', detail: 'Back in their sleeves when you’re done', kind: 'home' },
  ]),
  'l-priya': L('l-priya', [
    { section: 'rule', text: 'Female guests only', kind: 'people' },
    { section: 'rule', text: 'Calm evenings', detail: 'It is a quiet building', kind: 'quiet' },
    { section: 'love', text: 'Leave it as you found it', kind: 'home' },
    { section: 'care', text: 'Collect parcels from the front desk', detail: 'A couple usually arrive each week', kind: 'post' },
  ]),
  'l-you': L('l-you', [
    { section: 'rule', text: 'No parties', kind: 'home' },
    { section: 'love', text: 'Leave the plants happier than you found them', kind: 'plants' },
    { section: 'care', text: 'Water the monstera once a week', kind: 'plants' },
  ]),
};

/** The bundled list for a listing, painted before the API answers (and offline). */
export function bundledHouseList(listingId: string): HouseItem[] {
  return HOUSE_LISTS[listingId] ?? [];
}
