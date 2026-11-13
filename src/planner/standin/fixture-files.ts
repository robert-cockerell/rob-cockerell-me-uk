// The fixture files, bundled into the server build so the console can reset
// on Vercel, where test-data/ isn't on disk. Astro (Vite) only: the command
// line reads the same files from disk (cli/reset.ts).

import clock from '../../../test-data/demo-clock.csv?raw';
import events from '../../../test-data/stand-in-events.csv?raw';
import forecasts from '../../../test-data/forecasts.csv?raw';
import reservations from '../../../test-data/lb-reservations.csv?raw';
import resources from '../../../test-data/lb-resources.csv?raw';
import resets from '../../../test-data/resets-and-overrides.csv?raw';
import type { FixtureTexts } from './fixtures.ts';

export const fixtureTexts: FixtureTexts = { resources, reservations, events, resets, clock, forecasts };
