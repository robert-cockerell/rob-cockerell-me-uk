// The planner's addresses, under /demos/charging-planner/ (DEC-47).

export const BASE = '/demos/charging-planner';

const seg = encodeURIComponent;

export const routes = {
	dayPlan: `${BASE}/`,
	fleet: `${BASE}/fleet/`,
	fleetBatteries: `${BASE}/fleet/batteries/`,
	fleetBatteryTypes: `${BASE}/fleet/battery-types/`,
	namePicker: `${BASE}/name/`,
	namePickerFrom: (returnTo: string) => `${BASE}/name/?return=${seg(returnTo)}`,
	demoClock: `${BASE}/demo-clock/`,
	favicon: `${BASE}/favicon.svg`,

	bike: (tag: string) => `${BASE}/fleet/bikes/${seg(tag)}/`,
	newBike: `${BASE}/fleet/bikes/new/`,
	editBike: (tag: string) => `${BASE}/fleet/bikes/${seg(tag)}/edit/`,
	swap: (tag: string) => `${BASE}/fleet/bikes/${seg(tag)}/swap/`,
	removeFromBike: (tag: string) => `${BASE}/fleet/bikes/${seg(tag)}/remove/`,

	battery: (tag: string) => `${BASE}/fleet/batteries/${seg(tag)}/`,
	newBattery: `${BASE}/fleet/batteries/new/`,
	editBattery: (tag: string) => `${BASE}/fleet/batteries/${seg(tag)}/edit/`,
	fitBattery: (tag: string) => `${BASE}/fleet/batteries/${seg(tag)}/fit/`,
	removeBattery: (tag: string) => `${BASE}/fleet/batteries/${seg(tag)}/remove/`,

	batteryType: (name: string) => `${BASE}/fleet/battery-types/${seg(name)}/`,
	newBatteryType: `${BASE}/fleet/battery-types/new/`,
	editBatteryType: (name: string) => `${BASE}/fleet/battery-types/${seg(name)}/edit/`,

	/** Entries on a bike or a battery: fault, check, dealer-service. */
	entry: (asset: 'bikes' | 'batteries', tag: string, kind: 'fault' | 'check' | 'dealer-service') =>
		`${BASE}/fleet/${asset}/${seg(tag)}/${kind}/`,
	clearFault: (entryId: number) => `${BASE}/fleet/faults/${entryId}/clear/`,
};

/** Only planner paths are accepted as a place to go back to. */
export function safeReturn(path: string | null | undefined): string {
	return path && path.startsWith(`${BASE}/`) && !path.startsWith('//') ? path : routes.dayPlan;
}
