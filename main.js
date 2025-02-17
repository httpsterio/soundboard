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

        if (item.type === "loop") {
          // Preload the audio buffer using the Web Audio API
          fetch(item.file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
              loopBuffers[item.file] = audioBuffer;
            })
            .catch(err =>
              console.error("Error decoding loop audio for", item.file, err)
            );
        }

        btn.addEventListener('click', () => {
          if (item.type === "loop") {
            // If the loop is already playing, stop it and update button style
            if (loopSources[item.file]) {
              loopSources[item.file].stop();
              loopSources[item.file] = null;
              btn.classList.remove('active');
            } else {
              // Ensure the buffer is loaded
              const buffer = loopBuffers[item.file];
              if (!buffer) {
                console.error("Audio buffer not loaded yet for", item.file);
                return;
              }
              // Create a new buffer source and set loop boundaries
              const source = audioContext.createBufferSource();
              source.buffer = buffer;
              source.loop = true;
              source.loopStart =
                typeof item.loopStart === "number" ? item.loopStart : 0;
              source.loopEnd =
                typeof item.loopEnd === "number" ? item.loopEnd : buffer.duration;
              source.connect(audioContext.destination);
              source.start(0, source.loopStart);
              loopSources[item.file] = source;
              btn.classList.add('active');
            }
          } else {
            // For one-shot sounds, simply create and play a new Audio element
            const audio = new Audio(item.file);
            audio.play();
          }
        });

        grid.appendChild(btn);
      });
    })
    .catch(err => console.error("Error loading audio.json:", err));
});

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