// D2 and D3 reads and writes (processes 3.1 to 3.4). No delete anywhere
// (ASM-10, AC-06.5). Fittings and entries are inserted, never changed, except
// clearing a fault (BR-07); the database enforces the same rule.

import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '../db/client.ts';
import type { Battery, BatteryType, Bike, Entry, EntryType, Fitting } from './types.ts';

export interface FleetRepo {
	listBikes(): Promise<Bike[]>;
	getBike(tag: string): Promise<Bike | null>;
	listBatteries(): Promise<Battery[]>;
	getBattery(tag: string): Promise<Battery | null>;
	listBatteryTypes(): Promise<BatteryType[]>;
	getBatteryType(name: string): Promise<BatteryType | null>;
	listFittings(): Promise<Fitting[]>;
	listEntries(asset: { bike: string } | { battery: string }): Promise<Entry[]>;
	listOpenFaults(): Promise<Entry[]>;
	getEntry(id: number): Promise<Entry | null>;

	insertBike(bike: Bike): Promise<void>;
	updateBike(tag: string, bike: Omit<Bike, 'bikeAssetTag'>): Promise<void>;
	insertBattery(battery: Battery): Promise<void>;
	updateBattery(tag: string, battery: Omit<Battery, 'batteryAssetTag'>): Promise<void>;
	insertBatteryType(type: BatteryType): Promise<void>;
	updateBatteryType(name: string, type: BatteryType): Promise<void>;
	insertFitting(fitting: Fitting): Promise<void>;
	insertEntry(entry: Omit<Entry, 'entryId' | 'clearedDate' | 'clearedBy'>): Promise<number>;
	/** Clears an open fault; false if it was already cleared. */
	clearFault(entryId: number, clearedDate: string, clearedBy: string): Promise<boolean>;
}

// ------------------------------------------------------------- row mapping

interface BikeRow {
	bike_asset_tag: string;
	librebooking_resource_id: number;
	make: string;
	model: string;
	frame_size: string | null;
	bike_serial_number: string | null;
	bike_purchase_date: string | null;
	last_updated_by: string;
	last_updated_at: string;
}
interface BatteryRow {
	battery_asset_tag: string;
	battery_type: string;
	bosch_serial: string | null;
	battery_purchase_date: string | null;
	cycle_count: number | null;
	last_updated_by: string;
	last_updated_at: string;
}
interface FittingRow {
	battery_asset_tag: string;
	fitted_from: string;
	bike_asset_tag: string | null;
	recorded_by: string;
	recorded_at: string;
}
interface EntryRow {
	entry_id: number | string;
	entry_type: EntryType;
	entry_date: string;
	bike_asset_tag: string | null;
	battery_asset_tag: string | null;
	description: string;
	recorded_by: string;
	recorded_at: string;
	cleared_date: string | null;
	cleared_by: string | null;
}

const bikeFrom = (r: BikeRow): Bike => ({
	bikeAssetTag: r.bike_asset_tag,
	librebookingResourceId: r.librebooking_resource_id,
	make: r.make,
	model: r.model,
	frameSize: r.frame_size,
	bikeSerialNumber: r.bike_serial_number,
	bikePurchaseDate: r.bike_purchase_date,
	lastUpdatedBy: r.last_updated_by,
	lastUpdatedAt: new Date(r.last_updated_at),
});
const bikeTo = (b: Omit<Bike, 'bikeAssetTag'>) => ({
	librebooking_resource_id: b.librebookingResourceId,
	make: b.make,
	model: b.model,
	frame_size: b.frameSize,
	bike_serial_number: b.bikeSerialNumber,
	bike_purchase_date: b.bikePurchaseDate,
	last_updated_by: b.lastUpdatedBy,
	last_updated_at: b.lastUpdatedAt.toISOString(),
});
const batteryFrom = (r: BatteryRow): Battery => ({
	batteryAssetTag: r.battery_asset_tag,
	batteryType: r.battery_type,
	boschSerial: r.bosch_serial,
	batteryPurchaseDate: r.battery_purchase_date,
	cycleCount: r.cycle_count,
	lastUpdatedBy: r.last_updated_by,
	lastUpdatedAt: new Date(r.last_updated_at),
});
const batteryTo = (b: Omit<Battery, 'batteryAssetTag'>) => ({
	battery_type: b.batteryType,
	bosch_serial: b.boschSerial,
	battery_purchase_date: b.batteryPurchaseDate,
	cycle_count: b.cycleCount,
	last_updated_by: b.lastUpdatedBy,
	last_updated_at: b.lastUpdatedAt.toISOString(),
});
const fittingFrom = (r: FittingRow): Fitting => ({
	batteryAssetTag: r.battery_asset_tag,
	fittedFrom: new Date(r.fitted_from),
	bikeAssetTag: r.bike_asset_tag,
	recordedBy: r.recorded_by,
	recordedAt: new Date(r.recorded_at),
});
const entryFrom = (r: EntryRow): Entry => ({
	entryId: Number(r.entry_id),
	entryType: r.entry_type,
	entryDate: r.entry_date,
	bikeAssetTag: r.bike_asset_tag,
	batteryAssetTag: r.battery_asset_tag,
	description: r.description,
	recordedBy: r.recorded_by,
	recordedAt: new Date(r.recorded_at),
	clearedDate: r.cleared_date,
	clearedBy: r.cleared_by,
});

