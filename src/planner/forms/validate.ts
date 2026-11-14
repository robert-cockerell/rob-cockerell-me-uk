// Server-side checks for every planner form (UI spec §5.3): zod schemas built
// from the data dictionary's formats, plus the checks that need "now" from
// the clock module or other records. Forms carry `novalidate`; these are the
// only rules.

import { z } from 'zod';
import { londonDate } from '../plan/calendar.ts';
import { parseLondonLocal } from '../time/london.ts';
import { MSG } from './messages.ts';

export type Values = Record<string, string>;
export type Errors = Record<string, string>;
export type Checked<T> = { ok: true; value: T } | { ok: false; errors: Errors };

/** Form fields as trimmed strings; checkboxes with the same name joined by ",". */
export function formValues(form: FormData): Values {
	const values: Values = {};
	for (const [key, value] of form.entries()) {
		if (typeof value !== 'string') continue;
		values[key] = key in values ? `${values[key]},${value}` : value.trim();
	}
	return values;
}

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const text = (missing: string, max: number, tooLong: string) =>
	z.string({ error: missing }).trim().min(1, missing).max(max, tooLong);
const optionalText = (max: number, tooLong: string) =>
	z.preprocess(blankToNull, z.string().trim().max(max, tooLong).nullable());
const isRealDate = (s: string) => {
	const [y, m, d] = s.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
const date = (format: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, format).refine(isRealDate, format);
const optionalDate = (format: string) => z.preprocess(blankToNull, date(format).nullable());
const wholeNumber = (missing: string, format: string, min: number, max: number) =>
	z
		.string({ error: missing })
		.trim()
		.min(1, missing)
		.regex(/^\d+$/, format)
		.transform(Number)
		.refine((n) => n >= min && n <= max, format);
const optionalWholeNumber = (message: string, min: number, max: number) =>
	z.preprocess(
		blankToNull,
		z
			.string()
			.regex(/^\d+$/, message)
			.transform(Number)
			.refine((n) => n >= min && n <= max, message)
			.nullable(),
	);

function check<S extends z.ZodType>(schema: S, values: Values): Checked<z.output<S>> {
	const result = schema.safeParse(values);
	if (result.success) return { ok: true, value: result.data };
	const errors: Errors = {};
	for (const issue of result.error.issues) {
		const field = String(issue.path[0] ?? '');
		if (field && !(field in errors)) errors[field] = issue.message;
	}
	return { ok: false, errors };
}

/** Add errors that need "now" or other records to a zod result. */
function merge<T>(result: Checked<T>, extra: Errors): Checked<T> {
	const errors = { ...(result.ok ? {} : result.errors) };
	for (const [field, message] of Object.entries(extra)) if (!(field in errors)) errors[field] = message;
	return Object.keys(errors).length ? { ok: false, errors } : result;
}

const today = (now: Date) => londonDate(now);
const future = (value: string | null | undefined, now: Date) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value > today(now);

// ------------------------------------------------------------- bikes (DI-007 to DI-013)

const bikeSchema = z.object({
	bikeAssetTag: z.string().trim().min(1, MSG.bikeTagMissing).regex(/^[A-Z][0-9]{2}$/, MSG.bikeTagFormat),
	librebookingResourceId: wholeNumber(MSG.resourceIdMissing, MSG.resourceIdFormat, 1, 2_147_483_647),
	make: text(MSG.makeMissing, 30, MSG.makeTooLong),
	model: text(MSG.modelMissing, 40, MSG.modelTooLong),
	frameSize: optionalText(10, MSG.frameSizeTooLong),
	bikeSerialNumber: optionalText(30, MSG.bikeSerialTooLong),
	bikePurchaseDate: optionalDate(MSG.bikePurchaseDateFormat),
});
export type BikeFields = z.output<typeof bikeSchema>;

export function checkBike(
	values: Values,
	ctx: { now: Date; tagInUse: (tag: string) => boolean; resourceIdUsedBy: (id: number) => string | null; serialUsedBy: (serial: string) => string | null },
): Checked<BikeFields> {
	const values2 = { ...values, bikeAssetTag: (values.bikeAssetTag ?? '').toUpperCase() };
	const result = check(bikeSchema, values2);
	const extra: Errors = {};
	if (result.ok) {
		const v = result.value;
		if (ctx.tagInUse(v.bikeAssetTag)) extra.bikeAssetTag = MSG.bikeTagInUse(v.bikeAssetTag);
		const usedBy = ctx.resourceIdUsedBy(v.librebookingResourceId);
		if (usedBy) extra.librebookingResourceId = MSG.resourceIdInUse(v.librebookingResourceId, usedBy);
		const serialBy = v.bikeSerialNumber ? ctx.serialUsedBy(v.bikeSerialNumber) : null;
		if (serialBy && v.bikeSerialNumber) extra.bikeSerialNumber = MSG.bikeSerialInUse(v.bikeSerialNumber, serialBy);
	}
	if (future(values.bikePurchaseDate, ctx.now)) extra.bikePurchaseDate = MSG.bikePurchaseDateFuture;
	return merge(result, extra);
}

// ------------------------------------------------------------- batteries (DI-014 to DI-018)

const batterySchema = z.object({
	batteryAssetTag: z.string().trim().min(1, MSG.batteryTagMissing).regex(/^B-[0-9]{2}$/, MSG.batteryTagFormat),
	batteryType: z.string({ error: MSG.batteryTypeMissing }).trim().min(1, MSG.batteryTypeMissing),
	boschSerial: optionalText(20, MSG.boschSerialTooLong),
	batteryPurchaseDate: optionalDate(MSG.batteryPurchaseDateFormat),
	cycleCount: optionalWholeNumber(MSG.cycleCountRange, 0, 9999),
});
export type BatteryFields = z.output<typeof batterySchema>;

export function checkBattery(
	values: Values,
	ctx: { now: Date; tagInUse: (tag: string) => boolean; typeExists: (name: string) => boolean; serialUsedBy: (serial: string) => string | null },
): Checked<BatteryFields> {
	const values2 = { ...values, batteryAssetTag: (values.batteryAssetTag ?? '').toUpperCase() };
	const result = check(batterySchema, values2);
	const extra: Errors = {};
	if (result.ok) {
		const v = result.value;
		if (ctx.tagInUse(v.batteryAssetTag)) extra.batteryAssetTag = MSG.batteryTagInUse(v.batteryAssetTag);
		if (!ctx.typeExists(v.batteryType)) extra.batteryType = MSG.batteryTypeUnknown;
		const serialBy = v.boschSerial ? ctx.serialUsedBy(v.boschSerial) : null;
		if (serialBy && v.boschSerial) extra.boschSerial = MSG.boschSerialInUse(v.boschSerial, serialBy);
	}
	if (future(values.batteryPurchaseDate, ctx.now)) extra.batteryPurchaseDate = MSG.batteryPurchaseDateFuture;
	return merge(result, extra);
}

// ------------------------------------------------------------- battery types (DI-016, DI-019)

const batteryTypeSchema = z.object({
	batteryType: text(MSG.batteryTypeNameMissing, 40, MSG.batteryTypeNameTooLong),
	capacity: optionalWholeNumber(MSG.capacityRange, 1, 2000),
});
export type BatteryTypeFields = z.output<typeof batteryTypeSchema>;

export function checkBatteryType(values: Values, ctx: { nameInUse: (name: string) => boolean }): Checked<BatteryTypeFields> {
	const result = check(batteryTypeSchema, values);
	const extra: Errors = {};
	if (result.ok && ctx.nameInUse(result.value.batteryType)) extra.batteryType = MSG.batteryTypeInUse(result.value.batteryType);
	return merge(result, extra);
}

// ------------------------------------------------------------- fittings (DI-020)

/** "YYYY-MM-DDTHH:MM" from a datetime-local input, in UK local time. Not later than now (AC-07.3). */
export function checkFittedFrom(value: string | undefined, now: Date): Checked<Date> {
	const at = value ? parseLondonLocal(value.replace('T', ' ')) : null;
	if (!at) return { ok: false, errors: { fittedFrom: MSG.fittedFromFormat } };
	const nowToMinute = Math.floor(now.getTime() / 60_000) * 60_000;
	if (at.getTime() > nowToMinute) return { ok: false, errors: { fittedFrom: MSG.fittedFromFuture } };
	return { ok: true, value: at };
}

// ------------------------------------------------------------- entries (DI-022 to DI-024)

export type EntryKind = 'fault' | 'service check' | 'dealer service';

export function checkEntry(values: Values, kind: EntryKind, now: Date): Checked<{ entryDate: string; description: string }> {
	const schema = z.object({
		entryDate: z.string({ error: MSG.entryDateMissing }).trim().min(1, MSG.entryDateMissing).pipe(date(MSG.entryDateFormat)),
		description: text(MSG.descriptionMissing[kind], 500, MSG.descriptionTooLong),
	});
	const result = check(schema, values);
	return merge(result, future(values.entryDate, now) ? { entryDate: MSG.entryDateFuture } : {});
}

/** DI-027: on or after the fault's Entry date, not in the future. */
export function checkClearedDate(value: string | undefined, entryDate: string, reportedLabel: string, now: Date): Checked<string> {
	const result = check(z.object({ clearedDate: z.string({ error: MSG.clearedDateMissing }).trim().min(1, MSG.clearedDateMissing).pipe(date(MSG.clearedDateFormat)) }), { clearedDate: value ?? '' });
	if (!result.ok) return result;
	const d = result.value.clearedDate;
	if (future(d, now)) return { ok: false, errors: { clearedDate: MSG.clearedDateFuture } };
	if (d < entryDate) return { ok: false, errors: { clearedDate: MSG.clearedDateBeforeEntry(reportedLabel) } };
	return { ok: true, value: d };
}

// ------------------------------------------------------------- the picked name (DI-025)

export function checkName(value: string | undefined): Checked<string> {
	const result = check(z.object({ name: text(MSG.nameMissing, 50, MSG.nameTooLong) }), { name: value ?? '' });
	return result.ok ? { ok: true, value: result.value.name } : result;
}
