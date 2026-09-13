// Richer, human profile detail for the six hosts — bios, "good to know" facts, and room detail.
// Synthetic but coherent with each member's traits and area (same convention as the placeholder
// avatars and CC listing photos). Keeps the core Member/Listing types lean; the person view reads
// this for the Profile and Room tabs.

export interface ProfileDetail {
  bio: string;
  memberSince: string;
  languages: string[];
  responds: string;
  roomDescription: string;
  amenities: string[];
  houseNotes: string;
}

const DETAILS: Record<string, ProfileDetail> = {
  emma: {
    bio: 'Moved to London from Mount Eden two years ago and hasn’t looked back. Product designer by day, happiest on a bouldering wall or hunting down the quietest café to work from. Away most of September for a wedding back home — which is exactly why the room is free.',
    memberSince: 'July 2025',
    languages: ['English', 'a little French'],
    responds: 'Usually within a day',
    roomDescription: 'A calm double in a Victorian conversion, five minutes from the canal. Big bookshelf, a proper desk by the window, and a kitchen you’re welcome to treat as your own. The building is quiet — mostly long-term neighbours who keep to themselves.',
    amenities: ['Fast Wi-Fi', 'Desk + monitor', 'Full kitchen', 'Washing machine', 'Near Overground', 'Step-free entry'],
    houseNotes: 'No parties, and I’d love the plants watered twice a week. Nina will tell you I’m easy to deal with.',
  },
  danica: {
    bio: 'Sydney transplant, four years in Tooting now. Runs a small ceramics studio at weekends and the flat is full of the results. Travels light and often, so the place is free more than most.',
    memberSince: 'February 2026',
    languages: ['English'],
    responds: 'Usually the same day',
    roomDescription: 'A bright room in a garden flat with a proper south-facing patio. Pet-friendly — there’s a very calm cat, Miso, who mostly ignores guests.',
    amenities: ['Garden / patio', 'Pet-friendly', 'Fast Wi-Fi', 'Full kitchen', 'Quiet street'],
    houseNotes: 'Miso stays — if you’re allergic this isn’t the one. Otherwise make yourself at home.',
  },
  katelin: {
    bio: 'Grew up in Sydney, studied in Paris, landed in Finsbury Park for the parks and the tube. Works hybrid in fashion and is away for shoots a week or two most months.',
    memberSince: 'November 2025',
    languages: ['English', 'French'],
    responds: 'Within a day',
    roomDescription: 'An airy room in a top-floor flat with a balcony over the rooftops. Two minutes from the station, ten from the park.',
    amenities: ['Balcony', 'Near tube', 'Fast Wi-Fi', 'Full kitchen', 'Long stays welcome'],
    houseNotes: 'Bins go out Tuesday. That’s about the only rule.',
  },
  nate: {
    bio: 'Kiwi, in Hackney long enough to have firm opinions about the best flat white. The whole place is yours when he’s away climbing or back home.',
    memberSince: 'September 2025',
    languages: ['English'],
    responds: 'Usually within a day',
    roomDescription: 'A whole one-bed with a wood-clad living room and a small balcony. Set up for working from home — standing desk, a good chair, and fibre.',
    amenities: ['Whole place', 'Balcony', 'WFH desk', 'Fast Wi-Fi', 'Long stays welcome'],
    houseNotes: 'It’s the whole flat, so treat it like your own. The neighbours are lovely and light sleepers.',
  },
  ollie: {
    bio: 'Peckham through and through now, though originally from up the road in Auckland. Musician — the whole place has a little home studio you’re welcome to leave well alone.',
    memberSince: 'January 2026',
    languages: ['English'],
    responds: 'Within a couple of days',
    roomDescription: 'A whole warehouse-conversion flat with exposed beams and a lot of light. A record collection you can browse and a kitchen built for actual cooking.',
    amenities: ['Whole place', 'Fast Wi-Fi', 'Full kitchen', 'Record player', 'Long stays welcome'],
    houseNotes: 'The studio gear is off-limits; everything else is fair game.',
  },
  priya: {
    bio: 'Londoner, Bermondsey by the river. Newer to Kiki and still building a record here — the guest side is honestly thin, and showing that plainly is rather the point.',
    memberSince: 'November 2025',
    languages: ['English', 'Hindi'],
    responds: 'Within a day',
    roomDescription: 'A room in a modern flat a short walk from the Thames path. Simple, tidy, and close to everything on the Jubilee line.',
    amenities: ['Near tube', 'Fast Wi-Fi', 'Full kitchen', 'Riverside walks'],
    houseNotes: 'Quiet building — please keep evenings calm.',
  },
};

/** Rich profile detail for a host, with an honest fallback for anyone unfixtured. */
export function profileDetail(memberId: string, area?: string): ProfileDetail {
  return (
    DETAILS[memberId] ?? {
      bio: area ? `A Kiki member around ${area}.` : 'A Kiki member.',
      memberSince: '—',
      languages: ['English'],
      responds: 'Usually within a day',
      roomDescription: area ? `A place to stay around ${area}.` : 'A place to stay.',
      amenities: ['Fast Wi-Fi', 'Full kitchen'],
      houseNotes: 'Treat it like your own.',
    }
  );
}
