var toggles = {}; // ID:state
var schedules = {
	// 'Yellow Springs High School': [
	// 	["1", "8:30-9:17"],
	// 	["2", "9:21-10:06"],
	// 	["3", "10:10-10:55"],
	// 	["4", "10:59-11:44"],
	// 	["lunch", "11:44-12:14"],
	// 	["5", "12:18-13:04"],
	// 	["6", "13:08-13:53"],
	// 	["7", "13:57-14:42"],
	// 	["8", "14:46-15:30"],
	// ],
	// "YSHS Two Hour Delay": [
	// 	["1", "10:30-11:02"],
	// 	["2", "11:06-11:36"],
	// 	["lunch", "11:36-12:06"],
	// 	["3", "12:10-12:40"],
	// 	["4", "12:44-13:14"],
	// 	["5", "13:18-13:48"],
	// 	["6", "13:52-14:22"],
	// 	["7", "14:26-14:56"],
	// 	["8", "15:00-15:30"],
	// ],
};
var lastClockState = "";
var saveBackground = "#0a190e";
var badBackground = "maroon";
var goodBackground = "greenyellow";
var unsaveEscape = false;
var befores = "Before";
var afters = "After";
var breaks = "Break";
var currentPeriods = "Current Period: ";
var betweenCurrentPeriods = "Next Period: ";
var DB_NAME = "MediaDB";
var STORE_NAME = "audioFiles";
var AUDIO_KEY = "defaultAudio";

var fonts = [
	["yeseva-one-regular", "Yeseva"],
	["quantico-regular", "Quantico"],
	["poiret-one-regular", "Poiret"],
	["special-elite-regular", "Special Elite"],
	["jura", "Jura"],
	["sacramento-regular", "Sacramento"],
	["allura-regular", "Allura"],
	["changa", "Changa"],
	["playwrite-vn-guides-regular", "Playwrite"],
	["major-mono-display-regular", "Major Mono"],
	["jetbrains-mono", "Jetbrains Mono"],
	["nanum-gothic-coding-regular", "Nanum Gothic"],
	["megrim-regular", "Megrim"],
	["rubik-80s-fade-regular", "Rubik 80s"],
	["tilt-prism", "Tilt Prism"],
	["bitcount-prop-single", "Bitcount"],
	["roboto", "Roboto"],
	["sans-serif", "Sans Serif"],
	["alumni-sans-pinstripe-regular", "Alumni"],
	["zain-light", "Zain"],
	["montserrat-alternates-regular", "Montserrat"],
	["nanum-myeongjo-regular", "Nanum Myeongjo"],
	["open-sans-x", "Open Sans"],
];

var scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function decodeBase64Url(str) {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	while (str.length % 4 !== 0) {
		str += "=";
	}
	return LZString.decompressFromBase64(str);
}
function deepEqual(a, b) {
	if (a === b) return true;

	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((val, i) => deepEqual(val, b[i]));
	}

	if (typeof a === "object" && a !== null && b !== null) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		return keysA.every((key) => deepEqual(a[key], b[key]));
	}

	return false;
}

function createElementFromHTML(htmlString) {
	var div = document.createElement("div");
	div.innerHTML = htmlString.trim();

	// Change this to div.childNodes to support multiple top-level nodes.
	return div.firstChild;
}

