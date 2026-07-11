const SERVER = "https://notes-server-production-540e.up.railway.app";
let isLoggedIn = false;
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentId = null;

function saveToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

async function addNote() {
  const res = await fetch(SERVER + "/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      title: "새 노트",
      content: "",
      font: "'Segoe UI', sans-serif",
      size: "18px",
      date: new Date().toLocaleDateString("ko-KR")
    })
  });
  const data = await res.json();
  const note = {
    id: data.id,
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

async function saveNote() {
  if (currentId === null) return;
  const note = notes.find(function(n) { return n.id === currentId; });
  note.title = document.getElementById("noteTitle").value || "새 노트";
  note.content = document.getElementById("noteContent").value;
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

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
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
          modifiedDate: n.modified_date,
          serverId: n.id
        };
      });
      saveToStorage();
      renderNoteList();
      selectNote(notes[0].id);
    }
  }
}

// 처음 실행
checkLogin().then(function() {
  if (isLoggedIn) {
    loadNotesFromServer();
  } else {
    const lastId = localStorage.getItem("lastNoteId");
    const lastNote = notes.find(function(n) { return n.id === parseInt(lastId); });
    if (lastNote) {
      selectNote(lastNote.id);
    } else if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      addNote();
    }
  }
});

// 처음 실행
checkLogin().then(function() {
  if (isLoggedIn) {
    loadNotesFromServer();
  } else {
    const lastId = localStorage.getItem("lastNoteId");
    const lastNote = notes.find(function(n) { return n.id === parseInt(lastId); });
    if (lastNote) {
      selectNote(lastNote.id);
    } else if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      addNote();
    }
  }
});
