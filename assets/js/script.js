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

// Training Quiz 

(function () {
    const quizEl = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitQuizBtn');
    const retryBtn = document.getElementById('retryQuizBtn');
    const resultEl = document.getElementById('quizResult');
    const progressBar = document.getElementById('quizProgressBar');

    if (!quizEl || !submitBtn) return; // not on this page

    /* Layout of the questions */
    const questions = [
        {
        id: "q1",
        type: "multi", 
        title: "What equipment do you have to set up for the students? (Select all that apply)",
        options: [
            { text: "Battery pack", correct: true },
            { text: "Whole circuit", correct: false }, 
            { text: "Micro:bit to the laptop (via USB wire)", correct: true },
            { text: "Micro:bit adapter", correct: true }
        ],
        feedback: "Ensure students have power (battery pack), the Micro:bit connected via USB, and the Micro:bit adapter. The students will typically assemble the circuit themselves."
        },
        {
        id: "q2",
        type: "single",
        title: "After coding, what should you do to the code appears on the physical Micro:bit?",
        options: [
            { text: "It will already work without downloading", correct: false },
            { text: "Press the play button", correct: false },
            { text: "Download the file", correct: false },
            { text: "Download the file and pair the Micro:bit", correct: true }
        ],
        feedback: "Download the program and pair it to the Micro:bit for it to run on the device."
        },
        {
        id: "q3",
        type: "single",
        title: "What does a 1 and 0 mean when setting the digital pin?",
        options: [
            { text: "1 means in use, 0 means not in use", correct: false },
            { text: "1 means on, 0 means off", correct: true },
            { text: "1 means off, 0 means on", correct: false },
            { text: "1 means on, 0 doesn’t do anything", correct: false }
        ],
        feedback: "Digital pins are binary: 1 = ON (HIGH), 0 = OFF (LOW)."
        },
        {
        id: "q4",
        type: "single",
        title: "Which pin is the P0 pin on the Micro:bit controller? (Orientation from slides)",
        options: [
            { text: "Bottom row, leftmost pin", correct: false },
            { text: "Bottom row, pin one from the right", correct: false },
            { text: "Top row, leftmost pin", correct: false },
            { text: "Bottom row, 2nd pin from the left", correct: true }
        ],
        feedback: "P0 is the 2nd pin from the left in the common orientation used in slides."
        },
        {
        id: "q5",
        type: "single",
        title: "Why do we need a variable in Activity 4?",
        options: [
            { text: "To change the state of the alarm when required", correct: true },
            { text: "We don’t need it", correct: false },
            { text: "Just to make it look better", correct: false },
            { text: "So that the file can be downloaded onto the Micro:bit", correct: false }
        ],
        feedback: "A variable lets your program remember and switch the alarm state when needed."
        },
        {
        id: "q6",
        type: "single",
        title: "What signals a good SOS?",
        options: [
            { text: "1 short burst, 1 long burst", correct: false },
            { text: "2 short bursts, 3 long bursts, 2 short bursts", correct: false },
            { text: "1 short burst, 1 long burst, 1 short burst", correct: false },
            { text: "3 short bursts, 3 longer bursts, 3 short bursts", correct: true }
        ],
        feedback: "SOS is ••• - - - ••• (three short, three long, three short)."
        },
        {
        id: "q7",
        type: "single",
        title: "What happens if there is no resistor in series with the LED?",
        options: [
            { text: "Nothing happens", correct: false },
            { text: "LED doesn’t light up", correct: false },
            { text: "LED will eventually break", correct: true },
            { text: "LED brightness will continuously go from bright to dim", correct: false }
        ],
        feedback: "Without a resistor the LED can draw too much current and be damaged."
        },
        {
        id: "q8",
        type: "single",
        title: "For Activity 2, what pin do we connect to the resistor?",
        options: [
            { text: "P1", correct: false },
            { text: "P0", correct: false },
            { text: "3V", correct: true },
            { text: "Ground (GND)", correct: false }
        ],
        feedback: "Use the 3V supply for the resistor in this activity."
        }
    ];

    /** Render */
    function renderQuiz() {
        quizEl.innerHTML = "";
        questions.forEach((q, idx) => {
        const card = document.createElement("section");
        card.className = "q-card";
        card.dataset.qid = q.id;
        card.dataset.type = q.type;

        const badge = q.type === "multi" ? `<span class="q-badge" aria-label="Multiple selection">Multi</span>` :
                        `<span class="q-badge" aria-label="Single selection">Single</span>`;

        card.innerHTML = `
            <div class="q-title">
            <span>${idx + 1}. ${q.title}</span> ${badge}
            </div>
            <ul class="choice-list" role="group" aria-labelledby="${q.id}-label"></ul>
            <div class="q-feedback" id="${q.id}-feedback" hidden></div>
        `;

        const list = card.querySelector(".choice-list");

        q.options.forEach((opt, oi) => {
            const li = document.createElement("li");
            li.className = "choice";
            li.tabIndex = 0;
            li.dataset.type = q.type === "multi" ? "multi" : "single";
            li.dataset.index = String(oi);
            li.setAttribute("role", "button");
            li.setAttribute("aria-pressed", "false");

            const input = document.createElement("input");
            input.type = q.type === "multi" ? "checkbox" : "radio";
            input.name = q.id;
            input.ariaLabel = opt.text;

            const label = document.createElement("div");
            label.className = "choice-text";
            label.textContent = opt.text;

            li.appendChild(input);
            li.appendChild(label);
            list.appendChild(li);

            function toggleSelection(ev) {
            if (ev.target && ev.target.tagName === "INPUT") return;
            if (q.type === "single") {
                [...list.children].forEach(c => {
                c.classList.remove("selected");
                const inp = c.querySelector("input");
                inp.checked = false;
                c.setAttribute("aria-pressed", "false");
                });
                li.classList.add("selected");
                input.checked = true;
                li.setAttribute("aria-pressed", "true");
            } else {
                const isNow = !li.classList.contains("selected");
                li.classList.toggle("selected", isNow);
                input.checked = isNow;
                li.setAttribute("aria-pressed", isNow ? "true" : "false");
            }
            updateProgress();
            }

            li.addEventListener("click", toggleSelection);
            li.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                toggleSelection(e);
            }
            });
        });

        quizEl.appendChild(card);
        });

        updateProgress();
        resultEl.textContent = "";
        retryBtn.hidden = true;
    }

    /* Grading */
    function gradeQuiz() {
    let correctCount = 0;

    questions.forEach(q => {
        const card = quizEl.querySelector(`.q-card[data-qid="${q.id}"]`);
        const choices = [...card.querySelectorAll(".choice")];

        const selectedIdx = choices
        .map((c, i) => ({ i, selected: c.classList.contains("selected") }))
        .filter(o => o.selected)
        .map(o => o.i);

        const correctIdx = q.options
        .map((o, i) => (o.correct ? i : -1))
        .filter(i => i !== -1);

        choices.forEach((c, i) => {
        const isCorrect = !!q.options[i].correct;
        const isSelected = c.classList.contains("selected");
        c.classList.remove("correct", "incorrect");
        if (isSelected && isCorrect) c.classList.add("correct");
        if (isSelected && !isCorrect) c.classList.add("incorrect");
        });

        const isQCorrect =
        selectedIdx.length === correctIdx.length &&
        selectedIdx.every(i => correctIdx.includes(i));

        if (isQCorrect) correctCount += 1;

        const fb = card.querySelector(`#${q.id}-feedback`);
        fb.hidden = false;
        fb.textContent = isQCorrect ? "✅ Correct." : "❌ Incorrect.";
    });

    const total = questions.length;
    resultEl.textContent = `Score: ${correctCount} / ${total}`;
    retryBtn.hidden = false;

    const finishBtn = document.getElementById("finishLessonBtn");
    finishBtn.hidden = correctCount !== total;
    }


    /* Progress bar = proportion of questions with at least one selection */
    function updateProgress() {
        const cards = [...quizEl.querySelectorAll(".q-card")];
        const answered = cards.filter(card =>
        [...card.querySelectorAll(".choice")].some(c => c.classList.contains("selected"))
        ).length;
        const pct = Math.round((answered / questions.length) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
    }

    /* Reset the Quiz*/
    function resetQuiz() {
        renderQuiz();
    }

    //Event listeners
    submitBtn.addEventListener("click", gradeQuiz);
    retryBtn.addEventListener("click", resetQuiz);

    // Initial render
    renderQuiz();
})();

