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

var saveBackground = "#0a190e";
var badBackground = "maroon";
var goodBackground = "greenyellow";
var unsaveEscape = false;
var befores = "Before";
var afters = "After";
var breaks = "Break";
var currentPeriods = "Current Period: ";
var betweenCurrentPeriods = "Next Period: ";

var scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function decodeBase64Url(str) {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	while (str.length % 4 !== 0) {
		str += "=";
	}
	return atob(str);
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
	var inputBoxes = "<input class='period-input-box'></input>";
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
	if (true) {
		for (let x of document.getElementsByClassName("am-pm")) {
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
		if (elements[2].innerHTML == "PM" && elements[2].classList.value.indexOf("change") > -1) {
			mA = 12;
		}
		if (elements[4].innerHTML == "PM" && elements[4].classList.value.indexOf("change") > -1) {
			mB = 12;
		}
		var times = [];
		var ogTimes = [elements[1].value, elements[3].value];
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
	var copyText = btoa(exporting);
	// copyText.select();
	// copyText.setSelectionRange(0, 99999); // For mobile devices
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
		btoaSchedules.push(btoa(exporting));
	}

	const url = new URL(window.location.origin + window.location.pathname);
	url.searchParams.set("code", btoaSchedules.join("_"));

	// console.log(url.href); // e.g., http://localhost:5500/index.html?code=...

	navigator.clipboard.writeText(url.href);
	alert("Copied the text: " + url.href);
}

async function importCode(code) {
	const namePeriods = atob(code).split("\n\n\n");
	const periods = namePeriods[1].split("\n\n");
	const returnal = periods.map((p) => p.split("\n"));
	const nameKey = namePeriods[0];
	addToSchedule(nameKey, returnal);
}

async function importClipCode() {
	var code;
	var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	// const clipboardContents = await navigator.clipboard.read();

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
function lockDisplay(thisItem) {
	if (dragLock) {
		dragLock = false;
	} else {
		dragLock = true;
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
		// console.log('on ')
		document.getElementById("schedule-tooltip").textContent = schedules[selfItem.getAttribute("data-value")].map(([period, time]) => `${period}: ${time}`).join("\n\n");
	} else {
		// console.log('off ')
	}
}
function selectOption(element, option) {
	ChangeElement("", document.getElementById("schedules"), ["style", "display"], "none");
	element.setAttribute("data-value", option.getAttribute("data-value"));
	element.textContent = option.querySelector(".schedule-text").textContent + " ▼";
	scheduleValue = option.getAttribute("data-value");
	document.getElementById("schedule-tooltip").textContent = schedules[scheduleValue].map(([period, time]) => `${period}: ${time}`).join("\n\n");
	// console.log(schedules[scheduleValue].map(([period, time]) => `${period}: ${time}`).join("\n\n"));
}

function addToSchedule(nameKey, items) {
	if (Object.keys(schedules).includes(nameKey)) {
		editLog("Schedule already named: " + nameKey, 4000);
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, "#808080", 500, 1);
		return;
	}
	schedules[nameKey] = items;
	var selectElement = createElementFromHTML('<div data-value="YSHS Two Hour Delay" class="option"><p class="schedule-text"></p><button class="button remove-schedule danger-button">-</button></div>');
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
					document.getElementById("schedule-picker").textContent = firstOption.querySelector(".schedule-text").textContent + " ▼";
					scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");
				} else {
					document.getElementById("schedule-picker").setAttribute("data-value", "");
					document.getElementById("schedule-picker").textContent = "No Schedules In System" + " ▼";
					scheduleValue = "";
				}
			}
		}
		lastClickedElement = selectElement.querySelector(".remove-schedule");
	};
	document.getElementById("schedule-specific").appendChild(selectElement);

	flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, goodBackground, 500, 1);
}

function allInputs() {
	var returnal = {
		C1: {},
		C2: {
			dragLock: false,
		},
		C3: {
			scheduleCurrent: [],
			scheduleFront: {},
			scheduleBack: {},
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

	//Column 2
	returnal.C2.dragLock = dragLock;

	//column 3
	returnal.C3.scheduleCurrent = [document.getElementById("schedule-picker").getAttribute("data-value"), document.getElementById("schedule-picker").textContent.slice(0, -2)];
	returnal.C3.scheduleFront = document.getElementById("schedule-specific").innerHTML;
	returnal.C3.scheduleBack = schedules;

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
	copyText = btoa(JSON.stringify(allInputs()));
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
	return code;
}

async function cacheRecall(selfItem, startup = false, source = "") {
	var cacheBox;
	if ((!lastClickedElement || selfItem !== lastClickedElement) && !startup) {
		editLog("Click again to import settings from cache.", 3000);
	} else {
		editLog("", 30);
		if (source == "clipboard") {
			cacheBox = await getClipboard(); //atob
			cacheBox = decodeBase64Url(cacheBox);
			console.log(cacheBox);
		} else {
			cacheBox = localStorage["Hourglass"];
		}
		if (cacheBox !== undefined) {
			cacheBox = JSON.parse(cacheBox);
			console.log(cacheBox);
			//C1
			for (let x of Object.keys(cacheBox.C1)) {
				var input = document.getElementById(x);
				input.value = cacheBox.C1[x];
				input.dispatchEvent(new Event("change", { bubbles: true }));
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}
			//C2
			dragLock = cacheBox.C2.dragLock;
			if (dragLock) {
				document.getElementById("display-lock-box").checked = true;
				document.getElementById("display-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("display-lock-box").checked = false;
				document.getElementById("display-lock-box").dispatchEvent(new Event("change", { bubbles: true }));
			}

			//C3
			document.getElementById("schedule-picker").setAttribute("data-value", cacheBox.C3.scheduleCurrent[0]);
			document.getElementById("schedule-picker").textContent = cacheBox.C3.scheduleCurrent[1] + " ▼";
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
								document.getElementById("schedule-picker").textContent = firstOption.querySelector(".schedule-text").textContent + " ▼";
								scheduleValue = document.getElementById("schedule-picker").getAttribute("data-value");
							} else {
								document.getElementById("schedule-picker").setAttribute("data-value", "");
								document.getElementById("schedule-picker").textContent = "No Schedules In System" + " ▼";
								scheduleValue = "";
							}
						}
					}
					lastClickedElement = x.querySelector(".remove-schedule");
				};
			}
			schedules = cacheBox.C3.scheduleBack;

			//C4
			if (!cacheBox.C4.roundClock) {
				document.getElementById("24h-box").checked = false;
				document.getElementById("24h-box").dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				document.getElementById("24h-box").checked = true;
				document.getElementById("24h-box").dispatchEvent(new Event("change", { bubbles: true }));
			}
			//MISC
			document.getElementById("period-display").style.left = cacheBox.misc.periodDisplayPos[0];
			document.getElementById("period-display").style.top = cacheBox.misc.periodDisplayPos[1];
		} else {
			// location.reload(true)
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
		location.reload(true);
	}
}

