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
	var inputBoxes = "<input class='period-input-box' size='1'></input>";
	if (document.getElementById('24h-box').checked) {
	var switchElement = '<button class="am-pm" onclick="amPmButton(this)">AM</button>';
	} else {
		var switchElement = '<button class="am-pm change" onclick="amPmButton(this)">AM</button>';
	}
	newElement.innerHTML = "<p style='margin:0;'>" +"<input class='period-input-box' placeholder='period' size='3' value='"+(document.getElementById("added-periods").children.length+1)+"'></input>"+':'+ inputBoxes + switchElement + " - " + inputBoxes + switchElement + "</p>";
	document.getElementById("added-periods").appendChild(newElement);
}
function removePeriod() {
	var div = document.getElementById("added-periods"); // or any selector like '#myDiv'
	var lastItem = div.lastElementChild;
	if (lastItem) {
		div.removeChild(lastItem);
	}
}
function amPmSwitch(thisItem) {
	if (true) {
		for (let x of document.getElementsByClassName('am-pm')) {
			x.classList.toggle("change")
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
function saveDraft() {
	var children = document.getElementById('added-periods').children;
	var draftName = document.getElementById('draft-name').value
	for (let child of children) {
		var elements = child.children[0].children
		var mA = 0
		var mB = 0
		if (elements[2].innerHTML == 'PM' && elements[2].classList.value.indexOf('change') > -1) {
			mA = 12
		}
		if (elements[4].innerHTML == 'PM' && elements[4].classList.value.indexOf('change') > -1) {
			mB = 12
		}
		console.log(elements[0].value+':'+elements[2].value) //24 Hour
		
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
	// console.log(PassedPeriods(currentSchedule, currentDate))
	if (currrentPassedPeriods[0].length == 0) {
		// before
		clock.innerHTML = "Before";
	} else if (currrentPassedPeriods[0].length == usedSchedule.length) {
		// after
		clock.innerHTML = "After";
	} else if (currrentPassedPeriods[0].length == currrentPassedPeriods[1].length) {
		// break
		// console.log('inbetween' + usedSchedule[currrentPassedPeriods[0][currrentPassedPeriods[0].length - 1]]) //first
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
setInterval(Main, 1000);
Main();
