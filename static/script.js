// ===========================================================
// 1. Grab the HTML elements we need to read from / write to
// ===========================================================
const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");

const ringProgress = document.getElementById("ring-progress");
const scoreNumber = document.getElementById("score-number");
const resultTitle = document.getElementById("result-title");
const resultText = document.getElementById("result-text");

// The circle in style.css has stroke-dasharray: 377
// (that's the circumference of the ring, so 100% progress = 377)
const RING_CIRCUMFERENCE = 377;

// ===========================================================
// 2. Listen for the form being submitted
// ===========================================================
form.addEventListener("submit", async function (event) {
  event.preventDefault(); // stop the browser from reloading the page

  errorMsg.textContent = "";
  showLoadingState();

  // Build a plain JS object from the form fields.
  // The keys here MUST match the field names FastAPI expects
  // (see the StudentData model in main.py).
  const payload = {
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value,
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: Number(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: Number(document.getElementById("daily_unlocks").value),
    study_hours: Number(document.getElementById("study_hours").value),
    physical_activity_hours: Number(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: Number(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value,
  };

  try {
    // Send the data to our FastAPI backend
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Something went wrong on the server.");
    }

    const data = await response.json();
    showScore(data.predicted_mental_health_score);
  } catch (err) {
    showError(err.message);
  }
});

// ===========================================================
// 3. Helper functions that update the right-hand result card
// ===========================================================

function showLoadingState() {
  submitBtn.disabled = true;
  submitBtn.textContent = "Reading your signal...";

  scoreNumber.textContent = "";
  resultTitle.textContent = "Reading the signal...";
  resultText.textContent = "Running your habits through the model.";

  ringProgress.classList.add("spinning");
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE; // hide the static progress while spinning
}

function showScore(score) {
  submitBtn.disabled = false;
  submitBtn.textContent = "Read my signal";

  ringProgress.classList.remove("spinning");

  // Turn the 0-10 score into how much of the ring should be filled
  const fraction = Math.min(Math.max(score / 10, 0), 1);
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;

  scoreNumber.textContent = score;

  const { title, text } = describeScore(score);
  resultTitle.textContent = title;
  resultText.textContent = text;
}

function showError(message) {
  submitBtn.disabled = false;
  submitBtn.textContent = "Read my signal";

  ringProgress.classList.remove("spinning");
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;

  scoreNumber.textContent = "–";
  resultTitle.textContent = "Couldn't generate a score";
  resultText.textContent = "Please check your entries and try again.";

  errorMsg.textContent = message;
}

// Turns a raw number into a friendly title + description.
// This is just descriptive copy for the model's output —
// not a medical or diagnostic statement.
function describeScore(score) {
  if (score >= 7) {
    return {
      title: "Looking steady",
      text: "Your habits are trending toward a healthy balance.",
    };
  }
  if (score >= 4) {
    return {
      title: "Somewhere in the middle",
      text: "A few small habit shifts could nudge this up.",
    };
  }
  return {
    title: "Signs of strain",
    text: "Your daily rhythm shows some pressure points worth a look.",
  };
}
