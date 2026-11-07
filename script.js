function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  const isOpen = menu.classList.toggle("open");
  icon.classList.toggle("open", isOpen);
  icon.setAttribute("aria-expanded", String(isOpen));
  icon.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

/* --- Image Modal Functions --- */
var modal = document.getElementById("imageModal");
var modalImages = document.querySelectorAll(".modal-image");
var modalCloseBtn = modal ? modal.querySelector(".close-btn") : null;
var lastFocusedElement = null;

// Function to open the modal
function openImageModal(modalId) {
  lastFocusedElement = document.activeElement;

  // Hide all images
  modalImages.forEach(function (img) {
    img.style.display = "none";
  });

  // Show the specific image
  var imgToShow = document.getElementById(modalId);
  if (imgToShow) {
    imgToShow.style.display = "block";
  }

  modal.style.display = "flex"; // Show the modal overlay
  if (modalCloseBtn) modalCloseBtn.focus();
}

// Function to close the modal
function closeImageModal() {
  modal.style.display = "none"; // Hide the modal
  if (lastFocusedElement) lastFocusedElement.focus();
}

function isModalOpen() {
  return modal && modal.style.display === "flex";
}

// Close the modal if the user clicks on the backdrop
window.addEventListener("click", function (event) {
  if (event.target === modal) {
    closeImageModal();
  }
});

// Keyboard: Escape closes the modal / mobile menu; Tab stays inside the modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    if (isModalOpen()) {
      closeImageModal();
      return;
    }
    var menu = document.querySelector(".menu-links");
    if (menu && menu.classList.contains("open")) {
      toggleMenu();
      document.querySelector(".hamburger-icon").focus();
    }
  }
  if (event.key === "Tab" && isModalOpen()) {
    event.preventDefault(); // the close button is the only focusable element
    if (modalCloseBtn) modalCloseBtn.focus();
  }
});

/* --- Live demo: wake the free Render server before the visitor clicks --- */
(function () {
  var status = document.getElementById("automob-status");
  if (!status) return;

  var demoUrl = status.getAttribute("data-demo-url");
  var text = status.querySelector(".demo-status-text");
  var started = false;

  function setState(state, message) {
    status.setAttribute("data-state", state);
    text.textContent = message;
    window.demoStatus = { state: state, message: message };
    document.dispatchEvent(new CustomEvent("demostatus", { detail: window.demoStatus }));
  }

  function wake() {
    if (started) return;
    started = true;

    // Respect Data Saver: keep the static note and skip the background request.
    var conn = navigator.connection;
    if (conn && conn.saveData) return;

    setState("waking", "Waking up the demo server. This can take up to 90 seconds.");

    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 100000);

    // no-cors: we only need to know the server answered, not read the response.
    fetch(demoUrl, { mode: "no-cors", cache: "no-store", signal: controller.signal })
      .then(function () {
        clearTimeout(timer);
        setState("ready", "The demo server is awake. The live demo should open quickly.");
      })
      .catch(function () {
        clearTimeout(timer);
        setState("slow", "The demo server is slow to respond. You can still open the demo and wait a moment.");
      });
  }

  window.wakeDemo = wake; // the footer status board can trigger the same wake-up

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          wake();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(status);
  } else {
    wake();
  }
})();