(function ensureYTAPI(){
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();

(function () {
    const VIDEO_ID = "w5F2jX5V7U8";
    const playBtn  = document.getElementById("playPauseBtn");
    const timeLab  = document.getElementById("timeLabel");
    const nextBtn  = document.getElementById("nextBtn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const playerContainer = document.getElementById("ytPlayer").parentElement;

    fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        playerContainer.requestFullscreen().catch(err => {
        console.warn("Fullscreen request failed:", err);
        });
    } else {
        document.exitFullscreen();
    }
    });

    const TOL = 0.75; 
    let player, duration = 0;
    let maxAllowedTime = 0;
    let unlocked = false;
    let pollTimer = null;

    function fmt(s) {
        s = Math.max(0, Math.floor(s || 0));
        return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    }
    function updateLabel(t=0) {
        timeLab.textContent = `${fmt(t)} / ${fmt(duration||0)}`;
    }
    function showNext() {
        if (!unlocked) {
        unlocked = true;
        nextBtn.style.display = "inline-block";
        }
    }

    function startPoll() {
        if (pollTimer) return;
        pollTimer = setInterval(() => {
        if (!player) return;
        const t = player.getCurrentTime() || 0;
        duration = player.getDuration() || duration || 0;
        if (t > maxAllowedTime) maxAllowedTime = t;
        if (duration && (duration - t) <= TOL) showNext();
        updateLabel(t);
        }, 300);
    }
    function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

    // YouTube API calls this when ready
    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('ytPlayer', {
        videoId: VIDEO_ID,
        playerVars: {
            controls: 0,         //Hide native controls (no skipping)
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: location.origin
        },
        events: {
            onReady: () => {
            duration = player.getDuration() || 0;
            updateLabel(0);
            },
            onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
                startPoll();
                playBtn.textContent = "Pause";
            }
            if (e.data === YT.PlayerState.PAUSED) {
                stopPoll();
                playBtn.textContent = "Play";
            }
            if (e.data === YT.PlayerState.ENDED) {
                stopPoll();
                showNext();
            }
            }
        }
        });
    };

    // Custom Play/Pause
    playBtn.addEventListener("click", () => {
        if (!player) return;
        const state = player.getPlayerState();
        if (state !== YT.PlayerState.PLAYING) {
        player.playVideo();
        } else {
        player.pauseVideo();
        }
    });
})();