/**
 * Google Apps Script Web App to collect contact messages into a JSON file on Google Drive.
 *
 * How it works:
 * - Deploy this script as a Web App (Anyone can access)
 * - Point your website contact form action to the Web App URL
 * - Each submission is appended to a JSON array stored in Drive (contact-messages.json)
 *
 * Notes:
 * - No external database is required; uses your Google Drive as storage.
 * - Concurrency is handled with LockService to avoid race conditions.
 */

const JSON_FILE_NAME = 'contact-messages.json';
// Optional: put the file in a specific folder by ID; leave empty to use My Drive root.
const FOLDER_ID = '';

function doPost(e) {
	try {
		const lock = LockService.getScriptLock();
		lock.waitLock(30000); // wait up to 30s for other writes
		try {
			const params = normalizeParams_(e);
			const message = buildMessage_(params);
			appendMessage_(message);
		} finally {
			lock.releaseLock();
		}

		return ContentService
			.createTextOutput('OK')
			.setMimeType(ContentService.MimeType.TEXT);
	} catch (err) {
		return ContentService
			.createTextOutput('ERROR: ' + (err && err.message ? err.message : String(err)))
			.setMimeType(ContentService.MimeType.TEXT);
	}
}

function doGet() {
	// Returns the JSON file contents for quick inspection
	const file = getOrCreateJsonFile_();
	return ContentService
		.createTextOutput(file.getBlob().getDataAsString('UTF-8'))
		.setMimeType(ContentService.MimeType.JSON);
}

function normalizeParams_(e) {
	// Supports typical form posts (multipart/form-data or application/x-www-form-urlencoded)
	const p = (e && e.parameter) ? e.parameter : {};
	return {
		name: p.name || '',
		email: p.email || '',
		subject: p.subject || '',
		message: p.message || '',
		phone: p.phone || '',
		userAgent: (e && e.postData && e.postData.type) ? e.postData.type : '',
		ip: (typeof Session !== 'undefined' && Session.getActiveUserLocale) ? '' : '' // IP not directly available
	};
}

function buildMessage_(params) {
	return {
		name: params.name,
		email: params.email,
		subject: params.subject,
		message: params.message,
		phone: params.phone,
		timestamp: new Date().toISOString()
	};
}

function appendMessage_(msg) {
	const file = getOrCreateJsonFile_();
	let dataStr = file.getBlob().getDataAsString('UTF-8').trim();
	let arr;
	try {
		arr = dataStr ? JSON.parse(dataStr) : [];
		if (!Array.isArray(arr)) arr = [];
	} catch (e) {
		// If existing content is corrupted, start fresh but keep backup
		file.makeCopy(JSON_FILE_NAME.replace('.json', '') + ' (backup ' + new Date().toISOString() + ').json');
		arr = [];
	}
	arr.push(msg);
	file.setContent(JSON.stringify(arr, null, 2));
}

function getOrCreateJsonFile_() {
	let file;
	if (FOLDER_ID) {
		const folder = DriveApp.getFolderById(FOLDER_ID);
		const files = folder.getFilesByName(JSON_FILE_NAME);
		file = files.hasNext() ? files.next() : folder.createFile(JSON_FILE_NAME, '[]', MimeType.PLAIN_TEXT);
	} else {
		const files = DriveApp.getFilesByName(JSON_FILE_NAME);
		file = files.hasNext() ? files.next() : DriveApp.createFile(JSON_FILE_NAME, '[]', MimeType.PLAIN_TEXT);
	}
	return file;
}

/**
 * Setup instructions (quick):
 * 1) Open this script in Google Apps Script (https://script.google.com/)
 * 2) Deploy > New deployment > Type: Web app
 * 3) Execute as: Me; Who has access: Anyone (or Anyone with the link)
 * 4) Copy the Web app URL and set it as the form action in your index.html
 */