/* --- Footer status board: demo server, latest commit, clocks, page load --- */
(function () {
  var board = document.querySelector(".status-board");
  if (!board) return;

  var GITHUB_USER = "Srinivas800";
  var demoWrap = document.getElementById("st-demo-wrap");
  var demoText = document.getElementById("st-demo");
  var commitEl = document.getElementById("st-commit");
  var localEl = document.getElementById("st-local");
  var istEl = document.getElementById("st-ist");
  var loadEl = document.getElementById("st-load");

  /* demo server */
  var LABELS = {
    idle: "Not checked yet",
    waking: "Waking up…",
    ready: "Awake",
    slow: "Slow to respond"
  };

  function showDemo(state) {
    demoWrap.setAttribute("data-state", state);
    demoText.textContent = LABELS[state] || LABELS.idle;
  }

  showDemo(window.demoStatus ? window.demoStatus.state : "idle");
  document.addEventListener("demostatus", function (e) {
    showDemo(e.detail.state);
  });

  /* clocks */
  var localFmt = null;
  var istFmt = null;
  try {
    localFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short"
    });
    istFmt = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata"
    });
  } catch (e) {}

  function tick() {
    var now = new Date();
    if (localFmt) localEl.textContent = localFmt.format(now);
    if (istFmt) istEl.textContent = istFmt.format(now) + " IST";
  }

  var clockTimer = null;
  function startClock() {
    if (clockTimer || !localFmt) return;
    tick();
    clockTimer = setInterval(tick, 1000);
  }
  function stopClock() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
  }

  /* page load time */
  function showLoadTime() {
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (nav && nav.loadEventEnd > 0) {
      loadEl.textContent = "Loaded in " + Math.round(nav.loadEventEnd) + " ms";
    } else if (document.readyState !== "complete") {
      window.addEventListener("load", function () {
        setTimeout(showLoadTime, 0);
      });
    } else {
      loadEl.textContent = "Not available";
    }
  }
  showLoadTime();

  /* latest GitHub commit (cached for 15 minutes to stay under the API rate limit) */
  function relTime(iso) {
    var sec = (Date.now() - new Date(iso).getTime()) / 1000;
    if (sec < 60) return "just now";
    var min = sec / 60;
    if (min < 60) return Math.floor(min) + " min ago";
    var hr = min / 60;
    if (hr < 24) return Math.floor(hr) + " h ago";
    var day = hr / 24;
    if (day < 30) return Math.floor(day) + " days ago";
    if (day < 365) return Math.floor(day / 30) + " months ago";
    return Math.floor(day / 365) + " years ago";
  }

  function renderCommit(d) {
    commitEl.textContent = "";
    var wrap = document.createElement("span");
    var link = document.createElement("a");
    var msg = d.msg.length > 60 ? d.msg.slice(0, 57) + "…" : d.msg;
    link.textContent = d.repo + ": " + msg;
    if (/^https:\/\/github\.com\//.test(d.url)) {
      link.href = d.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    var when = document.createElement("span");
    when.className = "st-when";
    when.textContent = relTime(d.date);
    wrap.appendChild(link);
    wrap.appendChild(when);
    commitEl.appendChild(wrap);
  }

  function renderCommitError() {
    commitEl.textContent = "";
    var link = document.createElement("a");
    link.href = "https://github.com/" + GITHUB_USER;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Couldn't reach GitHub. See my profile";
    commitEl.appendChild(link);
  }

  function loadCommit() {
    var KEY = "st-commit-v1";
    try {
      var cached = JSON.parse(sessionStorage.getItem(KEY));
      if (cached && Date.now() - cached.t < 900000) {
        renderCommit(cached.d);
        return;
      }
    } catch (e) {}

    var opts = { headers: { Accept: "application/vnd.github+json" } };
    fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?sort=pushed&per_page=1", opts)
      .then(function (r) {
        if (!r.ok) throw new Error("repos");
        return r.json();
      })
      .then(function (repos) {
        var name = repos[0].name;
        return fetch("https://api.github.com/repos/" + GITHUB_USER + "/" + encodeURIComponent(name) + "/commits?per_page=1", opts)
          .then(function (r) {
            if (!r.ok) throw new Error("commits");
            return r.json();
          })
          .then(function (commits) {
            return {
              repo: name,
              msg: String(commits[0].commit.message).split("\n")[0],
              date: commits[0].commit.author.date,
              url: commits[0].html_url
            };
          });
      })
      .then(function (d) {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d }));
        } catch (e) {}
        renderCommit(d);
      })
      .catch(renderCommitError);
  }

  /* start work only when the board is on screen */
  var started = false;
  function onVisible() {
    startClock();
    if (!started) {
      started = true;
      loadCommit();
      if (window.wakeDemo) window.wakeDemo();
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) onVisible();
      else stopClock();
    }, { rootMargin: "100px" }).observe(board);
  } else {
    onVisible();
  }
})();
