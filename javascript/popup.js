'use strict';

const { session, Notification } = require('electron')
let analyzeButton = document.getElementById('analyzeButton');
let downloadButton = document.getElementById('downloadSample')
let videoIdElement = document.getElementById('videoId')
var domain

if (process.env.ELECTRON_NODE_ENV === 'development') {
  domain = "http://localhost:1195"
} else {
  domain = "https://api.kope.online"
}

function getExistingResults (specific = {}) {
  session.defaultSession.cookies.get(specific)
    .then((cookies) => {
      return cookies
    })
}

window.onload = function () {
  // currently broken
  if (process.env.ELECTRON_NODE_ENV === 'development') {
    const results = getExistingResults()
  console.log('Existing sessions: ', results)
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).substring(0, 11);
  });
}

function runNotification (results, failed = false) {
  var opt = {
    title: "SampleIt",
    message: failed ? '' : `Tempo: ${results.tempo} - Note: ${results.note} - Title: ${results.sample.videoTitle}`,
    iconUrl: "./images/vinyl-24.png"
  }
  if (failed) {
    opt.iconUrl = "./images/vinyl-24.png"
    opt.title = "Failed"
    opt.message = "Audio analysis has failed. Please try again later."
  }
  const notification = {
    title: opt.title,
    body: opt.message
  }
  new Notification(notification).show()
}

function storeResults (results) {
  const data = {
    sampleUrl: document.getElementById('sampleUrl').value,
    sampleGenre: document.getElementById('sampleGenre').value,
    videoTitle: results.sample.videoTitle,
    tempo: results.tempo,
    note: results.note
  }
  session.defaultSession.cookies.set(data)
    .then(() => {
      console.log('Session saved.')
    }, (err) => {
      console.log('Session failed - ', err)
    })
}

const getResultsTable = (name, tempo, note) => {
  return `
  <table id="resultTable" style="font-size: 14px;">
    <tr>
      <th scope="col" width="50%">Name</th>
      <th scope="col">Tempo</th>
      <th scope="col">Note</th>
    </tr>
    <tr>
      <td>${name}</td>
      <td>${tempo}</td>
      <td>${note}</td>
    </tr>
  </table>
  `
}

downloadButton.onclick = function () {
  window.open(`${domain}/app/download/?video_id=${videoIdElement.innerText}`, '_blank')
  downloadButton.style.display = "none"
  analyzeButton.innerText = "Analyze"
  analyzeButton.disabled = false
  analyzeButton.style.display = "block"
  document.getElementById('sampleUrl').value = ""
  document.getElementById('sampleGenre').value = ""
}

analyzeButton.onclick = function () {
  analyzeButton.disabled = true
  let sampleUrl = document.getElementById('sampleUrl').value
  let sampleGenre = document.getElementById('sampleGenre').value
  let warningEntry = document.getElementById('entryWarning')
  if (sampleUrl === "" || sampleGenre === "") {
    warningEntry.style.display = "block";
    analyzeButton.disabled = false
    return
  }
  warningEntry.style.display = "none";
  analyzeButton.innerText = "Analyzing.."

  var video_id = "";
  var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;  
  var match = sampleUrl.match(regExp);  
  if(match){  
   video_id = match[1]; 
   videoIdElement.innerText = video_id
   warningEntry.style.display = "none"
   getVideo(video_id, warningEntry, sampleGenre);
  } else {
    warningEntry.style.display = "block";
    warningEntry.innerText = 'Invalid Youtube URL!';
    analyzeButton.disabled = false
    analyzeButton.innerText = "Analyze"
  }
}

const getRandomColor = () =>  {
  const colors = ['#ffa580', '#95a4ff', '#ffc8ff']
  const randomInt = Math.floor(Math.random() * colors.length)
  return colors[randomInt]
}

const setLoader = () => {
  return `
  <div id="loader" style="display: none;"></div>
  `
}

function getVideo(video_id, warningEntry, genre){
  let secret = uuidv4()
  let loader = document.getElementById('loader')
  const container = document.getElementById('container')
  if (loader === null) {
    container.innerHTML = setLoader()
    loader = document.getElementById('loader')
  }
  loader.style.borderTopColor = getRandomColor()
  loader.style.display = "block"
  axios.get(`${domain}/app/sample/analyze`, {
    params: {
      video_id: video_id,
      secret: secret,
      genre: genre
    },
    withCredentials: true,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  })
  .then((response) =>  {
    const data = response.data
    const html = getResultsTable(data.sample.videoTitle, data.tempo, data.note)
    container.innerHTML = html
    analyzeButton.style.display = "none"
    downloadButton.style.display = "block"
    // storeResults(data) currently broken
    // runNotification(data) currently broken
  })
  .catch((err) => {
    if (err.message) {
      warningEntry.innerText = "Failed to analyze audio.";
      warningEntry.style.display = "block";
      console.log(err.message)
    }
    analyzeButton.disabled = false
    loader.style.display = "none"
    analyzeButton.innerText = "Analyze"
    // runNotification({}, true) current broken
  })
}
