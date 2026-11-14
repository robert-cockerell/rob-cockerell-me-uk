// Every validation and save message, in one place (UI spec §5.5). Each is
// written against the data dictionary's rule for its item (DI-007 to DI-028).
// Say what to do, with the field's label. No codes, no "invalid", no "please".

export const MSG = {
	// DI-007, DI-014
	bikeTagMissing: 'Enter the asset tag',
	bikeTagFormat: 'Enter the asset tag as a letter and 2 numbers, like M13',
	bikeTagInUse: (tag: string) => `Asset tag ${tag} is already used by another bike. Check the label on the frame`,
	batteryTagMissing: 'Enter the asset tag',
	batteryTagFormat: 'Enter the asset tag as B- and 2 numbers, like B-27',
	batteryTagInUse: (tag: string) => `Asset tag ${tag} is already used by another battery. Check the label on the battery`,
	// DI-008
	resourceIdMissing: 'Enter the LibreBooking resource ID',
	resourceIdFormat: 'Enter the LibreBooking resource ID as a whole number, like 107',
	resourceIdInUse: (id: number, tag: string) => `Resource ID ${id} is already used by ${tag}. Check the ID in LibreBooking`,
	// DI-009 to DI-013
	makeMissing: 'Enter the make. For a donated bike with no brand, enter Unknown',
	makeTooLong: 'Enter a make of 30 characters or fewer',
	modelMissing: 'Enter the model',
	modelTooLong: 'Enter a model of 40 characters or fewer',
	frameSizeTooLong: 'Enter a frame size of 10 characters or fewer',
	bikeSerialTooLong: 'Enter a serial number of 30 characters or fewer',
	bikeSerialInUse: (serial: string, tag: string) => `Serial number ${serial} is already used by ${tag}`,
	bikePurchaseDateFormat: 'Enter the purchase date as a real date',
	bikePurchaseDateFuture: "Bike purchase date can't be in the future",
	// DI-015 to DI-019
	boschSerialTooLong: 'Enter a Bosch serial of 20 characters or fewer',
	boschSerialInUse: (serial: string, tag: string) => `Bosch serial ${serial} is already used by ${tag}`,
	batteryTypeMissing: 'Choose a battery type',
	batteryTypeUnknown: 'Choose a battery type from the list',
	batteryPurchaseDateFormat: 'Enter the purchase date as a real date',
	batteryPurchaseDateFuture: "Battery purchase date can't be in the future",
	cycleCountRange: 'Enter a cycle count from 0 to 9,999',
	batteryTypeNameMissing: 'Enter the battery type',
	batteryTypeNameTooLong: 'Enter a battery type of 40 characters or fewer',
	batteryTypeInUse: (name: string) => `${name} is already a battery type`,
	capacityRange: 'Enter a capacity from 1 to 2,000 Wh',
	// DI-020
	fittedFromFormat: 'Enter the time the battery was fitted',
	fittedFromFuture: "Fitted from can't be later than now",
	chooseBattery: 'Choose a battery',
	chooseBike: 'Choose a bike',
	// DI-022 to DI-028
	descriptionMissing: {
		fault: 'Enter a description of the fault',
		'service check': 'Enter what you checked',
		'dealer service': 'Enter what the dealer did',
	},
	descriptionTooLong: 'Enter a description of 500 characters or fewer',
	entryDateMissing: 'Enter the entry date',
	entryDateFormat: 'Enter the entry date as a real date',
	entryDateFuture: "Entry date can't be in the future",
	oneAsset: 'Choose one bike or battery',
	clearedDateMissing: 'Enter the date the fault was fixed',
	clearedDateFormat: 'Enter the cleared date as a real date',
	clearedDateFuture: "Cleared date can't be in the future",
	clearedDateBeforeEntry: (reported: string) => `Cleared date can't be before the fault was reported (${reported})`,
	faultAlreadyClosed: 'This fault has already been cleared',
	// DI-025: the picked name (REQ-10)
	nameMissing: 'Enter your name',
	nameTooLong: 'Enter a name of 50 characters or fewer',
} as const;

/** C16 problem notice when a save fails (NFR-19, technical note §6.9). */
export const SAVE_FAILED = {
	title: 'Nothing was saved',
	body: "We couldn't reach the fleet records. Your entry is still in the form. Try again in a minute.",
};

/** Public demo (DEC-49, technical note §7). */
export const DEMO_NOT_SAVED = {
	title: 'This is a demo, so changes aren\'t saved',
	body: 'Everything you entered was checked, but the records are unchanged.',
};
