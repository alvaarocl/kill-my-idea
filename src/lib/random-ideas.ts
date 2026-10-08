export const RANDOM_IDEAS = [
  "An AI that writes passive-aggressive replies to your landlord's emails, legally optimized to avoid eviction while maximizing guilt.",
  "A subscription app that sends you a brutally honest daily performance review of your life — diet, sleep, screen time, social life — written by a fictional disappointed dad.",
  "Uber for therapists: on-demand 15-minute emotional emergency sessions with licensed therapists, available in under 5 minutes, priced like a coffee.",
  "A Chrome extension that blocks LinkedIn but shows you a real-time counter of how many hours you've saved not reading humble-brags.",
  "A B2B SaaS that automatically detects when a software team is burning out by analyzing git commit times, meeting density and Slack sentiment, then alerts managers.",
  "A marketplace where indie game developers sell their abandoned game prototypes and half-built engines to other developers at a fraction of the original cost.",
  "An app that scans your wardrobe via phone camera and tells you which items you haven't worn in 6+ months, then auto-lists them on Vinted/Wallapop.",
  "A dating app exclusively for people who've been through a startup failure — matching based on what they learned, not what they built.",
] as const;

export function pickRandomIdea(): string {
  return RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];
}
