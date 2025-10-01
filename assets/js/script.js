// ---- Inject the navbar from a partial ----
document.addEventListener("DOMContentLoaded", async () => {
    const navbarHost = document.getElementById("navbar");
    if (navbarHost) {
        const src = navbarHost.getAttribute("data-navbar-src");
        try {
            if (!src) throw new Error("Missing data-navbar-src on #navbar");
            const res = await fetch(src, { cache: "no-store" });
            if (!res.ok) throw new Error(`Navbar fetch failed: ${res.status}`);
            navbarHost.innerHTML = await res.text();
        } catch (err) {
            console.warn("Navbar load error:", err);
            navbarHost.innerHTML = `<nav class="navbar">
                <a href="index.html" class="nav-btn">Home</a>
                <img src="../assets/images/White-Robogals-logo.png" alt="Robogals Logo" class="logo">
            </nav>`;
        }
    }
});

(() => {
    const VIDEO_ID = "robogals-induction-v1";
    const video = document.getElementById("trainingVideo");
    const playBtn  = document.getElementById("playPauseBtn");
    const timeLab  = document.getElementById("timeLabel");
    const nextBtn  = document.getElementById("nextBtn");
    if (!video) return;

    // --- Settings ---
    const TOL = 0.75; // seconds to consider the vid is finished
    let maxAllowedTime = 0;
    let unlocked = false;

    function showNext() {
        if (unlocked) return;
            unlocked = true;
        // stop the guard from snapping at the very end
        if (Number.isFinite(video.duration)) maxAllowedTime = video.duration;
            nextBtn.style.display = "inline-block";
    }
    function hideNextAndReset(){
        unlocked = false;
        nextBtn.style.display = "none";
        maxAllowedTime = 0;
    }

    function fmt(s) {
        s = Math.max(0, Math.floor(s || 0));
        return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    }
    function updateLabel() {
        if (timeLab) timeLab.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration||0)}`;
    }

    // ----- No skip guard -----
    video.addEventListener("seeking", () => {
        if (video.currentTime > maxAllowedTime + 0.5) {
        video.currentTime = Math.min(maxAllowedTime, video.duration || 0);
        }
    });

    video.addEventListener("timeupdate", () => {
        if (Number.isFinite(video.duration)) {
        if (video.currentTime > maxAllowedTime) {
            maxAllowedTime = video.currentTime;
        }
        if ((video.duration - video.currentTime) <= TOL) {
            showNext();
        }
        }
        updateLabel();
    });

    video.addEventListener("loadedmetadata", () => {
        updateLabel(); 
    });

    video.addEventListener("ended", showNext);

    // ----- Play/Pause button -----
    if (playBtn) {
        playBtn.addEventListener("click", () => {
        if (video.paused) {
            video.play().then(() => {
            playBtn.textContent = "Pause";
            playBtn.setAttribute("aria-label", "Pause");
            }).catch(()=>{});
        } else {
            video.pause();
            playBtn.textContent = "Play";
            playBtn.setAttribute("aria-label", "Play");
        }
        });
    }

    // ----- Pause when tab/window inactive -----
    function pauseForInactivity() {
        if (!video.paused) {
        video.pause();
        if (playBtn) {
            playBtn.textContent = "Play";
            playBtn.setAttribute("aria-label", "Play");
        }
        }
    }
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") pauseForInactivity();
    });
    window.addEventListener("blur", pauseForInactivity);

    video.addEventListener("seeked", () => {
        if (unlocked && video.currentTime < 0.5) {
            hideNextAndReset();
        }
    });
    // safety feature for forward jumps
    setInterval(() => {
        if (video.currentTime > maxAllowedTime + 0.5) {
        video.currentTime = Math.min(maxAllowedTime, video.duration || 0);
        }
    }, 500);
})();