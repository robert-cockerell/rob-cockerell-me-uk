// D2 and D3 as the app sees them (data dictionary §3.1). Instants are Date;
// dates are 'YYYY-MM-DD'.

export interface Bike {
	bikeAssetTag: string;
	librebookingResourceId: number;
	make: string;
	model: string;
	frameSize: string | null;
	bikeSerialNumber: string | null;
	bikePurchaseDate: string | null;
	lastUpdatedBy: string;
	lastUpdatedAt: Date;
}

export interface BatteryType {
	batteryType: string;
	capacity: number | null;
}

export interface Battery {
	batteryAssetTag: string;
	batteryType: string;
	boschSerial: string | null;
	batteryPurchaseDate: string | null;
	cycleCount: number | null;
	lastUpdatedBy: string;
	lastUpdatedAt: Date;
}

export interface Fitting {
	/** Sequential; breaks ties in the same minute. Absent before it's saved. */
	fittingId?: number;
	batteryAssetTag: string;
	fittedFrom: Date;
	/** Null: the battery was removed (DEC-20). */
	bikeAssetTag: string | null;
	recordedBy: string;
	recordedAt: Date;
}

export type EntryType = 'service check' | 'dealer service' | 'fault';

export interface Entry {
	entryId: number;
	entryType: EntryType;
	entryDate: string;
	bikeAssetTag: string | null;
	batteryAssetTag: string | null;
	description: string;
	recordedBy: string;
	recordedAt: Date;
	clearedDate: string | null;
	clearedBy: string | null;
}

/** DI-040, BR-02. */
export type BatteryLocation =
	| { kind: 'quarantined' }
	| { kind: 'fitted'; bikeAssetTag: string }
	| { kind: 'shelf' };
