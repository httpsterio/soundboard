document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById('grid');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Cache for decoded buffers for looping audio and the current source nodes
  const loopBuffers = {}; // key: file URL, value: AudioBuffer
  const loopSources = {}; // key: file URL, value: currently playing AudioBufferSourceNode

  // Fetch our audio configuration JSON
  fetch('audio.json')
    .then(response => response.json())
    .then(data => {
      const audioItems = data.audio;

      audioItems.forEach(item => {
        // Create a button for each audio item
        const btn = document.createElement('button');
        btn.textContent = item.name;

        // If a "special" key exists, add that base class to the button
        if (item.special) {
          btn.classList.add(item.special);
        }

        // For loop items, preload the audio buffer
        if (item.type === "loop") {
          fetch(item.file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
              loopBuffers[item.file] = audioBuffer;
            })
            .catch(err => console.error("Error decoding loop audio for", item.file, err));
        }

        btn.addEventListener('click', () => {
          if (item.type === "loop") {
            // If the loop is playing, stop it and remove the infinite animation and pressed state
            if (loopSources[item.file]) {
              loopSources[item.file].stop();
              loopSources[item.file] = null;
              if (item.special) {
                const loopAnimClass = `animate-${item.special}-loop`;
                btn.classList.remove(loopAnimClass);
              }
              btn.classList.remove("pressed");
            } else {
              // If not playing, start the loop and add the infinite animation and pressed state
              const buffer = loopBuffers[item.file];
              if (!buffer) {
                console.error("Audio buffer not loaded yet for", item.file);
                return;
              }
              const source = audioContext.createBufferSource();
              source.buffer = buffer;
              source.loop = true;
              source.loopStart = (typeof item.loopStart === "number") ? item.loopStart : 0;
              source.loopEnd = (typeof item.loopEnd === "number") ? item.loopEnd : buffer.duration;
              source.connect(audioContext.destination);
              source.start(0);
              loopSources[item.file] = source;
              if (item.special) {
                const loopAnimClass = `animate-${item.special}-loop`;
                btn.classList.add(loopAnimClass);
              }
              btn.classList.add("pressed");
            }
          } else {
            // For one-shot sounds, play the audio and trigger a one-time animation if special exists.
            const audio = new Audio(item.file);
            audio.play();
            // Add "pressed" class immediately
            btn.classList.add("pressed");

            if (item.special) {
              const animationClass = `animate-${item.special}`;
              btn.classList.add(animationClass);
              btn.addEventListener('animationend', function handler() {
                btn.classList.remove(animationClass);
                btn.removeEventListener('animationend', handler);
              });
            }
            // Remove the "pressed" class after 500ms for one-shots
            setTimeout(() => {
              btn.classList.remove("pressed");
            }, 800);
          }
        });

        grid.appendChild(btn);
      });
    })
    .catch(err => console.error("Error loading audio.json:", err));
});


//
//
// disable zooming etc 
document.addEventListener('touchmove', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Prevent gesture events (for older iOS versions)
document.addEventListener('gesturestart', function (event) {
  event.preventDefault();
});

let lastTouchY = 0;
let maybePreventPullToRefresh = false;

document.addEventListener('touchstart', function (e) {
  // Only consider one finger touches
  if (e.touches.length !== 1) return;

  lastTouchY = e.touches[0].clientY;
  // If we're at the top of the page, note that we might be pulling to refresh
  maybePreventPullToRefresh = (window.pageYOffset === 0);
}, { passive: false });

document.addEventListener('touchmove', function (e) {
  const touchY = e.touches[0].clientY;
  const touchYDelta = touchY - lastTouchY;

  // If at the top and swiping down, prevent pull-to-refresh
  if (maybePreventPullToRefresh && touchYDelta > 0) {
    e.preventDefault();
  }
}, { passive: false });