// ------------------------------------------------------------- Supabase

export function createFleetRepo(db: SupabaseClient): FleetRepo {
	return {
		async listBikes() {
			const { data, error } = await db.from('bikes').select('*').order('bike_asset_tag');
			check('Reading bikes', error);
			return (data as BikeRow[]).map(bikeFrom);
		},
		async getBike(tag) {
			const { data, error } = await db.from('bikes').select('*').eq('bike_asset_tag', tag).maybeSingle();
			check('Reading a bike', error);
			return data ? bikeFrom(data as BikeRow) : null;
		},
		async listBatteries() {
			const { data, error } = await db.from('batteries').select('*').order('battery_asset_tag');
			check('Reading batteries', error);
			return (data as BatteryRow[]).map(batteryFrom);
		},
		async getBattery(tag) {
			const { data, error } = await db.from('batteries').select('*').eq('battery_asset_tag', tag).maybeSingle();
			check('Reading a battery', error);
			return data ? batteryFrom(data as BatteryRow) : null;
		},
		async listBatteryTypes() {
			const { data, error } = await db.from('battery_types').select('*').order('battery_type');
			check('Reading battery types', error);
			return (data as { battery_type: string; capacity: number | null }[]).map((r) => ({
				batteryType: r.battery_type,
				capacity: r.capacity,
			}));
		},
		async getBatteryType(name) {
			const { data, error } = await db.from('battery_types').select('*').eq('battery_type', name).maybeSingle();
			check('Reading a battery type', error);
			return data ? { batteryType: data.battery_type, capacity: data.capacity } : null;
		},
		async listFittings() {
			const { data, error } = await db.from('fittings').select('*');
			check('Reading fittings', error);
			return (data as FittingRow[]).map(fittingFrom);
		},
		async listEntries(asset) {
			const column = 'bike' in asset ? 'bike_asset_tag' : 'battery_asset_tag';
			const value = 'bike' in asset ? asset.bike : asset.battery;
			const { data, error } = await db.from('entries').select('*').eq(column, value);
			check('Reading entries', error);
			return (data as EntryRow[]).map(entryFrom);
		},
		async listOpenFaults() {
			const { data, error } = await db.from('entries').select('*').eq('entry_type', 'fault').is('cleared_date', null);
			check('Reading open faults', error);
			return (data as EntryRow[]).map(entryFrom);
		},
		async getEntry(id) {
			const { data, error } = await db.from('entries').select('*').eq('entry_id', id).maybeSingle();
			check('Reading an entry', error);
			return data ? entryFrom(data as EntryRow) : null;
		},

		async insertBike(bike) {
			const { error } = await db.from('bikes').insert({ bike_asset_tag: bike.bikeAssetTag, ...bikeTo(bike) });
			check('Saving a bike', error);
		},
		async updateBike(tag, bike) {
			const { error } = await db.from('bikes').update(bikeTo(bike)).eq('bike_asset_tag', tag);
			check('Saving a bike', error);
		},
		async insertBattery(battery) {
			const { error } = await db.from('batteries').insert({ battery_asset_tag: battery.batteryAssetTag, ...batteryTo(battery) });
			check('Saving a battery', error);
		},
		async updateBattery(tag, battery) {
			const { error } = await db.from('batteries').update(batteryTo(battery)).eq('battery_asset_tag', tag);
			check('Saving a battery', error);
		},
		async insertBatteryType(type) {
			const { error } = await db.from('battery_types').insert({ battery_type: type.batteryType, capacity: type.capacity });
			check('Saving a battery type', error);
		},
		async updateBatteryType(name, type) {
			const { error } = await db
				.from('battery_types')
				.update({ battery_type: type.batteryType, capacity: type.capacity })
				.eq('battery_type', name);
			check('Saving a battery type', error);
		},
		async insertFitting(f) {
			const { error } = await db.from('fittings').insert({
				battery_asset_tag: f.batteryAssetTag,
				fitted_from: f.fittedFrom.toISOString(),
				bike_asset_tag: f.bikeAssetTag,
				recorded_by: f.recordedBy,
				recorded_at: f.recordedAt.toISOString(),
			});
			check('Saving a fitting', error);
		},
		async insertEntry(e) {
			const { data, error } = await db
				.from('entries')
				.insert({
					entry_type: e.entryType,
					entry_date: e.entryDate,
					bike_asset_tag: e.bikeAssetTag,
					battery_asset_tag: e.batteryAssetTag,
					description: e.description,
					recorded_by: e.recordedBy,
					recorded_at: e.recordedAt.toISOString(),
				})
				.select('entry_id')
				.single();
			check('Saving an entry', error);
			return Number((data as { entry_id: number }).entry_id);
		},
		async clearFault(entryId, clearedDate, clearedBy) {
			const { data, error } = await db
				.from('entries')
				.update({ cleared_date: clearedDate, cleared_by: clearedBy })
				.eq('entry_id', entryId)
				.eq('entry_type', 'fault')
				.is('cleared_date', null)
				.select('entry_id');
			check('Clearing a fault', error);
			return (data ?? []).length === 1;
		},
	};
}
