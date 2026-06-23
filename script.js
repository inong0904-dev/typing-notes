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
    document.getElementById("noteContent").value = "";
  }
}

function selectNote(id) {
  currentId = id;
  const note = notes.find(function(n) { return n.id === id; });
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("noteContent").value = note.content;
  document.getElementById("fontSelect").value = note.font;
  document.getElementById("sizeSelect").value = note.size.replace("px", "");
  document.getElementById("noteContent").style.fontFamily = note.font;
  document.getElementById("noteContent").style.fontSize = note.size;
  renderNoteList();
}

function saveNote() {
  if (currentId === null) return;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.title = document.getElementById("noteTitle").value || "새 노트";
  note.content = document.getElementById("noteContent").value;
  saveToStorage();
  renderNoteList();
}

function changeFont() {
  if (currentId === null) return;
  const font = document.getElementById("fontSelect").value;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.font = font;
  document.getElementById("noteContent").style.fontFamily = font;
  saveToStorage();
}

function changeSize() {
  if (currentId === null) return;
  const size = document.getElementById("sizeSelect").value + "px";
  const note = notes.find(function(n) { return n.id === currentId; });
  note.size = size;
  document.getElementById("noteContent").style.fontSize = size;
  saveToStorage();
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
    list.appendChild(item);
  });
}

// 처음 실행
if (notes.length > 0) {
  selectNote(notes[0].id);
} else {
  addNote();
}
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
}