function Main() {
	var currentSchedule = scheduleValue;
	var usedSchedule = schedules[currentSchedule];
	var clock = document.getElementById("mainTime");
	var currentDate = Date.now() + 3600000 * 0; //'3600000 * x'=hours TEST
	var devTimeFix = document.getElementById("dev-time-fix").value;
	if (devTimeFix != "0" && devTimeFix != "") {
		currentDate = ClockToEpoch(devTimeFix);
	}
	// var currentDate = ClockToEpoch('15:40') //TEST
	var currrentPassedPeriods = PassedPeriods(currentSchedule, currentDate);
	var lastPastPeriod = usedSchedule[currrentPassedPeriods[0][currrentPassedPeriods[0].length - 1]];
	var nextPeriod = usedSchedule[parseInt(usedSchedule.indexOf(lastPastPeriod)) + 1] ? usedSchedule[parseInt(usedSchedule.indexOf(lastPastPeriod)) + 1][0] : "End";
	if (currrentPassedPeriods[0].length == 0) {
		// before
		clock.innerHTML = befores;
		document.getElementById("period-display").textContent = '';
	} else if (currrentPassedPeriods[1].length == usedSchedule.length) {
		// after
		clock.innerHTML = afters;
		document.getElementById("period-display").textContent = '';
	} else if (currrentPassedPeriods[0].length == currrentPassedPeriods[1].length) {
		// break
		clock.innerHTML = breaks;
		document.getElementById("period-display").textContent = betweenCurrentPeriods + nextPeriod;
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
	}
}
var lastClickedElement;
window.onload = () => {
	// var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	const params = new URLSearchParams(window.location.search);
	const action = params.get("code");

	// if (!base64regex.test(action)) {
	// flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 1);
	// return;
	// }
	if (action) {
		for (let x of action.split("_")) {
			importCode(x);
		}
	}

	new Sortable(document.getElementById("schedule-specific"), {
		animation: 150,
		// handle: '.schedule-text', // only allow dragging by text
		ghostClass: "drag-ghost", // optional class to style dragged item
		onEnd: function (evt) {
			// saveVariables.scheduleOrder = document.getElementById("schedule-specific").children;
			// You can iterate over the children of #schedules here to get their new order
		},
	});

	document.addEventListener("click", async function (e) {
		await sleep(10);
		lastClickedElement = e.target;
		// }
	});
};

window.addEventListener("beforeunload", (e) => {
	if (!unsaveEscape) {
		saveAll();
	}
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
	if (now - lastTapTime < 300) {
		// Double-tap detected
		setBoxPosition(0, 0);
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
setBoxPosition(10, 0);

//YSHS
importCode("WWVsbG93IFNwcmluZ3MgSGlnaCBTY2hvb2wKCgoxCjg6MzAtOToxNwoKMgo5OjIxLTEwOjA2CgozCjEwOjEwLTEwOjU1Cgo0CjEwOjU5LTExOjQ0CgpsdW5jaAoxMTo0NC0xMjoxNAoKNQoxMjoxOC0xMzowNAoKNgoxMzowOC0xMzo1MwoKNwoxMzo1Ny0xNDo0MgoKOAoxNDo0Ni0xNTozMA==");
importCode("WVNIUyBUd28gSG91ciBEZWxheQoKCjEKMTA6MzAtMTE6MDIKCjIKMTE6MDYtMTE6MzYKCmx1bmNoCjExOjM2LTEyOjA2CgozCjEyOjEwLTEyOjQwCgo0CjEyOjQ0LTEzOjE0Cgo1CjEzOjE4LTEzOjQ4Cgo2CjEzOjUyLTE0OjIyCgo3CjE0OjI2LTE0OjU2Cgo4CjE1OjAwLTE1OjMw");
// saveVariables.scheduleOrder = document.getElementById("schedule-specific").children;

for (let x of document.getElementById("column-1").querySelectorAll(".selector")) {
	let input = x.querySelector(".button");
	input.dispatchEvent(new Event("change", { bubbles: true }));
	input.dispatchEvent(new Event("input", { bubbles: true }));
}
cacheRecall("", true);

var initialOption = document.querySelector("#schedules .option");
selectOption(document.getElementById("schedule-picker"), initialOption);

setInterval(Main, 1000);
Main();
