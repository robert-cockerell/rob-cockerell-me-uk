// A small CSV reader for the fixture files in test-data/ (UTF-8, header row,
// RFC 4180 quoting). No library: none could be installed in the T1 session.

export type CsvRecord = Record<string, string>;

export function parseCsv(text: string): CsvRecord[] {
	const rows = parseRows(text.replace(/^﻿/, ''));
	if (rows.length === 0) return [];
	const header = rows[0].map((h) => h.trim());
	const records: CsvRecord[] = [];
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		if (row.length === 1 && row[0].trim() === '') continue;
		if (row.length !== header.length) {
			throw new Error(`CSV row ${i + 1} has ${row.length} fields; the header has ${header.length}`);
		}
		const record: CsvRecord = {};
		header.forEach((name, j) => {
			record[name] = row[j];
		});
		records.push(record);
	}
	return records;
}

function parseRows(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			quoted = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += c;
		}
	}
	if (field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}
