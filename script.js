const logo = document.getElementById("logo");
const intervals = new Map();
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const submitEdit = document.getElementById("submitEdit");

let userText = "";

function getRandomChar() {
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return pool[Math.floor(Math.random() * pool.length)];
}

function startRandomizing(char) {
  if (char.dataset.char === " ") return;
  if (intervals.has(char)) return;

  const interval = setInterval(() => {
    char.textContent = getRandomChar();
  }, 50);

  intervals.set(char, interval);
}

function stopRandomizing(char) {
  if (char.dataset.char === " ") return;
  if (intervals.has(char)) {
    clearInterval(intervals.get(char));
    intervals.delete(char);
  }
  char.textContent = char.dataset.char;
}

function clearRandomizing() {
  intervals.forEach((interval) => clearInterval(interval));
  intervals.clear();
}

function renderLogo(text) {
  // Stop timers before detaching the characters they update.
  clearRandomizing();
  logo.innerHTML = "";
  logo.style.opacity = "1";
  const words = text.match(/(\S+|\s)/g);

  words.forEach((word) => {
    const wordSpan = document.createElement("span");
    wordSpan.classList.add("word");

    if (word === " ") {
      const space = document.createElement("span");
      space.classList.add("char");
      space.textContent = " ";
      wordSpan.appendChild(space);
    } else {
      word.split("").forEach((char, i) => {
        const span = document.createElement("span");
        span.classList.add("char");
        span.dataset.index = i;
        span.dataset.char = char;
        span.textContent = char;
        wordSpan.appendChild(span);
      });
    }

    logo.appendChild(wordSpan);
  });
}

document.addEventListener("mousemove", (e) => {
  const chars = document.querySelectorAll(".char");

  chars.forEach((char) => {
    const charX = char.getBoundingClientRect().left + char.offsetWidth / 2;
    if (e.clientX < charX) {
      startRandomizing(char);
    } else {
      stopRandomizing(char);
    }
  });
});

document.getElementById("editBtn").addEventListener("click", () => {
  editInput.value = userText;
  editModal.style.display = "flex";
  editInput.focus();
});

function closeEditModal() {
  editModal.style.display = "none";
}

function applyEdit() {
  const newText = editInput.value.trim();
  if (newText) {
    userText = newText;
    renderLogo(userText);
  }
  closeEditModal();
}

submitEdit.addEventListener("click", applyEdit);

editInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyEdit();
  } else if (e.key === "Escape") {
    closeEditModal();
  }
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  window.location.href = window.location.href;
});