function IdToggle(itemId, Ids = [], toggle = "change") {
	if (toggles[itemId] == undefined || toggles[itemId] == false) {
		toggles[itemId] = true;
	} else {
		toggles[itemId] = false;
	}
	if (Ids != []) {
		for (let x of Ids) {
			document.getElementById(x).classList.toggle(toggle);
		}
	}
}
function ClockToEpoch(timeStr) {
	const [hours, minutes] = timeStr.split(":").map(Number);
	const now = new Date();

	const today = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hours,
		minutes,
		0, // seconds
		0 // milliseconds
	);

	return today.getTime(); // milliseconds since epoch
}
function TimeDifference(a, b) {
	var returnal = {
		seconds: 0,
		minutes: 0,
		hours: 0,
		days: 0,
		weeks: 0,
	};

	var parsedA = Date.parse(a);
	var parsedB = Date.parse(b);
	var timeDifference = parsedA - parsedB;
	returnal.weeks = Math.floor(timeDifference / 604800000);
	returnal.days = Math.floor((timeDifference % 604800000) / 86400000);
	returnal.hours = Math.floor(((timeDifference % 604800000) % 86400000) / 3600000);
	returnal.minutes = Math.floor((((timeDifference % 604800000) % 86400000) % 3600000) / 60000);
	returnal.seconds = Math.floor(((((timeDifference % 604800000) % 86400000) % 3600000) % 60000) / 1000);
	return returnal;
}
function TDifference(a, b) {
	var parsedA = Date.parse(a);
	var parsedB = Date.parse(b);
	var timeDifference = parsedA - parsedB;
	return TimeDifference;
}
function PassedPeriods(schedule, currentTime) {
	var returnal = [[], []];
	for (let x in schedules[schedule]) {
		if (currentTime - ClockToEpoch(schedules[schedule][x][1].split("-")[0]) >= 0) {
			returnal[0].push(x);
		}
	}
	for (let x in schedules[schedule]) {
		if (currentTime - ClockToEpoch(schedules[schedule][x][1].split("-")[1]) >= 0) {
			returnal[1].push(x);
		}
	}
	return returnal;
}
function appendPeriod() {
	var newElement = document.createElement("div");
	newElement.className = "period-input-div";
	var inputBoxes = "<input class='period-input-box' placeholder='00:00'></input>";
	if (document.getElementById("24h-box").checked) {
		var switchElement = '<button class="am-pm" onclick="amPmButton(this)">AM</button>';
	} else {
		var switchElement = '<button class="am-pm change" onclick="amPmButton(this)">AM</button>';
	}
	newElement.innerHTML = "<p style='margin:0;'>" + "<input class='period-input-box' placeholder='period' size='3' value='" + (document.getElementById("added-periods").children.length + 1) + "'></input>" + " : " + inputBoxes + switchElement + " - " + inputBoxes + switchElement + "</p>";
	document.getElementById("added-periods").appendChild(newElement);
}
appendPeriod();
function removePeriod() {
	var div = document.getElementById("added-periods"); // or any selector like '#myDiv'
	var lastItem = div.lastElementChild;
	if (lastItem) {
		div.removeChild(lastItem);
	}
}
function amPmSwitch(thisItem) {
	for (let x of document.getElementsByClassName("am-pm")) {
		if (x.classList.contains("change") && thisItem.checked) {
			x.classList.toggle("change");
		} else if (!x.classList.contains("change") && !thisItem.checked) {
			x.classList.toggle("change");
		}
	}
}
function amPmButton(selfItem) {
	if (selfItem.innerHTML == "AM") {
		selfItem.innerHTML = "PM";
	} else {
		selfItem.innerHTML = "AM";
	}
}
async function saveDraft() {
	var numberRegex = /^\d{1,2}:\d{2}$/;
	var children = document.getElementById("added-periods").children;
	if (document.getElementById("draft-name").value == undefined || document.getElementById("draft-name").value == "") {
		editLog("Bad Draft Name.", 4000);
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
		return;
	}
	if (children.length == 0) {
		editLog("No periods in schedule.", 4000);
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
		return;
	}
	if (Object.keys(schedules).includes(document.getElementById("draft-name").value)) {
		document.getElementById("draft-name").value = "";
		editLog("Draft name already used. ", 4000);
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
		return;
	}
	var draftName = document.getElementById("draft-name").value;
	var periods = [];
	for (let child of children) {
		var elements = child.children[0].children;
		if (!numberRegex.test(elements[1].value) || !numberRegex.test(elements[3].value)) {
			editLog("Time must be in 'hh:mm' format.", 4000);
			flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
			return;
		}
		if (elements[0].value.includes("\\n")) {
			editLog("No '\\n' allowed in period name.", 4000);
			flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
			return;
		}
		var mA = 0;
		var mB = 0;

		var times = [];
		var ogTimes = [elements[1].value, elements[3].value];
		if (elements[2].innerHTML == "PM" && elements[2].classList.value.indexOf("change") > -1 && parseInt(ogTimes[0].split(":")[0]) !== 12) {
			mA = 12;
		}
		if (elements[4].innerHTML == "PM" && elements[4].classList.value.indexOf("change") > -1 && parseInt(ogTimes[1].split(":")[0]) !== 12) {
			mB = 12;
		}

		if (elements[2].innerHTML == "AM" && parseInt(ogTimes[0].split(":")[0]) == 12 && elements[2].classList.value.indexOf("change") > -1) {
			mA = -12;
		}
		if (elements[4].innerHTML == "AM" && parseInt(ogTimes[1].split(":")[0]) == 12 && elements[2].classList.value.indexOf("change") > -1) {
			mB = -12;
		}
		ampmList = [mA, mB];
		for (let x in [elements[1].value, elements[3].value]) {
			var tempTime = ogTimes[x].split(":");
			var tempTimeList = [];
			tempTimeList[0] = parseInt(tempTime[0]) + ampmList[x];
			tempTimeList[1] = tempTime[1];
			times.push(tempTimeList.join(":"));
		}
		if (ClockToEpoch(times[0]) - ClockToEpoch(times[1]) >= 0) {
			editLog("Period can't start after it began.", 4000);
			flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 250, 2);
			return;
		}
		periods.push([elements[0].value, times.join("-")]);
	}
	addToSchedule(draftName, periods);
	document.getElementById("draft-name").value = ""
}
function exportCurrent() {
	var exportNewLine = [];
	for (let x of schedules[scheduleValue]) {
		exportNewLine.push(x.join("\n"));
	}
	var exporting = exportNewLine.join("\n\n");
	var blob = new Blob([exporting], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "schedule_" + scheduleValue + ".txt";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
function importSchedule() {
	const input = document.getElementById("fileInput");
	for (const file of input.files) {
		if (!file) continue;
		const reader = new FileReader();
		reader.onload = (function (currentFile) {
			return function (event) {
				const content = event.target.result;
				const periods = content.split("\n\n");
				const returnal = periods.map((p) => p.split("\n"));
				const nameKey = currentFile.name.replace(".txt", "").replace(/^schedule_/, "");
				addToSchedule(nameKey, returnal);
			};
		})(file);
		reader.readAsText(file); // Don't forget this
	}
}
function exportCode() {
	var exportNewLine = [];
	for (let x of schedules[scheduleValue]) {
		exportNewLine.push(x.join("\n"));
	}
	var exporting = exportNewLine.join("\n\n");
	var exporting = [scheduleValue, exporting].join("\n\n\n");
	var copyText = LZString.compressToBase64(exporting);
	navigator.clipboard.writeText(copyText);
	alert("Copied the text: " + copyText);
}

function exportURL() {
	var btoaSchedules = [];
	for (let sched of Object.keys(schedules)) {
		var exportNewLine = [];
		for (let x of schedules[sched]) {
			exportNewLine.push(x.join("\n"));
		}
		var exporting = exportNewLine.join("\n\n");
		var exporting = [sched, exporting].join("\n\n\n");
		btoaSchedules.push(LZString.compressToBase64(exporting));
	}

	const url = new URL(window.location.origin + window.location.pathname);
	url.searchParams.set("code", btoaSchedules.join("_"));

	// console.log(url.href); // e.g., http://localhost:5500/index.html?code=...

	navigator.clipboard.writeText(url.href);
	alert("Copied the text: " + url.href);
}

async function importCode(code) {
	const namePeriods = LZString.decompressFromBase64(code).split("\n\n\n");
	const periods = namePeriods[1].split("\n\n");
	const returnal = periods.map((p) => p.split("\n"));
	const nameKey = namePeriods[0];
	addToSchedule(nameKey, returnal);
}

async function importClipCode() {
	var code;
	var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

	try {
		const clipboardContents = await navigator.clipboard.read();
		for (const item of clipboardContents) {
			for (const mimeType of item.types) {
				if (mimeType === "text/plain") {
					const blob = await item.getType("text/plain");
					const blobText = await blob.text();
					if (!base64regex.test(blobText)) {
						editLog("Bad Code.", 4000);
						flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 1);
						return;
					}
					code = blobText;
				} else if (mimeType === "text/html") {
					const blob = await item.getType("text/html");
					var blobText = await blob.text();
					const parser = new DOMParser();
					const doc = parser.parseFromString(blobText, "text/html");
					// const text = doc.body.textContent.trim();
					blobText = doc.body.textContent.trim();
					if (!base64regex.test(blobText)) {
						editLog("Bad Code.", 4000);
						flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 1);
						return;
					}
					code = blobText;
				} else {
					flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 1);
					throw new Error(`${mimeType} not supported.`);
				}
			}
		}
	} catch (error) {
		console.log(error.message);
		return;
	}

	importCode(code);
}
function removeFixedDisplay(id) {
	document.getElementById(id).style.removeProperty("display");
}
function srcBackgroundFix(element) {
	element.style.backgroundRepeat = "no-repeat";
	element.style.backgroundPosition = "center";
	element.style.backgroundSize = "100% 100%";
}

