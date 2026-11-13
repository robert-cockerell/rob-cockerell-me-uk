// Turns a tester console form post into one operation. Login and logout are
// handled by the page itself.

import { RESERVATION_SETS, type ReservationSet } from './fixtures.ts';
import {
	addCheckIn,
	applyEvent,
	applyOverride,
	applyReset,
	isOverrideId,
	isResetId,
	loadReservationSet,
	setDemoClock,
	setDemoClockPreset,
	setDemoClockRunning,
	setResourceStatus,
	type OperationDeps,
	type OperationReport,
} from './operations.ts';
import { RESOURCE_STATUSES, type ResourceStatus } from './types.ts';

function refused(message: string): OperationReport {
	return { ok: false, done: [], skipped: [message] };
}

function field(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value.trim() : '';
}

export async function runConsoleAction(form: FormData, deps: OperationDeps): Promise<OperationReport> {
	const action = field(form, 'action');
	const running = field(form, 'running') === 'on';

	switch (action) {
		case 'clock': {
			const date = field(form, 'date');
			const time = field(form, 'time');
			if (!date || !time) return refused('Give a date and a time');
			return setDemoClock(deps, `${date} ${time}`, running);
		}
		case 'clock-preset': {
			const order = Number(field(form, 'order'));
			if (!Number.isInteger(order)) return refused('Pick a clock setting');
			return setDemoClockPreset(deps, order, running);
		}
		case 'clock-hold':
			return setDemoClockRunning(deps, false);
		case 'clock-run':
			return setDemoClockRunning(deps, true);
		case 'reset': {
			const id = field(form, 'id');
			if (isResetId(id)) return applyReset(deps, id);
			if (isOverrideId(id)) return applyOverride(deps, id);
			return refused(`No reset or override ${id}`);
		}
		case 'event':
			return applyEvent(deps, field(form, 'id'));
		case 'status': {
			const resourceId = Number(field(form, 'resourceId'));
			const status = field(form, 'status') as ResourceStatus;
			if (!Number.isInteger(resourceId)) return refused('Pick a resource');
			if (!RESOURCE_STATUSES.includes(status)) return refused('Pick a status');
			return setResourceStatus(deps, resourceId, status);
		}
		case 'checkin': {
			const ref = field(form, 'reservation');
			if (!ref) return refused('Pick a reservation');
			const date = field(form, 'date');
			const time = field(form, 'time');
			if ((date === '') !== (time === '')) return refused('Give both a date and a time, or neither for now');
			return addCheckIn(deps, ref, date ? `${date} ${time}` : null);
		}
		case 'reservation-set': {
			const set = field(form, 'set') as ReservationSet;
			if (!RESERVATION_SETS.includes(set)) return refused('Pick a reservation set');
			return loadReservationSet(deps, set);
		}
		default:
			return refused(`Unknown action "${action}"`);
	}
}
