// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM fully loaded and parsed");

    // Get references to HTML elements INSIDE the DOMContentLoaded listener
    const openBtn = document.getElementById('openBtn');
    const mediaPlayer = document.getElementById('mediaPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeBar = document.getElementById('volumeBar');
    const seekBar = document.getElementById('seekBar');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('duration');

    // Check if elements were found (important for debugging)
    if (!mediaPlayer || !playPauseBtn || !currentTimeSpan || !durationSpan || !seekBar || !volumeBar || !muteBtn || !openBtn) {
        console.error("One or more essential HTML elements not found! Check IDs in index.html.");
        // Optionally alert the user or display an error message in the UI
        alert("Critical UI elements are missing. Please check the application files.");
        return; // Stop execution if essential elements are missing
    }

    console.log("Checking elements on startup:", {
        openBtn, mediaPlayer, playPauseBtn, muteBtn, volumeBar, seekBar, currentTimeSpan, durationSpan
    });

    // Helper function to format time (seconds -> MM:SS)
    function formatTime(seconds) {
      // Handle NaN, infinite, or negative cases robustly
      if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
          return "0:00";
      }
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      // Use backticks and correct template literal syntax
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Function to handle loading a new file path
    function loadFile(filePath) {
        if (filePath) {
            console.log("Loading file:", filePath);
            // Ensure elements are valid before using them
            if (mediaPlayer && playPauseBtn && seekBar && currentTimeSpan && durationSpan) {
                mediaPlayer.src = filePath;
                // Reset UI elements
                playPauseBtn.textContent = '▶️ Play'; // Start with Play icon
                seekBar.value = 0;
                seekBar.max = 0;
                currentTimeSpan.textContent = "0:00";
                durationSpan.textContent = "0:00";
                mediaPlayer.load(); // Load the new source
            } else {
                 console.error("Cannot load file because some UI elements are missing.");
            }
        } else {
            console.log("Received null or undefined file path.");
        }
    }

    // --- File Opening Logic (for the Button) ---
    if(openBtn) {
        openBtn.addEventListener('click', async () => {
          console.log("Open button clicked");
          try {
            if (window.electronAPI && typeof window.electronAPI.openFile === 'function') {
                const filePath = await window.electronAPI.openFile();
                loadFile(filePath); // Use the function to load the file
            } else {
                 console.error("window.electronAPI.openFile is not defined.");
                 alert("Error: File opening feature is not available.");
            }
          } catch(error) {
             console.error("Error in openFile logic:", error);
             // Show specific error message from the image
             if (error instanceof ReferenceError && error.message.includes('currentTimeSpan')) {
                 alert("Error opening file: currentTimeSpan related issue occurred.");
             } else {
                 alert(`Error opening file: ${error.message}`);
             }
          }
        });
    }

    // --- Listener for file path sent from main process (via shortcut) ---
    if (window.ipcRendererEvents && typeof window.ipcRendererEvents.onSetFilePath === 'function') {
        window.ipcRendererEvents.onSetFilePath((filePath) => {
            console.log("Received file path from main process shortcut:", filePath);
            loadFile(filePath); // Use the same function to load the file
        });
    } else {
         console.warn("window.ipcRendererEvents.onSetFilePath is not available. Check preload script.");
    }

    // --- Media Player Event Listeners ---

    if (mediaPlayer) {
        // Play/Pause Logic
        if(playPauseBtn) {
            playPauseBtn.addEventListener('click', async () => {
              console.log("Play/Pause button clicked. Current state:", mediaPlayer.paused ? "Paused" : "Playing");
              try {
                if (!mediaPlayer.src || mediaPlayer.src === '') {
                   console.log("No media source loaded. Please open a file.");
                   return;
                }
                if (mediaPlayer.paused || mediaPlayer.ended) {
                  await mediaPlayer.play();
                  playPauseBtn.textContent = '⏸'; // Pause Icon
                } else {
                  mediaPlayer.pause();
                  playPauseBtn.textContent = '▶'; // Play Icon
                }
              } catch (error) { /* ... Keep existing error handling ... */
                 if (error.name === 'AbortError') { console.log('Play interrupted.'); } else { console.error("Play/pause error:", error); }
                 playPauseBtn.textContent = mediaPlayer.paused ? '▶' : '⏸'; // Sync button
              }
            });
        }

        // Mute/Unmute Logic
        if(muteBtn && volumeBar) {
            muteBtn.addEventListener('click', () => {
              mediaPlayer.muted = !mediaPlayer.muted;
              muteBtn.textContent = mediaPlayer.muted ? '🔇' : (mediaPlayer.volume < 0.5 ? (mediaPlayer.volume == 0 ? '🔇' : '🔉') : '🔊');
              // volumeBar.value = mediaPlayer.muted ? 0 : mediaPlayer.volume; // Optional visual sync
            });
        }

        // Volume Control Logic
        if(volumeBar && muteBtn) {
            volumeBar.addEventListener('input', () => {
              mediaPlayer.volume = volumeBar.value;
              if (mediaPlayer.volume > 0 && mediaPlayer.muted) {
                 mediaPlayer.muted = false;
              }
              muteBtn.textContent = mediaPlayer.muted ? '🔇' : (mediaPlayer.volume < 0.5 ? (mediaPlayer.volume == 0 ? '🔇' : '🔉') : '🔊');
            });
        }

        // Metadata Loaded Logic
        if(durationSpan && seekBar) {
            mediaPlayer.addEventListener('loadedmetadata', () => {
              const duration = mediaPlayer.duration;
              console.log("Loaded metadata. Duration:", duration);
              if (isFinite(duration)) {
                 durationSpan.textContent = formatTime(duration);
                 seekBar.max = Math.floor(duration);
              } else {
                 durationSpan.textContent = "0:00";
                 seekBar.max = 0;
              }
            });
        }

        // Time Update Logic
        if(currentTimeSpan && seekBar) {
            mediaPlayer.addEventListener('timeupdate', () => {
              const currentTime = mediaPlayer.currentTime;
              currentTimeSpan.textContent = formatTime(currentTime);
              if (!seekBar.matches(':active') && isFinite(currentTime)) {
                 const currentSeekBarValue = Math.floor(currentTime);
                 if (seekBar.value != currentSeekBarValue) {
                     seekBar.value = currentSeekBarValue;
                 }
              }
            });
        }

        // Media Error Logic
        mediaPlayer.addEventListener('error', (e) => {
            console.error('Media Element Error:', mediaPlayer.error);
            let errorMessage = 'Unknown error';
            if (mediaPlayer.error) { /* ... Keep existing error message logic ... */ }
            alert(`Error loading media: ${errorMessage}`);
            if(playPauseBtn) playPauseBtn.textContent = '▶️ Play';
            if(currentTimeSpan) currentTimeSpan.textContent = "0:00";
            if(durationSpan) durationSpan.textContent = "0:00";
            if(seekBar) { seekBar.value = 0; seekBar.max = 0; }
        });

        // Seek Bar Input Logic
        if(seekBar && currentTimeSpan) {
            seekBar.addEventListener('input', () => {
              mediaPlayer.currentTime = seekBar.value;
              currentTimeSpan.textContent = formatTime(mediaPlayer.currentTime);
            });
        }

        // Media Ended Logic
        if(playPauseBtn) {
            mediaPlayer.addEventListener('ended', () => {
              console.log("Playback ended.");
              playPauseBtn.textContent = '▶️ Play';
            });
        }
    }

    // Log uncaught errors in the renderer process
    window.addEventListener('error', (event) => {
        console.error('Unhandled error in renderer process:', event.error);
    });

}); // End of DOMContentLoaded listener