function lockDisplay(thisItem) {
	if (dragLock) {
		dragLock = false;
	} else {
		dragLock = true;
	}
}
function lockOpacity(thisItem) {
	if (opacityLock) {
		opacityLock = false;
	} else {
		opacityLock = true;
	}
}
function NegativeTimeToggle(thisItem) {
	if (negativeTime) {
		negativeTime = false;
	} else {
		negativeTime = true;
	}
}
function autoHideMenuToggle(thisItem) {
	if (autoHideMenu) {
		autoHideMenu = false;
	} else {
		autoHideMenu = true;
	}
}

async function flashElement(element, effect, ogColor, newColor, time = 500, count = 1) {
	//effect in path list
	poppedEffect = JSON.parse(JSON.stringify(effect));
	var target = element;
	poppedEffect.pop();
	for (let x of poppedEffect) {
		target = target[x];
	}
	i = 0;
	while (i < count) {
		target[effect[effect.length - 1]] = newColor;
		await sleep(time);
		target[effect[effect.length - 1]] = ogColor;
		await sleep(time);
		i++;
	}
}
async function ChangeElement(selfElement, element, effect, valueOverride = false) {
	let target = element;
	let path = [...effect];
	let last = path.pop();
	for (let key of path) {
		target = target[key];
	}
	if (!valueOverride && !(selfElement == undefined)) {
		target[last] = selfElement.value;
	} else {
		target[last] = valueOverride;
	}
}
function editLog(text, time) {
	flashElement(document.getElementById("log"), ["innerHTML"], "", text, time, 1);
}

function optionHover(selfItem, toggle) {
	if (toggle) {
		document.getElementById("schedule-tooltip").style.display = "block";
		document.querySelector(".schedule-tooltip-container").style.border = ".25vh solid white";
		document.getElementById("schedule-tooltip").textContent = schedules[selfItem.getAttribute("data-value")].map(([period, time]) => `${period}: ${time}`).join("\n\n");
	} else {
		document.getElementById("schedule-tooltip").style.display = "none";
		document.querySelector(".schedule-tooltip-container").style.border = "none";
		// console.log(document.getElementById("schedule-tooltip").display)
	}
}
function selectOption(element, option) {
	ChangeElement("", document.getElementById("schedules"), ["style", "display"], "none");
	element.setAttribute("data-value", option.getAttribute("data-value"));
	element.textContent = option.querySelector(".schedule-text").textContent;
	scheduleValue = option.getAttribute("data-value");
	document.getElementById("schedule-tooltip").textContent = schedules[scheduleValue].map(([period, time]) => `${period}: ${time}`).join("\n\n");
}

