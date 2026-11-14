// The D2 and D3 fixture files, bundled by Vite. Imported only under Vite (texts.ts).

import batteries from '../../../test-data/batteries.csv?raw';
import batteryTypes from '../../../test-data/battery-types.csv?raw';
import bikes from '../../../test-data/bikes.csv?raw';
import entries from '../../../test-data/entries.csv?raw';
import fittings from '../../../test-data/fittings.csv?raw';
import type { PlannerFixtureTexts } from './planner-fixtures.ts';

export const plannerFixtureTexts: PlannerFixtureTexts = { batteryTypes, bikes, batteries, fittings, entries };
