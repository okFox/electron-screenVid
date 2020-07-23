const { desktopCapturer, remote } = require('electron');
const { Menu, dialog  } = remote;
const { writeFile } = require('fs');

//Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;


//get available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
      types: ['window', 'screen']
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

//capture footage
let mediaRecorder;
const recordedChunks = [];

async function selectSource(source) {

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  //create a stream
  const stream = await navigator.mediaDevices
  .getUserMedia(constraints);

//preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

//create media recorder
const options = { mimetype: 'video/webm; codecs=vp9' };
mediaRecorder = new MediaRecorder(stream, options);

//register event handlers
mediaRecorder.ondataavailable = handleDataAvailable;
mediaRecorder.onstop = handleStop;
}

//captures recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

//saves video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  
  const { filepath } = await dialog.showSaveDialog({
    buttonLabel: 'Save Video',
    defaultPath: `vid-${Date.now()}.webm`
  });
  console.log(filepath);

  writeFile(filepath, buffer, () => console.log('Video saved!'));

}