function addToSchedule(nameKey, items) {
	let autoChooseSchedule = false;
	if (Object.keys(schedules).length == 0) {
		autoChooseSchedule = true;
	}
	if (Object.keys(schedules).includes(nameKey)) {
		editLog("Schedule already named: " + nameKey, 2000);
		flashElement(document.getElementById("settings"), ["style", "background"], saveBackground, "#808080", 300, 1);
		return;
	}
	schedules[nameKey] = items;
	var selectElement = createElementFromHTML('<div data-value="YSHS Two Hour Delay" class="option"><p class="schedule-text"></p><button class="button-remove remove-schedule danger-button">-</button></div>');
	selectElement.setAttribute("onclick", 'selectOption(document.getElementById("schedule-picker"), this);IdToggle("schedules", ["schedules"])');
	selectElement.setAttribute("onmouseover", "optionHover(this, true)");
	selectElement.setAttribute("onmouseout", "optionHover(this, false)");
	selectElement.querySelector(".schedule-text").textContent = nameKey;
	selectElement.setAttribute("data-value", nameKey);

	selectElement.querySelector(".remove-schedule").onclick = function (e) {
		e.stopPropagation(); // prevent triggering parent onclick
		if (!lastClickedElement || selectElement.querySelector(".remove-schedule") !== lastClickedElement) {
			//click 1
			editLog("Click again to delete schedule.", 3000);
		} else {
			//click 2
			editLog("", 30);
			selectElement.remove();
			delete schedules[nameKey];

			if (scheduleValue == nameKey) {
				var firstOption = document.querySelector("#schedule-specific .option");
				if (firstOption !== null) {
					document.getElementById("schedule-picker").setAttribute("data-value", firstOption.getAttribute("data-value"));
					document.getElementById("schedule-picker").textContent = firstOption.querySelector(".schedule-text").textContent;
					scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");
				} else {
					document.getElementById("schedule-picker").setAttribute("data-value", "");
					document.getElementById("schedule-picker").textContent = "No Schedules In System";
					scheduleValue = "";
				}
			}
		}
		lastClickedElement = selectElement.querySelector(".remove-schedule");
	};
	document.getElementById("schedule-specific").appendChild(selectElement);
	if (autoChooseSchedule) {
		var initialOption = document.querySelector("#schedules .option");
		if (!initialOption) { return }
		selectOption(document.getElementById("schedule-picker"), initialOption);
	}

	flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, goodBackground, 500, 1);
}
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;
			db.createObjectStore(STORE_NAME);
		};

		request.onsuccess = function (event) {
			resolve(event.target.result);
		};

		request.onerror = function (event) {
			reject(event.target.error);
		};
	});
}

// Save blob to IndexedDB
async function saveAudioToDB(fileBlob) {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, "readwrite");
	const store = tx.objectStore(STORE_NAME);
	store.put(fileBlob, AUDIO_KEY);
}

function allInputs() {
	var returnal = {
		C1: {
			fontCurrent: [],
			fontFront: {},
			opacityLock: false,
			dragLock: false,
			negativeTime: true,
			autoHideMenu: false,
		},
		C2: {},
		C3: {
			scheduleCurrent: [],
			scheduleFront: {},
			scheduleBack: {},
			audio: false,
			audioUrl: "",
			currentSound: "",
		},
		C4: {
			roundClock: true,
		},
		misc: {
			periodDisplayPos: [0, 0],
		},
	};
	//Column 1
	for (let x of document.getElementById("column-1").querySelectorAll(".selector")) {
		inputBox = x.querySelector(".button");
		returnal.C1[inputBox.id] = inputBox.value;
	}
	returnal.C1.fontCurrent = [document.getElementById("font-picker").getAttribute("data-value"), document.getElementById("font-picker").textContent];
	returnal.C1.fontFront = document.getElementById("font-choices").innerHTML;

	returnal.C1.dragLock = dragLock;
	returnal.C1.opacityLock = opacityLock;
	returnal.C1.negativeTime = negativeTime;
	returnal.C1.autoHideMenu = autoHideMenu;
	//Column 2

	//column 3
	returnal.C3.scheduleCurrent = [document.getElementById("schedule-picker").getAttribute("data-value"), document.getElementById("schedule-picker").textContent];
	returnal.C3.scheduleFront = document.getElementById("schedule-specific").innerHTML;
	returnal.C3.scheduleBack = schedules;
	returnal.C3.audio = audioToggle;
	returnal.C3.volume = document.getElementById("volume").value;
	returnal.C3.currentSound = document.getElementById("current-sound").innerHTML;
	returnal.C3.audioForm = audioForm;
	returnal.C3.audioLink = document.getElementById("youtubeInput").value;
	saveAudioToDB(soundFile);

	if (!document.getElementById("24h-box").checked) {
		returnal.C4.roundClock = false;
	}
	returnal.misc.periodDisplayPos = [document.getElementById("period-display").style.left, document.getElementById("period-display").style.top];
	return returnal;
}

function saveAll() {
	localStorage["Hourglass"] = JSON.stringify(allInputs());
}
async function exportEnv() {
	copyText = LZString.compressToBase64(JSON.stringify(allInputs()));
	navigator.clipboard.writeText(copyText);
	alert("Copied the text: " + copyText);
}
async function importEnv() {
	cacheRecall("", true, "clipboard");
}

async function getClipboard() {
	var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	try {
		const clipboardContents = await navigator.clipboard.read();
		for (const item of clipboardContents) {
			for (const mimeType of item.types) {
				if (mimeType === "text/plain") {
					const blob = await item.getType("text/plain");
					const blobText = await blob.text();
					if (!base64regex.test(blobText)) {
						editLog("Bad Code.", 4000);
						flashElement(document.getElementById("settings"), ["style", "background"], saveBackground, badBackground, 500, 1);
						return;
					}
					code = blobText;
				} else if (mimeType === "text/html") {
					const blob = await item.getType("text/html");
					var blobText = await blob.text();
					const parser = new DOMParser();
					const doc = parser.parseFromString(blobText, "text/html");
					// const text = doc.body.textContent.trim();
					blobText = doc.body.textContent.trim();
					if (!base64regex.test(blobText)) {
						editLog("Bad Code.", 4000);
						flashElement(document.getElementById("settings"), ["style", "background"], saveBackground, badBackground, 500, 1);
						return;
					}
					code = blobText;
				} else {
					flashElement(document.getElementById("settings"), ["style", "background"], saveBackground, badBackground, 500, 1);
					throw new Error(`${mimeType} not supported.`);
				}
			}
		}
	} catch (error) {
		console.log(error.message);
		return;
	}
	return code;
}

