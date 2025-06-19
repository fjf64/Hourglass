var toggles = {}; // ID:state
var schedules = {
	YSHS: [
		["1", "8:30-9:17"],
		["2", "9:21-10:06"],
		["3", "10:10-10:55"],
		["4", "10:59-11:44"],
		["lunch", "11:44-12:14"],
		["5", "12:18-13:04"],
		["6", "13:08-13:53"],
		["7", "13:57-14:42"],
		["8", "14:46-15:30"],
	],
	"YSHS Two Hour Delay": [
		["1", "10:30-11:02"],
		["2", "11:06-11:36"],
		["lunch", "11:36-12:06"],
		["3", "12:10-12:40"],
		["4", "12:44-13:14"],
		["5", "13:18-13:48"],
		["6", "13:52-14:22"],
		["7", "14:26-14:56"],
		["8", "15:00-15:30"],
	],
};
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function IdToggle(itemId, Ids = []) {
	if (toggles[itemId] == undefined || toggles[itemId] == false) {
		toggles[itemId] = true;
	} else {
		toggles[itemId] = false;
	}
	if (Ids != []) {
		for (let x of Ids) {
			document.getElementById(x).classList.toggle("change");
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
	var saveBackground = "black";
	var badBackground = "maroon";
	var goodBackground = "greenyellow";
	var numberRegex = /^\d{1,2}:\d{2}$/;
	var children = document.getElementById("added-periods").children;
	if (document.getElementById("draft-name").value == undefined || document.getElementById("draft-name").value == "" || children.length == 0) {
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
		return;
	}
	if (Object.keys(schedules).includes(document.getElementById("draft-name").value)) {
		document.getElementById("draft-name").value = "";
		flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 500, 2);
		return;
	}
	var draftName = document.getElementById("draft-name").value;
	var periods = [];
	for (let child of children) {
		var elements = child.children[0].children;
		if (!numberRegex.test(elements[1].value) || !numberRegex.test(elements[3].value) || elements[0].value.includes("\\n")) {
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
			flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, badBackground, 250, 2);
			return;
		}
		periods.push([elements[0].value, times.join("-")]);
	}
	schedules[draftName] = periods;
	selectElement = document.createElement("option");
	selectElement.style.fontSize = "1.5vh";
	selectElement.value = draftName;
	selectElement.textContent = draftName;
	document.getElementById("schedule").appendChild(selectElement);
	flashElement(document.getElementById("settings-column-4"), ["style", "background"], saveBackground, goodBackground, 500, 1);

}
function exportCurrent() {
	var exportNewLine = [];
	for (let x of schedules[document.getElementById("schedule").value]) {
		exportNewLine.push(x.join("\n"));
	}
	var exporting = exportNewLine.join("\n\n");
	var blob = new Blob([exporting], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "schedule_" + document.getElementById("schedule").value + ".txt";
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
				schedules[nameKey] = returnal;
				selectElement = document.createElement("option");
				selectElement.style.fontSize = "1.5vh";
				selectElement.value = nameKey;
				selectElement.textContent = nameKey;
				document.getElementById("schedule").appendChild(selectElement);
			};
		})(file);
		reader.readAsText(file); // Don't forget this
	}
}
function exportCode() {
	var exportNewLine = [];
	for (let x of schedules[document.getElementById("schedule").value]) {
		exportNewLine.push(x.join("\n"));
	}
	var exporting = exportNewLine.join("\n\n");
	var exporting = [document.getElementById("schedule").value, exporting].join("\n\n\n");
	console.log(btoa(exporting));
}

function importCode(code) {
	const namePeriods = atob(code).split("\n\n\n");
	const periods = namePeriods[1].split("\n\n");
	const returnal = periods.map((p) => p.split("\n"));
	const nameKey = namePeriods[0];
	schedules[nameKey] = returnal;
	selectElement = document.createElement("option");
	selectElement.style.fontSize = "1.5vh";
	selectElement.value = nameKey;
	selectElement.textContent = nameKey;
	document.getElementById("schedule").appendChild(selectElement);
}


async function flashElement(element, effect, ogColor, newColor, time = 500, count = 1) {
	//effect in path list
	poppedEffect = JSON.parse(JSON.stringify(effect))
	var target = element;
	poppedEffect.pop()
	for (let x of poppedEffect) {
		target = target[x];
	}
	i = 0;
	while (i < count) {
		console.log(target[effect[effect.length - 1]])
		target[effect[effect.length - 1]] = newColor;
		await sleep(time);
		target[effect[effect.length - 1]] = ogColor;
		await sleep(time);
		i++;
	}
}

function Main() {
	var currentSchedule = document.getElementById("schedule").value;
	var usedSchedule = schedules[currentSchedule];
	var clock = document.getElementById("mainTime");
	var currentDate = Date.now() + 3600000 * 0; //'3600000 * x'=hours TEST
	var devTimeFix = document.getElementById("dev-time-fix").value;
	if (devTimeFix != "0" && devTimeFix != "") {
		currentDate = ClockToEpoch(devTimeFix);
	}
	// var currentDate = ClockToEpoch('15:40') //TEST
	var currrentPassedPeriods = PassedPeriods(currentSchedule, currentDate);
	if (currrentPassedPeriods[0].length == 0) {
		// before
		clock.innerHTML = "Before";
	} else if (currrentPassedPeriods[1].length == usedSchedule.length) {
		// after
		clock.innerHTML = "After";
	} else if (currrentPassedPeriods[0].length == currrentPassedPeriods[1].length) {
		// break
		clock.innerHTML = "Break";
	} else if (currrentPassedPeriods[0].length > currrentPassedPeriods[1].length) {
		// period x
		var scheduleChunk = usedSchedule[currrentPassedPeriods[0][currrentPassedPeriods[0].length - 1]];
		var timeDiff = ClockToEpoch(scheduleChunk[1].split("-")[1]) - currentDate;
		var mainMinutes = Math.floor(timeDiff / 60000);
		var mainSeconds = Math.floor((timeDiff % 60000) / 1000);
		if (mainSeconds.toString().length <= 1) {
			mainSeconds = "0" + mainSeconds;
		}
		clock.innerHTML = mainMinutes + ":" + mainSeconds;
	}
}

const fakeInput = document.getElementById("fileInput");
const fakeFileName = document.getElementById("fileName");

fakeInput.addEventListener("change", () => {
	fakeFileName.textContent = fakeInput.files.length ? fakeInput.files[0].name : "";
});

setInterval(Main, 1000);
Main();
