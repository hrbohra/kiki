// @kiki/voice — turns Kiki's ~10k-conversation corpus into the LLM's voice via Voiceprint (offline),
// and loads the result here. Voice/style ONLY; never content, matching, or ranking. See VOICE_PIPELINE.md.
export * from './types';
export * from './corpus-voice.provider';
export * from './pipeline';
export * from './voiceprint';
export { features as voiceFeatures, scoreVoice, type VoiceprintModel } from './voiceprint-scorer';
