let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentId = null;

function saveToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function addNote() {
  const note = {
    id: Date.now(),
    title: "새 노트",
    content: "",
    font: "'Segoe UI', sans-serif",
    size: "18px",
    date: new Date().toLocaleDateString("ko-KR")
  };

  notes.push(note);
  saveToStorage();
  renderNoteList();
  selectNote(note.id);
}

function deleteNote(id) {
  if (!confirm("이 노트를 삭제할까요?")) return;

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

  if (isOverlayMode) startOverlay();
}

function saveNote() {
  if (currentId === null) return;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.title = document.getElementById("noteTitle").value || "새 노트";
  note.content = document.getElementById("noteContent").innerText;
  note.modifiedDate = new Date().toLocaleDateString("ko-KR");
  saveToStorage();
  renderNoteList();
  updateCounter();
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

  if (isOverlayMode) {
  document.getElementById("typing-display").style.fontFamily = font;
  resizeOverlayInput();
  // 포커스 유지!
  setTimeout(function() {
    document.getElementById("hidden-input").focus();
  }, 50);
  }
}

function changeSize() {
  if (currentId === null) return;
  const size = document.getElementById("sizeSelect").value + "px";
  const note = notes.find(function(n) { return n.id === currentId; });
  note.size = size;
  document.getElementById("noteContent").style.fontSize = size;
  saveToStorage();

  if (isOverlayMode) {
    document.getElementById("typing-display").style.fontSize = size;
    resizeOverlayInput();
  }
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
      debugger;
      e.preventDefault();
      deleteNote(note.id);
    };
    item.ondblclick = function(e) {
      console.log("우클릭 이벤트 발생함!");
      e.stopPropagation();
      openProperties(note.id);
    };
    list.appendChild(item);
  });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
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

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
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
  "'MiraendaekyoVBatang', sans-serif",
  "'Cafe24Slim' , sans-serif",
  "'Cafe24Ssurround', sans-serif",
  "'ChosunGu', sans-serif",
  "'ChosunNm', serif",
  "'ChosunSg', sans-serif",
  "'CucumberSalad', cursive",
  "'GmarketSansMedium', sans-serif",
  "'HaeongSemi', sans-serif",
  "'SungkokSerif', serif",
  "'LeeSeoyoon', cursive"
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
});

document.getElementById("noteContent").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && isChaosMode) {
    const randomFont = chaosFonts[Math.floor(Math.random() * chaosFonts.length)];
    const randomColor = chaosTextColors[Math.floor(Math.random() * chaosTextColors.length)];
    currentChaosFont = randomFont;
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
    if (isOverlayMode) {
      isOverlayMode = false;
      document.getElementById("overlayMode").style.display = "none";
      document.getElementById("overlayBtn").classList.remove("active");
      document.getElementById("overlayBtn").textContent = "✍️ 겹쳐치기 모드";
    }
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

// 겹쳐치기 모드
let isOverlayMode = false;
let overlayOriginalText = "";

function toggleOverlayMode() {
  if (currentId === null) {
    alert("먼저 노트를 선택해주세요!");
    return;
  }
  isOverlayMode = !isOverlayMode;
  const noteContent = document.getElementById("noteContent");
  const bookMode = document.getElementById("bookMode");
  const overlayMode = document.getElementById("overlayMode");
  const btn = document.getElementById("overlayBtn");

  if (isOverlayMode) {
    if (isBookMode) {
      isBookMode = false;
      noteContent.style.display = "none";
      bookMode.style.display = "none";
    }
    noteContent.style.display = "none";
    overlayMode.style.display = "flex";
    overlayMode.style.flexDirection = "column";
    btn.classList.add("active");
    btn.textContent = "✍️ 겹쳐치기 ON";
    startOverlay();
  } else {
    noteContent.style.display = "block";
    overlayMode.style.display = "none";
    btn.classList.remove("active");
    btn.textContent = "✍️ 겹쳐치기 모드";
  }
}

function startOverlay() {
  const note = notes.find(function(n) { return n.id === currentId; });
  overlayOriginalText = note.content || "";
  const display = document.getElementById("typing-display");
  const hiddenInput = document.getElementById("hidden-input");

  hiddenInput.value = "";          // ← 확실히 초기화
  hiddenInput.blur();              // ← 포커스 해제
  display.style.fontFamily = note.font;
  display.style.fontSize = note.size;

  updateOverlayScreen();
  resizeOverlayInput();

  setTimeout(function() {          // ← 약간 딜레이 후 포커스
    hiddenInput.focus();
  }, 100);
}

function escapeHtml(ch) {
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === "&") return "&amp;";
  return ch;
}

function updateOverlayScreen() {
  const hiddenInput = document.getElementById("hidden-input");
  const display = document.getElementById("typing-display");
  const userText = hiddenInput.value;
  let html = "";

  for (let i = 0; i < overlayOriginalText.length; i++) {
    const origChar = escapeHtml(overlayOriginalText[i]);
    const userChar = userText[i];

    if (i < userText.length) {
      if (overlayOriginalText[i] === userChar) {
        html += `<span class="char-typed">${origChar}</span>`;
      } else {
        html += `<span class="char-wrong">${origChar}</span>`;
      }
    } else if (i === userText.length) {
      html += `<span class="char-current">${origChar}</span>`;
    } else {
      html += `<span class="char-pending">${origChar}</span>`;
    }
  }

  display.innerHTML = html;

  const percent = overlayOriginalText.length === 0
    ? 0
    : Math.floor((userText.length / overlayOriginalText.length) * 100);
  document.getElementById("overlayProgress").innerText = Math.min(percent, 100);

  if (
    overlayOriginalText.length > 0 &&
    userText.length >= overlayOriginalText.length &&
    userText === overlayOriginalText
  ) {
    setTimeout(function() {
      alert("🎉 필사를 성공적으로 마쳤습니다!");
    }, 200);
  }
}

function resizeOverlayInput() {
  setTimeout(function() {
    const display = document.getElementById("typing-display");
    const hiddenInput = document.getElementById("hidden-input");
    hiddenInput.style.height = display.offsetHeight + "px";
  }, 50);
}

document.getElementById("hidden-input").addEventListener("input", updateOverlayScreen);

document.getElementById("hidden-input").addEventListener("keydown", function(e) {
   e.stopPropagation();  //
  const userText = this.value;

  if (e.key === "Enter") {
    e.preventDefault();
    const lines = userText.split("\n");
    const currentLine = lines[lines.length - 1];
    const indentMatch = currentLine.match(/^[\s\t]*/);
    const indent = indentMatch ? indentMatch[0] : "";
    this.value = userText + "\n" + indent;
    updateOverlayScreen();
    resizeOverlayInput();
    return;
  }

  if (e.key === "Tab") {
    e.preventDefault();
    this.value = userText + "  ";
    updateOverlayScreen();
  }
});

document.getElementById("overlayMode").addEventListener("click", function(e) {
  if (isOverlayMode) document.getElementById("hidden-input").focus();
});

// 처음 실행 시 저장된 노트 목록 불러오기
renderNoteList();
if (notes.length > 0) {
  selectNote(notes[0].id);
}

