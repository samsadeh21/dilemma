URL = window.URL || window.webkitURL;

let gumStream; 						//stream from getUserMedia()
let recorder; 						//MediaRecorder object
let extension;

// true on chrome, false on firefox
console.log("audio/webm:" + MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));
// false on chrome, true on firefox
console.log("audio/ogg:" + MediaRecorder.isTypeSupported('audio/ogg;codecs=opus'));

if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
	extension = "webm";
} else {
	extension = "ogg"
}


function startRecording() {
	document.getElementById('recordingStatus').innerHTML = 'Recording...';
	const recordButton = document.getElementById("recordButton");
	const stopButton = document.getElementById("stopButton");
	const pauseButton = document.getElementById("pauseButton");


	//Simple constraints object, for more advanced audio features see
	//https://addpipe.com/blog/audio-constraints-getusermedia/


	const constraints = { audio: true }
	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing MediaRecorder");

		// assign to gumStream for later use  
		gumStream = stream;

		const options = {
			audioBitsPerSecond: 256000,
			videoBitsPerSecond: 2500000,
			bitsPerSecond: 2628000,
			mimeType: 'audio/' + extension + ';codecs=opus'
		}

		//update the format 
		document.getElementById("formats").innerHTML = 'Sample rate: 48kHz, MIME: audio/' + extension + ';codecs=opus';


		//	Create the MediaRecorder object

		recorder = new MediaRecorder(stream, options);

		//when data becomes available add it to our attay of audio data
		const chunks = [];					//Array of chunks of audio data from the browser
		recorder.ondataavailable = function (e) {
			console.log("recorder.ondataavailable:" + e.data);

			console.log("recorder.audioBitsPerSecond:" + recorder.audioBitsPerSecond)
			console.log("recorder.videoBitsPerSecond:" + recorder.videoBitsPerSecond)
			console.log("recorder.bitsPerSecond:" + recorder.bitsPerSecond)

			// add stream data to chunks

			chunks.push(e.data);
			// if recorder is 'inactive' then recording has finished
			if (recorder.state == 'inactive') {
				// convert stream data chunks to a 'webm' audio format as a blob
				const blob = new Blob(chunks, { type: 'audio/' + extension, bitsPerSecond: 128000 });
				createDownloadLink(blob)
			}
		};

		recorder.onerror = function (e) {
			console.log(e.error);
		}

		//start recording using 1 second chunks
		//Chrome and Firefox will record one long chunk if you do not specify the chunck length
		recorder.start(1000);

		//recorder.start();
	}).catch(function (err) {
		//enable the record button if getUserMedia() fails
		recordButton.disabled = false;
		stopButton.disabled = true;
		pauseButton.disabled = true
	});
}

function pauseRecording() {
	const pauseButton = document.getElementById("pauseButton");
	console.log("pauseButton clicked recorder.state=", recorder.state);
	if (recorder.state == "recording") {
		document.getElementById('recordingStatus').innerHTML = 'Paused...';
		//pause
		recorder.pause();
		pauseButton.innerHTML = "Resume";
	} else if (recorder.state == "paused") {
		document.getElementById('recordingStatus').innerHTML = 'Recording...';
		//resume
		recorder.resume();
		pauseButton.innerHTML = "Pause";

	}
}

function stopRecording() {
	document.getElementById('recordingStatus').innerHTML = 'Stopped...';
	const recordButton = document.getElementById("recordButton");
	const stopButton = document.getElementById("stopButton");
	const pauseButton = document.getElementById("pauseButton");
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML = "Pause";

	//tell the recorder to stop the recording
	recorder.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();
}

function createDownloadLink(blob) {
	const url = URL.createObjectURL(blob);
	const au = document.createElement('audio');
	const div = document.createElement('div');
	const link = document.createElement('a');

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//link the a element to the blob
	link.href = url;
	link.download = "<br>" + "Download here: " + new Date().toISOString() + '.' + extension;
	link.innerHTML = link.download;

	//add the new audio and a elements to the li element
	div.appendChild(au);
	div.appendChild(link);

	//add the li element to the ordered list
	const currentRecordingDiv = document.getElementById(`recording-${currentRecording}`)
	currentRecordingDiv.innerHTML = '';
	currentRecordingDiv.appendChild(div);
}
