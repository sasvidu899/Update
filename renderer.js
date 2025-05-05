// Get references to HTML elements
const openBtn = document.getElementById('openBtn');
const mediaPlayer = document.getElementById('mediaPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeBar = document.getElementById('volumeBar');
const seekBar = document.getElementById('seekBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');

// Optional: Log elements on startup to ensure they are found
console.log("Checking elements on startup:", {
    openBtn, mediaPlayer, playPauseBtn, muteBtn, volumeBar, seekBar, currentTimeSpan, durationSpan
});

// ----- නිවැරදි formatTime Function එක -----
function formatTime(seconds) {
  // Handle NaN, infinite, or negative cases robustly
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  // Use backticks and correct template literal syntax
  // !!!!! මෙන්න මේ line එක හරියටම තියෙන්න ඕන !!!!!
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
// ----- Function එක මෙතනින් ඉවරයි -----

// --- File Opening Logic ---
openBtn.addEventListener('click', async () => {
  console.log("Open button clicked"); // Debug log
  try {
    // Ensure electronAPI and openFile are available
    if (window.electronAPI && typeof window.electronAPI.openFile === 'function') {
        const filePath = await window.electronAPI.openFile();
        if (filePath) {
          console.log("File selected:", filePath); // Debug log
          mediaPlayer.src = filePath;
          // Reset UI elements for the new file
          playPauseBtn.textContent = '▶️ Play';
          seekBar.value = 0;
          seekBar.max = 0; // Reset max value too
          currentTimeSpan.textContent = "0:00"; // Reset current time display
          durationSpan.textContent = "0:00"; // Reset duration display

          // Important: Load the media to get metadata soon
          mediaPlayer.load(); // Explicitly load the new source

        } else {
           console.log("File selection cancelled"); // Debug log
        }
    } else {
         console.error("window.electronAPI.openFile is not defined. Check preload script.");
         alert("Error: File opening feature is not available. Preload script might have failed.");
    }
  } catch(error) {
     console.error("Error in openFile logic:", error);
     alert(`Error opening file: ${error.message}`);
  }
});

// --- Play/Pause Logic (Improved with async/await) ---
playPauseBtn.addEventListener('click', async () => {
  console.log("Play/Pause button clicked. Current state:", mediaPlayer.paused ? "Paused" : "Playing"); // Debug log
  try {
    // Check if src is set before trying to play
    if (!mediaPlayer.src || mediaPlayer.src === '') {
       console.log("No media source loaded. Please open a file.");
       // Optionally alert the user
       // alert("Please open a media file first.");
       return; // Do nothing if no file is loaded
    }

    if (mediaPlayer.paused || mediaPlayer.ended) {
      await mediaPlayer.play();
      playPauseBtn.textContent = '⏸️ Pause';
      console.log("Playback started or resumed."); // Debug log
    } else {
      mediaPlayer.pause();
      playPauseBtn.textContent = '▶️ Play';
      console.log("Playback paused."); // Debug log
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Play request was interrupted (often normal).');
      // Reflect actual state after interruption
       if (mediaPlayer.paused) {
         playPauseBtn.textContent = '▶️ Play';
      } else {
         playPauseBtn.textContent = '⏸️ Pause';
      }
    } else {
      console.error("Error during play/pause:", error);
      // Optionally inform user about other playback errors
      // alert(`Playback error: ${error.message}`);
    }
  }
});

// --- Mute/Unmute Logic ---
muteBtn.addEventListener('click', () => {
  mediaPlayer.muted = !mediaPlayer.muted;
  console.log("Mute button clicked. Muted state:", mediaPlayer.muted); // Debug log
  if (mediaPlayer.muted) {
    muteBtn.textContent = 'Unmute'; // Use text or find better icons later
    volumeBar.value = 0; // Reflect mute state visually
  } else {
    muteBtn.textContent = 'Mute'; // Use text or find better icons later
    volumeBar.value = mediaPlayer.volume; // Restore volume bar
  }
});

// --- Volume Control Logic ---
volumeBar.addEventListener('input', () => {
  mediaPlayer.volume = volumeBar.value;
  console.log("Volume changed:", mediaPlayer.volume); // Debug log
  // If user changes volume, ensure player is unmuted (unless volume is 0)
  if (mediaPlayer.volume > 0 && mediaPlayer.muted) {
     mediaPlayer.muted = false;
     muteBtn.textContent = 'Mute'; // Update button text
  }
  // Update mute button text based on volume level
  if (mediaPlayer.volume == 0 && !mediaPlayer.muted) {
     muteBtn.textContent = 'Unmute';
  } else if (mediaPlayer.volume > 0 && !mediaPlayer.muted) {
     muteBtn.textContent = 'Mute';
  }
});

// --- Seek Bar & Time Display Logic ---

// Update duration and seek bar max value when metadata loads
mediaPlayer.addEventListener('loadedmetadata', () => {
  const duration = mediaPlayer.duration;
  console.log("Loaded metadata. Duration:", duration); // Debug log
  // Check if duration is a valid finite number
  if (isFinite(duration)) {
     durationSpan.textContent = formatTime(duration);
     seekBar.max = Math.floor(duration);
  } else {
     // Handle cases where duration might be infinite (e.g., live streams) or NaN
     durationSpan.textContent = "0:00"; // Or display "Live" or similar
     seekBar.max = 0; // Or disable seek bar
     console.log("Invalid duration received:", duration);
  }
});

// Update current time display and seek bar position as media plays
mediaPlayer.addEventListener('timeupdate', () => {
  const currentTime = mediaPlayer.currentTime;
  // Update time display using the formatting function
  currentTimeSpan.textContent = formatTime(currentTime);

  // Update seek bar value only if the user is not actively scrubbing
  // A more robust check might involve tracking mousedown/mouseup on the seek bar
  if (!seekBar.matches(':active') && isFinite(currentTime)) {
     // Prevent setting value if it hasn't changed to avoid potential loops
     const currentSeekBarValue = Math.floor(currentTime);
     if (seekBar.value != currentSeekBarValue) {
         seekBar.value = currentSeekBarValue;
     }
  }
});

// Error handling for the media element itself
 mediaPlayer.addEventListener('error', (e) => {
    console.error('Media Element Error:', mediaPlayer.error); // Log the error object
    // Display a user-friendly message
    let errorMessage = 'Unknown error';
    if (mediaPlayer.error) {
        switch (mediaPlayer.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Playback aborted.';
                break;
            case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'A network error occurred.';
                break;
            case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'The media could not be decoded.';
                break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Media format not supported.';
                break;
            default:
                errorMessage = mediaPlayer.error.message || 'An unknown error occurred.';
        }
    }
    console.error('User-facing error message:', errorMessage);
    alert(`Error loading media: ${errorMessage}`);
    // Reset UI potentially
    playPauseBtn.textContent = '▶️ Play';
    currentTimeSpan.textContent = "0:00";
    durationSpan.textContent = "0:00";
    seekBar.value = 0;
    seekBar.max = 0;
 });


// Update media's current time when user interacts with the seek bar
seekBar.addEventListener('input', () => {
  // When the user drags the seek bar, update the media's time
  mediaPlayer.currentTime = seekBar.value;
  // Also update the displayed time immediately for responsiveness
  currentTimeSpan.textContent = formatTime(mediaPlayer.currentTime);
});

// Reset Play button when media ends
mediaPlayer.addEventListener('ended', () => {
  console.log("Playback ended."); // Debug log
  playPauseBtn.textContent = '▶️ Play';
  // Optional: Reset seek bar to the beginning or leave it at the end
  // seekBar.value = 0;
  // currentTimeSpan.textContent = formatTime(0);
});

// Log uncaught errors in the renderer process
window.addEventListener('error', (event) => {
    console.error('Unhandled error in renderer process:', event.error);
});