const SERVER = "https://notes-server-production-540e.up.railway.app";
let isLoggedIn = false;
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentId = null;

function saveToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

async function addNote() {
  const note = {
    id: Date.now(),
    title: "새 노트",
    content: "",
    font: "'Segoe UI', sans-serif",
    size: "18px",
    date: new Date().toLocaleDateString("ko-KR")
  };

  if (isLoggedIn) {
    const res = await fetch(SERVER + "/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        font: note.font,
        size: note.size,
        date: note.date
      })
    });
    const data = await res.json();
    if (data.id) note.id = data.id;
  }

  notes.push(note);
  saveToStorage();
  renderNoteList();
  selectNote(note.id);
}

async function deleteNote(id) {
  if (!confirm("이 노트를 삭제할까요?")) return;

  if (isLoggedIn) {
    await fetch(SERVER + "/notes/" + id, {
      method: "DELETE",
      credentials: "include"
    });
  }

  notes = notes.filter(function(n) { return n.id !== id; });
  saveToStorage();
  renderNoteList();
  if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    currentId = null;
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").innerText = "";
  }
}

function selectNote(id) {
  currentId = id;
  const note = notes.find(function(n) { return n.id === id; });
  document.getElementById("noteTitle").value = note.title;
  const content = document.getElementById("noteContent");
  content.innerText = note.content;
  document.getElementById("fontSelect").value = note.font;
  document.getElementById("sizeSelect").value = note.size.replace("px", "");
  content.style.fontFamily = note.font;
  content.style.fontSize = note.size;
  content.style.color = "#333";
  document.execCommand("selectAll");
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("fontName", false, note.font);
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(content);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  renderNoteList();
  localStorage.setItem("lastNoteId", id);
}

async function saveNote() {
  if (currentId === null) return;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.title = document.getElementById("noteTitle").value || "새 노트";
  note.content = document.getElementById("noteContent").innerText;
  note.modifiedDate = new Date().toLocaleDateString("ko-KR");
  saveToStorage();
  renderNoteList();
  updateCounter();

  if (isLoggedIn) {
    await fetch(SERVER + "/notes/" + currentId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        font: note.font,
        size: note.size,
        modified_date: note.modifiedDate
      })
    });
  }
}

function changeFont() {
  if (currentId === null) return;
  const font = document.getElementById("fontSelect").value;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.font = font;
  const content = document.getElementById("noteContent");
  content.style.fontFamily = font;
  document.execCommand("selectAll");
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("fontName", false, font);
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(content);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  saveToStorage();
  if (isLoggedIn) saveNote();
}

function changeSize() {
  if (currentId === null) return;
  const size = document.getElementById("sizeSelect").value + "px";
  const note = notes.find(function(n) { return n.id === currentId; });
  note.size = size;
  document.getElementById("noteContent").style.fontSize = size;
  saveToStorage();
  if (isLoggedIn) saveNote();
}

function updateCounter() {
  const content = document.getElementById("noteContent").innerText;
  const chars = content.length;
  const lines = content === "" ? 0 : content.split("\n").length;
  document.getElementById("counter").textContent = chars + " 글자 · " + lines + " 줄";
}

function renderNoteList() {
  const list = document.getElementById("noteList");
  list.innerHTML = "";
  notes.forEach(function(note) {
    const item = document.createElement("div");
    item.className = "noteItem" + (note.id === currentId ? " active" : "");
    item.innerHTML = `
      <div>${note.title}</div>
      <div style="font-size: 11px; color: #aaa; margin-top: 3px;">${note.date || ""}</div>
    `;
    item.onclick = function() { selectNote(note.id); };
    item.oncontextmenu = function(e) {
      e.preventDefault();
      deleteNote(note.id);
    };
    item.ondblclick = function(e) {
      e.stopPropagation();
      openProperties(note.id);
    };
    list.appendChild(item);
  });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
}

async function checkLogin() {
  try {
    const res = await fetch(SERVER + "/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      isLoggedIn = true;
      document.getElementById("loginStatus").textContent = data.username + " 님 환영해요!";
    } else {
      showLoginForm();
    }
  } catch {
    showLoginForm();
  }
}

function showLoginForm() {
  document.getElementById("loginOverlay").style.display = "flex";
}

async function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const res = await fetch(SERVER + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    isLoggedIn = true;
    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("loginStatus").textContent = username + " 님 환영해요!";
    loadNotesFromServer();
  } else {
    alert("아이디 또는 비밀번호가 틀렸어요!");
  }
}

async function register() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const res = await fetch(SERVER + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  alert(data.message);
}

async function logout() {
  await fetch(SERVER + "/logout", { credentials: "include" });
  isLoggedIn = false;
  location.reload();
}

async function loadNotesFromServer() {
  if (!isLoggedIn) return;
  const res = await fetch(SERVER + "/notes", { credentials: "include" });
  if (res.ok) {
    const serverNotes = await res.json();
    if (serverNotes.length > 0) {
      notes = serverNotes.map(function(n) {
        return {
          id: n.id,
          title: n.title,
          content: n.content,
          font: n.font,
          size: n.size,
          date: n.date,
          modifiedDate: n.modified_date
        };
      });
      saveToStorage();
      renderNoteList();
      selectNote(notes[0].id);
    }
  }
}

