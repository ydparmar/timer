import React, { createElement } from 'react';
import { useState, useEffect } from 'react';
import './App.css';
import HackTimer from 'hacktimer'
import { isClickableInput } from '@testing-library/user-event/dist/utils';

let clickedBar = null


function App() {

  // Setting variables
  
  const [orignalSeconds, setOrignalSeconds] = useState(300)
  const [duration, setDuration] = useState(0)
  const [timerState, setTimerState] = useState('off')
  const [today, setToday] = useState(null)

  function getTimer(orignalSeconds) {
      // Calculate hours, minutes, and seconds
      let hoursInDecimal = orignalSeconds/3600
      let hours = Math.floor(Math.round((hoursInDecimal * 10000)) / 10000)
      let minutesInDecimal = (hoursInDecimal - hours) * 60
      let minutes = Math.floor(Math.round((minutesInDecimal * 10000)) / 10000)
      let seconds = Math.round((minutesInDecimal - minutes) * 60) 
  
      // Find out how much to display on timer and page title
      if (orignalSeconds < 10) {
        return seconds
      } else if (orignalSeconds < 60) {
        return String(seconds).padStart(2, '0')
      } else if (orignalSeconds < 600) {
        return `${minutes}:${String(seconds).padStart(2, '0')}`
      } else if (orignalSeconds < 3600) {
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      } else {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
    }

    function openEditScreen() {
      if (document.getElementById('editBarScreen').style.display === "block") {
        return
      }
      clickedBar = this
      document.getElementById('editBarScreen').style.display="block"
      document.getElementById('barTimeValue').textContent= getTimer(clickedBar.dataset.time)
      document.getElementById('barSlider').max=clickedBar.dataset.time
      document.getElementById('barSlider').value=clickedBar.dataset.time

      document.getElementById('deleteButton').addEventListener("click", handleDelete)
      document.getElementById('barSlider').addEventListener("input", handleBarSizeChange)
      document.getElementById('exitButton').addEventListener("click", handleExit)
    }

    function handleDelete() {
      if (clickedBar.parentNode.childElementCount === 2) {
        clickedBar.parentNode.remove()
      } else {
        clickedBar.remove()
      }      
      closeEditScreen()
    }
  
    function handleBarSizeChange() {
      document.getElementById('barTimeValue').textContent = getTimer(document.getElementById('barSlider').value)
      clickedBar.dataset.time=document.getElementById('barSlider').value
      clickedBar.style.width = String(Math.ceil(document.getElementById('barSlider').value/15)) + "px"
    }

    function handleExit() {
      if (clickedBar.dataset.time === '0') {
        document.getElementById('deleteButton').click()
      } else {
        closeEditScreen()
      }
    }

    function closeEditScreen() {
      document.getElementById('deleteButton').removeEventListener("click", handleDelete)
      document.getElementById('barSlider').removeEventListener("input", handleBarSizeChange)
      document.getElementById('exitButton').removeEventListener("click", handleExit)
      document.getElementById('editBarScreen').style.display="none"
    }

  useEffect(() => { // This useEffect only fires when the component renders for the first time

    // To clear local storage set the following value to true
    const clearLocalStorage = false
    if (clearLocalStorage) {
      localStorage.clear()
      window.location.reload(true);
    }

    if (localStorage) {
      // Setting up progressBarSection
      document.getElementById('progressBarSection').outerHTML = localStorage.getItem("progressBarSection");
      for (const day of document.getElementById('progressBarSection').children) {
        for (let i = 1; i < day.children.length; i++) {
          day.children[i].addEventListener("click", openEditScreen)
        }
      }

      // Setting up date
      if (document.getElementById("today") !== null) {
        setToday(localStorage.getItem("today"))
      }

      // Setting up orignal slider value
      document.getElementById('input').value = localStorage.getItem("inputValue")
      setOrignalSeconds(localStorage.getItem("inputValue"))

      // Asking permission for notifications
        Notification.requestPermission()
    }
  }, [])

  function checkForNewDay() {

    // Checking if it is a new day/user's first session
    if (today !== (new Date()).toLocaleDateString() || document.getElementById('today') === null) {

      // Setting new date
      setToday((new Date()).toLocaleDateString())

      // If it is not the user's first session then this removes the previous day's id as "today"
      if (document.getElementById('today')) {
        document.getElementById('today').id = ''
      }

      // Creating new day in progressBarSection
      const newDay = document.createElement('div')
      newDay.className = 'day'
      newDay.id = "today"
      document.getElementById('progressBarSection').prepend(newDay)

      // Adding date to day
      const date = document.createElement('p')
      date.className = 'date'
      date.textContent = String(new Date()).slice(0, 10)
      document.getElementById('today').appendChild(date)
      
      // Checking if currentBar has to continue into new day
      if (document.getElementById('currentBar')) {
        document.getElementById('currentBar').id = 'pendingBar'
        handleStartClick(false) // This is for creating a new bar. The parameter is there so it doesn't check for new day again
      }
    }
  }


  useEffect(() => {
    
    let timer = getTimer(orignalSeconds)
    document.getElementById('timer').textContent = timer
    document.title = timer

    // If timer reaches 0 seconds
    if (orignalSeconds === 0 && timerState === 'down') {
      
      // Changes CSS to not display stop button and make timer color greenish
        const newFinishButtonStyle = {
          display: "block",
          margin: "auto",
          left: '0',
          width: '400px'
        }
        document.getElementById('stopButton').style.display = "none"
        document.getElementById('timer').style.color = "#d4ffd4"
        Object.assign(document.getElementById('finishButton').style,newFinishButtonStyle)
        
        // Changing tab icon
        document.getElementById('icon').href = 'https://harlequin-deena-55.tiiny.site/94827df8b952f3c163f7a1889957ab1d.png'

        // Sending notification
        new Notification("Timer", {
          body: "Timer is over",
          icon: "https://static.vecteezy.com/system/resources/previews/028/755/500/non_2x/stopwatch-timer-clock-free-png.png",
        });

        setTimerState('up')
    }

    // For every second
    if (timerState !== 'off') {
      checkForNewDay()

      // Subtracting or adding 1 second
      const intervalId = setInterval(() => {
        timerState === 'down' ? setOrignalSeconds(prev => prev - 1) : setOrignalSeconds(prev => prev + 1)
        setDuration(prev => prev + 1)
      }, 1000)

      // Adding 1 px to progress bar every 15 seconds
      document.getElementById('currentBar').style.width = String(Math.ceil(duration/15)) + "px"

      document.getElementById('currentBar').dataset.time=duration

      // Removing interval
      return () => {
        clearInterval(intervalId)
      }
    }
  })

  function handleStartClick(CheckNewDay=true) {

    if (CheckNewDay) {
      checkForNewDay()
    }

    // Creating new bar
    const newBar = document.createElement('div')
    newBar.className="progressBar"
    newBar.id="currentBar"
    document.getElementById('today').appendChild(newBar)
    setTimeout(() => {
      newBar.style.width = '1px'
    }, 0);

    // Creating a tooltip showing when the bar was created
    const newTime = document.createElement('p')
    newTime.className = "time"
    const time = (new Date()).toLocaleTimeString()
    time.length === 10 ? newTime.textContent = time.slice(0, 4) + time.slice(7) : newTime.textContent = time.slice(0, 5) + time.slice(8)
    newBar.appendChild(newTime)
    
    // Changing display
    if (CheckNewDay) {
      document.getElementById('input').style.display = "none"
      document.getElementById('startButton').style.display = "none"
      document.getElementById('stopButton').style.display = "inline"
      document.getElementById('finishButton').style.display = "inline"
      setTimerState('down')
    }
  }


  function handleEndClick(finished) {
    // Changing display
    document.getElementById('input').style.display = "block"
    document.getElementById('timer').style.color = '#fff9ed'
    document.getElementById('startButton').style.display = "block"
    document.getElementById('stopButton').style.display = "none"
    const oldFinishButtonStyle = {
          display: "none",
          margin: "0",
          left: '60px',
          width: '300px'
        }
    Object.assign(document.getElementById('finishButton').style,oldFinishButtonStyle)

    // Resetting icon
    document.getElementById('icon').href = 'https://static.vecteezy.com/system/resources/previews/028/755/500/non_2x/stopwatch-timer-clock-free-png.png'
    
    // Setting progress bar color
    finished ? document.getElementById('currentBar').style.backgroundColor = '#64b85cdb' : document.getElementById('currentBar').style.backgroundColor = '#cc5247d9'
    document.getElementById('currentBar').addEventListener("click", openEditScreen)
    document.getElementById('currentBar').id = ''
    if (document.getElementById('pendingBar')) {
      finished ? document.getElementById('pendingBar').style.backgroundColor = '#64b85cdb' : document.getElementById('pendingBar').style.backgroundColor = '#cc5247d9'
      document.getElementById('pendingBar').addEventListener("click", openEditScreen)
      document.getElementById('pendingBar').id = ''
    }


    // Resetting timer
    setTimerState('off')
    setOrignalSeconds(document.getElementById('input').value)
    setDuration(0)

  }

  // On closing/reloading tab
  window.addEventListener('beforeunload', () => {
    
    // Saving progressBarSection and input value and day
    localStorage.setItem("progressBarSection", document.getElementById('progressBarSection').outerHTML);
    localStorage.setItem("inputValue", document.getElementById('input').value)
    localStorage.setItem("today", today)

    // Setting current bar to red or green
    if (document.getElementById('currentBar') !== null) {
      document.getElementById('stopButton').style.display === 'none' ? document.getElementById('currentBar').style.backgroundColor = "#64b85cdb" : document.getElementById('currentBar').style.backgroundColor = "#cc5247d9"
      if (document.getElementById('pendingBar')) {
        document.getElementById('stopButton').style.display === 'none' ? document.getElementById('pendingBar').style.backgroundColor = "#64b85cdb" : document.getElementById('pendingBar').style.backgroundColor = "#cc5247d9"
      }
      document.getElementById('currentBar').id = ''
    }
    
    if (document.getElementById('editBarScreen').style.display === "block") {
      handleExit()
    }
  });


  // HTML
  return (
    <>
      <div id="timerAndButtonsContainer">
        <p id="timer"></p>
        <input className="slider" id="input" type="range" min="300" max="7200" step="300" defaultValue="300" onChange={({ target }) => {setOrignalSeconds(target.value)}}></input>
        <button id="startButton" className="button" onClick={handleStartClick}>Start</button>
        <button id="stopButton" className="button" onClick={() => {handleEndClick(false)}}>Stop</button>
        <button id="finishButton" className="button" onClick={() => {handleEndClick(true)}}>Finish</button>
      </div>
      <div id="progressBarSection"></div>
      <div id="editBarScreen">
      <button id="exitButton" className='button'>✖</button>
        <h1 id="editBarScreenHeader">Edit Bar</h1>
        <p id="barTime">Duration: <span id="barTimeValue"></span></p>
        <input id="barSlider" className="slider" type="range" min="0" max="500"></input>
        <button id="deleteButton" className='button'>Delete</button>
      </div>
    </>
  )
}

export default App;