async function cacheRecall(selfItem, startup = false, source = "") {
	//There is no column two in Ba Sing Se
	var cacheBox;
	if ((!lastClickedElement || selfItem !== lastClickedElement) && !startup) {
		editLog("Click again to import settings from cache.", 3000);
	} else {
		editLog("", 30);
		if (source == "clipboard") {
			cacheBox = await getClipboard(); //atob
			cacheBox = decodeBase64Url(cacheBox);
		} else {
			cacheBox = localStorage["Hourglass"];
		}
		if (cacheBox !== undefined) {
			cacheBox = JSON.parse(cacheBox);
			//C1
			for (let x of Object.keys(cacheBox.C1)) {
				if (["fontCurrent", "fontFront", "dragLock", "opacityLock", "negativeTime", "autoHideMenu"].includes(x)) {
					continue;
				}
				var input = document.getElementById(x);
				input.value = cacheBox.C1[x];
				input.dispatchEvent(new Event("change", { bubbles: true }));
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}
			document.getElementById("font-picker").setAttribute("data-value", cacheBox.C1.fontCurrent[0]);
			document.getElementById("font-picker").textContent = cacheBox.C1.fontCurrent[1];
			document.getElementById("font-choices").innerHTML = cacheBox.C1.fontFront;
			if (!document.getElementById("mainContainer").classList.length) {
				document.getElementById("mainContainer").classList.add(cacheBox.C1.fontCurrent[0]);
			} else {
				document.getElementById("mainContainer").classList.replace(mainFont, cacheBox.C1.fontCurrent[0]);
			}
			mainFont = cacheBox.C1.fontCurrent[0];

			dragLock = cacheBox.C1.dragLock; //Draglock

			opacityLock = cacheBox.C1.opacityLock;
			negativeTime = cacheBox.C1.negativeTime;
			autoHideMenu = cacheBox.C1.autoHideMenu;
			if (dragLock) {
				document.getElementById("display-lock-box").checked = true;
				document.getElementById("display-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("display-lock-box").checked = false;
				document.getElementById("display-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			if (opacityLock) {
				document.getElementById("opacity-lock-box").checked = true;
				document.getElementById("opacity-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("opacity-lock-box").checked = false;
				document.getElementById("opacity-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			if (negativeTime) {
				document.getElementById("negative-time-box").checked = true;
				document.getElementById("negative-time-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("negative-time-box").checked = false;
				document.getElementById("negative-time-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			if (autoHideMenu) {
				document.getElementById("autoHideMenu-box").checked = true;
				IdToggle('settings', ['menu-button', 'footer'], 'change1')
				document.getElementById("autoHideMenu-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("autoHideMenu-box").checked = false;
				document.getElementById("autoHideMenu-box").dispatchEvent(new Event("change", { bubbles: true }));
			}

			//C3
			document.getElementById("schedule-picker").setAttribute("data-value", cacheBox.C3.scheduleCurrent[0]);
			document.getElementById("schedule-picker").textContent = cacheBox.C3.scheduleCurrent[1];
			scheduleValue = cacheBox.C3.scheduleCurrent[0];
			document.getElementById("schedule-specific").innerHTML = cacheBox.C3.scheduleFront;
			for (let x of document.getElementById("schedule-specific").children) {
				x.querySelector(".remove-schedule").onclick = function (e) {
					var nameKey = x.getAttribute("data-value");
					e.stopPropagation(); // prevent triggering parent onclick
					if (!lastClickedElement || x.querySelector(".remove-schedule") !== lastClickedElement) {
						//click 1
						editLog("Click again to delete schedule.", 3000);
					} else {
						//click 2
						editLog("", 30);
						x.remove();
						delete schedules[nameKey];

						if (scheduleValue == nameKey) {
							var firstOption = document.querySelector("#schedule-specific .option");
							if (firstOption !== null) {
								document.getElementById("schedule-picker").setAttribute("data-value", firstOption.getAttribute("data-value"));
								document.getElementById("schedule-picker").textContent = firstOption.querySelector(".schedule-text").textContent;
								scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");
							} else {
								document.getElementById("schedule-picker").setAttribute("data-value", "");
								document.getElementById("schedule-picker").textContent = "No Schedules In System";
								scheduleValue = "";
							}
						}
					}
					lastClickedElement = x.querySelector(".remove-schedule");
				};
			}
			schedules = cacheBox.C3.scheduleBack;
			document.getElementById("volume").value = cacheBox.C3.volume;
			audioToggle = cacheBox.C3.audio;
			if (audioToggle) {
				document.getElementById("audio-box").checked = true;
				document.getElementById("audio-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("audio-box").checked = false;
				document.getElementById("audio-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			if (!(source == "clipboard")) {
				const db = await openDB();
				const tx = db.transaction(STORE_NAME, "readonly");
				const store = tx.objectStore(STORE_NAME);
				const getRequest = store.get(AUDIO_KEY);

				getRequest.onsuccess = function (event) {
					const blob = event.target.result;
					if (blob) {
						soundFile = blob;
						document.getElementById("current-sound").innerHTML = cacheBox.C3.currentSound;
						if (customURL) URL.revokeObjectURL(customURL);
						customURL = URL.createObjectURL(soundFile);
						document.getElementById("current-sound").innerText = 'Current Audio: "' + soundFile.name + '"';
						document.getElementById("soundInput").value = soundFile;
						audio.src = customURL;
					}
				};
				getRequest.onerror = function (event) {
					console.log("pain.");
					console.log(event.target.error);
				};
			}

			if (cacheBox.C3.audioLink) {
				document.getElementById("youtubeInput").value = cacheBox.C3.audioLink;
			} else {
				ChangeElement("", document.getElementById("current-sound"), ["innerText"], 'Current Sound: "' + (document.getElementById("soundInput").value ? document.getElementById("soundInput").value.slice(12) : "school-bell.wav") + '"');
			}
			audioForm = cacheBox.C3.audioForm;
			setAudioURL();
			//C4
			if (!cacheBox.C4.roundClock) {
				document.getElementById("24h-box").checked = false;
				document.getElementById("24h-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("24h-box").checked = true;
				document.getElementById("24h-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			amPmSwitch(document.getElementById("24h-box"));
			//MISC
			document.getElementById("period-display").style.left = cacheBox.misc.periodDisplayPos[0];
			document.getElementById("period-display").style.top = cacheBox.misc.periodDisplayPos[1];
		}
	}
}

function clearStorage(selfItem) {
	if (!lastClickedElement || selfItem !== lastClickedElement) {
		unsaveEscape = true;
		editLog("Click again to clear all settings, and reload page.", 3000);
	} else {
		editLog("", 10);
		localStorage.clear();
		sessionStorage.clear();
		const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
		location.reload(true);
	}
}

function addToFonts(frontName, backName) {
	var selectElement = createElementFromHTML('<div data-value="YSHS Two Hour Delay" class="option"><p class="schedule-text"></p></div>');
	selectElement.setAttribute("onclick", 'pickFont(document.getElementById("font-picker"), this);IdToggle("fonts", ["fonts"])');
	selectElement.querySelector(".schedule-text").textContent = frontName;
	selectElement.setAttribute("data-value", backName);
	selectElement.classList.add(backName);
	document.getElementById("font-choices").appendChild(selectElement);
}

var mainFont;
function pickFont(element, option) {
	ChangeElement("", document.getElementById("fonts"), ["style", "display"], "none");
	element.setAttribute("data-value", option.getAttribute("data-value"));
	element.textContent = option.querySelector(".schedule-text").textContent;
	if (!document.getElementById("mainContainer").classList.length) {
		document.getElementById("mainContainer").classList.add(option.getAttribute("data-value"));
	} else {
		document.getElementById("mainContainer").classList.replace(mainFont, option.getAttribute("data-value"));
	}
	mainFont = option.getAttribute("data-value");
}
function postCommand(func, args = []) {
	const iframe = document.getElementById("ytPlayer");
	if (iframe.contentWindow) {
		iframe.contentWindow.postMessage(
			JSON.stringify({
				event: "command",
				func,
				args,
			}),
			"*"
		);
	}
}
var audioToggle = false;
var audioForm = "file";
function activateNoise() {
	if (audioToggle) {
		playNoise();
	}
}
function allowAudio() {
	if (audioToggle) {
		audioToggle = false;
	} else {
		audioToggle = true;
	}
}
function stopAudio() {
	const audio = document.getElementById("audioPlayer");

	audio.pause();
	audio.currentTime = 0;
	if (audioForm == "link") {
		postCommand("pauseVideo");
		postCommand("seekTo", [0, true]);
	}
}
function playNoise() {
	if (audioForm == "file") {
		const audio = document.getElementById("audioPlayer");
		audio.volume = Math.min(Math.max(document.getElementById("volume").value / 100, 0), 1);
		audio.play();
		audio.style.display = "block";
	} else {
		const iframe = document.getElementById("ytPlayer");
		if (!iframe.contentWindow) {
			alert("Load a valid video first.");
			return;
		}

		// Tell the embedded YouTube iframe to play using postMessage
		iframe.contentWindow.postMessage(
			JSON.stringify({
				event: "command",
				func: "seekTo",
				args: [0, true],
			}),
			"*"
		);
		const vol = Math.min(Math.max(document.getElementById("volume").value, 0), 100);
		iframe.contentWindow.postMessage(
			JSON.stringify({
				event: "command",
				func: "setVolume",
				args: [vol],
			}),
			"*"
		);
		iframe.contentWindow.postMessage(
			JSON.stringify({
				event: "command",
				func: "playVideo",
				args: [],
			}),
			"*"
		);
	}
}
function extractVideoID(url) {
	const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function setAudioURL(reset = "nah") {
	const input = document.getElementById("youtubeInput").value;
	const videoID = extractVideoID(input);
	if (reset != "nah") {
		audioForm = "file";
		ChangeElement("", document.getElementById("current-sound"), ["innerText"], 'Current Sound: "' + (document.getElementById("soundInput").value ? document.getElementById("soundInput").value.slice(12) : "school-bell.wav") + '"');
		document.getElementById("youtubeInput").value = "";
		return;
	}
	if (!input) {
		audioForm = "file";
		ChangeElement("", document.getElementById("current-sound"), ["innerText"], 'Current Sound: "' + (document.getElementById("soundInput").value ? document.getElementById("soundInput").value.slice(12) : "school-bell.wav") + '"');
		return;
	}
	if (!videoID) {
		alert("Please enter a valid YouTube URL.");
		audioForm = "file";
		document.getElementById("youtubeInput").value = "";
		ChangeElement("", document.getElementById("current-sound"), ["innerText"], 'Current Sound: "' + (document.getElementById("soundInput").value ? document.getElementById("soundInput").value.slice(12) : "school-bell.wav") + '"');
		return;
	}

	audioForm = "link";
	const iframe = document.getElementById("ytPlayer");
	ChangeElement("", document.getElementById("current-sound"), ["innerText"], 'Current Sound: "' + `https://www.youtube.com/embed/${videoID}?enablejsapi=1&autoplay=0&controls=0` + '"');
	iframe.src = `https://www.youtube.com/embed/${videoID}?enablejsapi=1&autoplay=0&controls=0`;
	if (iframe.contentWindow) {
		iframe.contentWindow.postMessage(
			JSON.stringify({
				event: "command",
				func: "cueVideoById",
				args: [videoID],
			}),
			"*"
		);
	}
}

function Main() {
	var currentSchedule = scheduleValue;
	var usedSchedule = schedules[currentSchedule];
	if (usedSchedule == undefined) {
		document.getElementById('current-chedule-wrapper').style.backgroundColor = '#5e0000ff';
		return;
	}
	document.getElementById('current-chedule-wrapper').style.backgroundColor = '';
	var clock = document.getElementById("mainTime");
	var currentDate = Date.now(); //'3600000 * x'=hours TEST
	var devTimeFix = document.getElementById("dev-time-fix").value;
	var devTimeAdd = document.getElementById("dev-time-add").value;
	if (devTimeFix != "0" && devTimeFix != "") {
		currentDate = ClockToEpoch(devTimeFix);
	} else if (devTimeAdd != "0" && devTimeAdd != "") {
		currentDate += 3600000 * parseFloat(devTimeAdd);
	}
	var currrentPassedPeriods = PassedPeriods(currentSchedule, currentDate);
	var lastPastPeriod = usedSchedule[currrentPassedPeriods[0][currrentPassedPeriods[0].length - 1]];
	var nextPeriod = usedSchedule[parseInt(usedSchedule.indexOf(lastPastPeriod)) + 1] ? usedSchedule[parseInt(usedSchedule.indexOf(lastPastPeriod)) + 1][0] : "End";
	if (currrentPassedPeriods[0].length == 0) {
		// before
		clock.innerHTML = befores;
		document.getElementById("period-display").textContent = "";
		if (lastClockState == "current" + scheduleValue) {
			activateNoise();
		}
		lastClockState = "before" + scheduleValue;
	} else if (currrentPassedPeriods[1].length == usedSchedule.length) {
		// after
		clock.innerHTML = afters;
		document.getElementById("period-display").textContent = "";
		if (lastClockState == "current" + scheduleValue) {
			activateNoise();
		}
		lastClockState = "after" + scheduleValue;
	} else if (currrentPassedPeriods[0].length == currrentPassedPeriods[1].length) {
		// break
		if (negativeTime) {
			var scheduleChunk = usedSchedule[parseInt(usedSchedule.indexOf(lastPastPeriod)) + 1];
			document.getElementById("period-display").textContent = currentPeriods + lastPastPeriod[0];
			var timeDiff = ClockToEpoch(scheduleChunk[1].split("-")[0]) - currentDate + 1000;
			var mainMinutes = Math.floor(timeDiff / 60000);
			var mainSeconds = Math.floor((timeDiff % 60000) / 1000);
			if (mainSeconds.toString().length <= 1) {
				mainSeconds = "0" + mainSeconds;
			}
			clock.innerHTML = "-" + mainMinutes + ":" + mainSeconds;
		} else {
			clock.innerHTML = breaks;
		}
		document.getElementById("period-display").textContent = betweenCurrentPeriods + nextPeriod;
		if (lastClockState == "current" + scheduleValue) {
			activateNoise();
		}
		lastClockState = "break" + scheduleValue;
	} else if (currrentPassedPeriods[0].length > currrentPassedPeriods[1].length) {
		// period x
		var scheduleChunk = usedSchedule[currrentPassedPeriods[0][currrentPassedPeriods[0].length - 1]];
		document.getElementById("period-display").textContent = currentPeriods + lastPastPeriod[0];
		var timeDiff = ClockToEpoch(scheduleChunk[1].split("-")[1]) - currentDate;
		var mainMinutes = Math.floor(timeDiff / 60000);
		var mainSeconds = Math.floor((timeDiff % 60000) / 1000);
		if (mainSeconds.toString().length <= 1) {
			mainSeconds = "0" + mainSeconds;
		}
		clock.innerHTML = mainMinutes + ":" + mainSeconds;
		if (["after" + scheduleValue, "break" + scheduleValue, "before" + scheduleValue].includes(lastClockState)) {
			activateNoise();
		}
		lastClockState = "current" + scheduleValue;
	}
}

var lastClickedElement;
window.onload = () => {
	var initialOption = document.querySelector("#schedules .option");
	if (initialOption) {
		selectOption(document.getElementById("schedule-picker"), initialOption);
	} else {
		document.getElementById('schedule-picker').textContent = "No Schedules";
	}

	var initalFont = document.querySelector("#fonts .option");
	pickFont(document.getElementById("font-picker"), initalFont);
	// var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	cacheRecall("", true, "");
	const params = new URLSearchParams(window.location.search);
	const action = params.get("code");

	if (action) {
		for (let x of action.split("_")) {
			importCode(x);
			let url = new URL(window.location.href);
			url.searchParams.delete("code");
			history.replaceState(null, "", url);
		}
	}
	new Sortable(document.getElementById("schedule-specific"), {
		animation: 150,
		ghostClass: "drag-ghost", // optional class to style dragged item
		onEnd: function (evt) { },
	});
	new Sortable(document.getElementById("font-choices"), {
		animation: 150,
		ghostClass: "drag-ghost", // optional class to style dragged item
		onEnd: function (evt) { },
	});

	document.addEventListener("click", async function (e) {
		await sleep(10);
		lastClickedElement = e.target;
	});




};

window.addEventListener("beforeunload", (e) => {
	if (!unsaveEscape) {
		saveAll();
	}
});
const audio = document.getElementById("audioPlayer");
let customURL = null;
var soundFile;

document.getElementById("soundInput").addEventListener("change", function (event) {
	soundFile = event.target.files[0];
	if (!soundFile) return;

	if (customURL) URL.revokeObjectURL(customURL);

	customURL = URL.createObjectURL(soundFile);
	if (!document.getElementById("youtubeInput").value) {
		document.getElementById("current-sound").innerText = 'Current Audio: "' + soundFile.name + '"';
	}
	audio.src = customURL;
});

const box = document.getElementById("period-display");
const container = document.querySelector("body");

let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastTapTime = 0;
var dragLock = false;

function snapToStep(valuePercent, step = 1) {
	return Math.round(valuePercent / step) * step;
}

function setBoxPosition(xPercent, yPercent) {
	box.style.left = `${xPercent}%`;
	box.style.top = `${yPercent}%`;
}

function startDrag(e) {
	const now = Date.now();
	if (now - lastTapTime < 300 && !dragLock) {
		// Double-tap detected
		setBoxPosition(15, 0);
		lastTapTime = 0;
		return;
	}
	lastTapTime = now;

	isDragging = true;
	const evt = e.touches ? e.touches[0] : e;

	const containerRect = container.getBoundingClientRect();
	const boxRect = box.getBoundingClientRect();

	offsetX = evt.clientX - boxRect.left;
	offsetY = evt.clientY - boxRect.top;

	box.style.cursor = "grabbing";
}

function duringDrag(e) {
	if (!isDragging || dragLock) return;

	const evt = e.touches ? e.touches[0] : e;

	const containerRect = container.getBoundingClientRect();

	let x = evt.clientX - containerRect.left - offsetX;
	let y = evt.clientY - containerRect.top - offsetY;

	const minX = 0;
	const minY = 0;
	const maxX = container.clientWidth - box.offsetWidth;
	const maxY = container.clientHeight - box.offsetHeight;

	x = Math.max(minX, Math.min(x, maxX));
	y = Math.max(minY, Math.min(y, maxY));

	const xPercent = snapToStep((x / container.clientWidth) * 100, 1);
	const yPercent = snapToStep((y / container.clientHeight) * 100, 1);

	setBoxPosition(xPercent, yPercent);
}

function endDrag() {
	isDragging = false;
	box.style.cursor = "grab";
}

// Mouse events
box.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", duringDrag);
document.addEventListener("mouseup", endDrag);

// Touch events
box.addEventListener("touchstart", startDrag);
document.addEventListener("touchmove", duringDrag, { passive: false });
document.addEventListener("touchend", endDrag);

// Initialize position
setBoxPosition(15, 0);

//YSHS
// importCode("WWVsbG93IFNwcmluZ3MgSGlnaCBTY2hvb2wKCgoxCjg6MzAtOToxNwoKMgo5OjIxLTEwOjA2CgozCjEwOjEwLTEwOjU1Cgo0CjEwOjU5LTExOjQ0CgpsdW5jaAoxMTo0NC0xMjoxNAoKNQoxMjoxOC0xMzowNAoKNgoxMzowOC0xMzo1MwoKNwoxMzo1Ny0xNDo0MgoKOAoxNDo0Ni0xNTozMA==");
// importCode("WVNIUyBUd28gSG91ciBEZWxheQoKCjEKMTA6MzAtMTE6MDIKCjIKMTE6MDYtMTE6MzYKCmx1bmNoCjExOjM2LTEyOjA2CgozCjEyOjEwLTEyOjQwCgo0CjEyOjQ0LTEzOjE0Cgo1CjEzOjE4LTEzOjQ4Cgo2CjEzOjUyLTE0OjIyCgo3CjE0OjI2LTE0OjU2Cgo4CjE1OjAwLTE1OjMw");

for (let x of document.getElementById("column-1").querySelectorAll(".selector")) {
	let input = x.querySelector(".button");
	input.dispatchEvent(new Event("change", { bubbles: true }));
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

let inputs = document.querySelectorAll('input[type="text"]');
var opacityLock = false;
var negativeTime = true;
var autoHideMenu = false;

inputBlacklist = ['youtubeInput', 'draft-name']
inputs.forEach((input) => {
	if (inputBlacklist.includes(input.id)) return;
	input.addEventListener("focus", () => {
		if (opacityLock == false) {
			document.getElementById("settings").style.opacity = "0.2";
		}
	});
	input.addEventListener("blur", () => {
		document.getElementById("settings").style.opacity = "1";
	});
});


addToFonts("Time New Roman", "times-new-roman");
for (let x of fonts) {
	if (x[1] == "Times New Roman") {
		continue;
	}
	addToFonts(x[1], x[0]);
}

function onTabSwitch() {
    Main() 
    // Place your custom function logic here
}

// Listen for visibility changes
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
    } else {
        onTabSwitch();
    }
});


setInterval(Main, 1000);
Main();
