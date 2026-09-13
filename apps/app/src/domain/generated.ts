// Baked, Gemini-written content produced offline by pipeline/enrich.ts (see that file).
// Imported at build time so the demo ships rich, varied content with no runtime key or network.
import data from './generated.json';

interface Generated {
  model: string;
  generatedAt: string;
  intros: Record<string, string>;
  bios: Record<string, string>;
  guestBook: Record<string, string[]>;
}

const g = data as Generated;

/** The pre-generated mutual-friend intro for a host, if the pipeline has been run. */
export const bakedIntro = (hostId: string): string | undefined => g.intros?.[hostId] || undefined;
export const bakedBio = (hostId: string): string | undefined => g.bios?.[hostId] || undefined;
export const bakedGuestBook = (hostId: string): string[] => g.guestBook?.[hostId] ?? [];
export const generatedMeta = { model: g.model, at: g.generatedAt };
