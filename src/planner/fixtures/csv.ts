// A small CSV reader for test-data/: a header row, comma separated, fields
// optionally in double quotes with "" for a quote. Blank fields become null.

export type CsvRecord = Record<string, string | null>;

function splitLine(line: string): string[] {
	const fields: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (quoted) {
			if (c === '"' && line[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') {
				quoted = false;
			} else {
				field += c;
			}
		} else if (c === '"') {
			quoted = true;
		} else if (c === ',') {
			fields.push(field);
			field = '';
		} else {
			field += c;
		}
	}
	fields.push(field);
	return fields;
}

export function parseCsv(text: string): CsvRecord[] {
	const lines = text
		.replace(/^﻿/, '')
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '');
	if (lines.length === 0) return [];
	const header = splitLine(lines[0]).map((h) => h.trim());
	return lines.slice(1).map((line) => {
		const fields = splitLine(line);
		return Object.fromEntries(header.map((name, i) => [name, (fields[i] ?? '').trim() || null]));
	});
}