function openProperties(id) {
  const note = notes.find(function(n) { return n.id === id; });
  if (!note) return;
  document.getElementById("propTitle").textContent = note.title;
  document.getElementById("propCreated").textContent = note.date || "기록 없음";
  document.getElementById("propModified").textContent = note.modifiedDate || "수정 없음";
  document.getElementById("propChars").textContent = note.content.length + " 글자";
  document.getElementById("propLines").textContent = (note.content === "" ? 0 : note.content.split("\n").length) + " 줄";
  document.getElementById("propFont").textContent = note.font.replace(/'/g, "").split(",")[0];
  document.getElementById("noteProperties").style.display = "flex";
}

function closeProperties() {
  document.getElementById("noteProperties").style.display = "none";
}

// 카오스 모드
let isChaosMode = false;
let chaosCharCount = 0;
let currentChaosFont = "'Segoe UI', sans-serif";

const chaosFonts = [
  "'Nanum Gothic', sans-serif",
  "'Nanum Myeongjo', serif",
  "'Gowun Batang', serif",
  "'IBM Plex Sans KR', sans-serif",
  "'Noto Serif KR', serif",
  "'Poor Story', cursive",
  "'Gowun Dodum', sans-serif",
  "'Hahmlet', serif",
  "'Nanum Gothic Coding', monospace",
  "'Courier New', monospace",
  "'Georgia', serif",
  "'PretendardJP', sans-serif",
  "'KoPubDotum', sans-serif",
  "'KoPubBatang', serif",
  "'Helvetica', sans-serif",
  "'RIDIBatang', serif",
  "'MaruBuriRegular', serif",
  "'SCDream44', sans-serif",
  "'designhouseLight', sans-serif",
  "'KCCDodamdodam', sans-serif",
  "'Byeolbichhaneul', sans-serif",
  "'MiraendaekyoVDotum', sans-serif",
  "'MiraendaekyoVBatang', sans-serif"
];

const chaosTextColors = [
  "#e74c3c", "#e67e22", "#27ae60",
  "#2980b9", "#8e44ad", "#c0392b"
];

function toggleChaosMode() {
  isChaosMode = !isChaosMode;
  const btn = document.getElementById("chaosBtn");
  const content = document.getElementById("noteContent");

  if (isChaosMode) {
    btn.classList.add("active");
    btn.textContent = "🌈 카오스 ON";
    content.classList.add("chaos");
    chaosCharCount = 0;
    // 커서 맨 끝으로
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(content);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    // 다음 입력부터 첫 카오스 폰트 적용
    document.execCommand("styleWithCSS", false, true);
    const randomFont = chaosFonts[Math.floor(Math.random() * chaosFonts.length)];
    const randomColor = chaosTextColors[Math.floor(Math.random() * chaosTextColors.length)];
    currentChaosFont = randomFont;
    document.execCommand("fontName", false, randomFont);
    document.execCommand("foreColor", false, randomColor);
  } else {
    btn.classList.remove("active");
    btn.textContent = "🌈 카오스 모드";
    content.classList.remove("chaos");
    if (currentId) {
      const note = notes.find(function(n) { return n.id === currentId; });
      // 커서 맨 끝으로 이동 후 원래 폰트/색 적용
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(content);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("fontName", false, note.font);
      document.execCommand("foreColor", false, "#333333");
      content.style.fontFamily = note.font;
      content.style.color = "#333";
    }
  }
}

document.getElementById("noteContent").addEventListener("input", function() {
  saveNote();
  if (!isChaosMode) return;

  chaosCharCount++;

  if (chaosCharCount % 60 === 0) {
    const randomFont = chaosFonts[Math.floor(Math.random() * chaosFonts.length)];
    const randomColor = chaosTextColors[Math.floor(Math.random() * chaosTextColors.length)];
    currentChaosFont = randomFont;
    // 전체 말고 커서 이후 입력부터만 적용!
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontName", false, randomFont);
    document.execCommand("foreColor", false, randomColor);
  }
});

// 공책 모드
let isBookMode = false;
let currentSpread = 0;

function toggleBookMode() {
  isBookMode = !isBookMode;
  const noteContent = document.getElementById("noteContent");
  const bookMode = document.getElementById("bookMode");
  const btn = document.querySelector("#sidebar button:nth-child(2)");

  if (isBookMode) {
    noteContent.style.display = "none";
    bookMode.style.display = "flex";
    currentSpread = 0;
    renderBook();
  } else {
    noteContent.style.display = "block";
    bookMode.style.display = "none";
  }
}

function renderBook() {
  const note = notes.find(function(n) { return n.id === currentId; });
  if (!note) return;
  const font = note.font || "'Segoe UI', sans-serif";
  const size = note.size || "18px";
  const charsPerPage = 300;
  const text = note.content;
  const totalSpreads = Math.max(1, Math.ceil(text.length / (charsPerPage * 2)));
  const leftStart = currentSpread * charsPerPage * 2;
  const leftEnd = leftStart + charsPerPage;
  const rightStart = leftEnd;
  const rightEnd = rightStart + charsPerPage;
  const leftPage = document.getElementById("leftPage");
  const rightPage = document.getElementById("rightPage");
  leftPage.textContent = text.slice(leftStart, leftEnd);
  rightPage.textContent = text.slice(rightStart, rightEnd);
  leftPage.style.fontFamily = font;
  leftPage.style.fontSize = size;
  rightPage.style.fontFamily = font;
  rightPage.style.fontSize = size;
  document.getElementById("pageNumber").textContent =
    (currentSpread + 1) + " / " + totalSpreads + " 페이지";
}

function prevSpread() {
  if (currentSpread > 0) {
    currentSpread--;
    renderBook();
  }
}

function nextSpread() {
  const note = notes.find(function(n) { return n.id === currentId; });
  if (!note) return;
  const charsPerPage = 300;
  const totalSpreads = Math.max(1, Math.ceil(note.content.length / (charsPerPage * 2)));
  if (currentSpread < totalSpreads - 1) {
    currentSpread++;
    renderBook();
  }
}

// 처음 실행
checkLogin().then(function() {
  if (isLoggedIn) {
    loadNotesFromServer();
  } else {
    notes = [];
    saveToStorage();
    renderNoteList();
  }
});
