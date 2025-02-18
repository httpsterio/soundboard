document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById('grid');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Cache for decoded buffers for looping audio and the current source nodes
  const loopBuffers = {}; // key: file url, value: AudioBuffer
  const loopSources = {}; // key: file url, value: currently playing source

  // Fetch our audio configuration JSON
  fetch('audio.json')
    .then(response => response.json())
    .then(data => {
      const audioItems = data.audio;

      audioItems.forEach(item => {
        // Create a button for each audio item
        const btn = document.createElement('button');
        btn.textContent = item.name;


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
            // If the loop is playing, stop it and remove the infinite animation
            if (loopSources[item.file]) {
              loopSources[item.file].stop();
              loopSources[item.file] = null;
              if (item.special) {
                const loopAnimClass = `animate-${item.special}-loop`;
                btn.classList.remove(loopAnimClass);
              }
            } else {
              // If not playing, start the loop and add the infinite animation class
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
            }
          } else {
            // For one-shot sounds, simply play the audio and trigger a one-time animation if special exists.
            const audio = new Audio(item.file);
            audio.play();
            if (item.special) {
              const animationClass = `animate-${item.special}`;
              btn.classList.add(animationClass);
              btn.addEventListener('animationend', function handler() {
                btn.classList.remove(animationClass);
                btn.removeEventListener('animationend', handler);
              });
            }
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