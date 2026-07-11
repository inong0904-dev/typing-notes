import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
app.secret_key = "야씨의비밀키1234"
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            title TEXT,
            content TEXT,
            font TEXT,
            size TEXT,
            date TEXT,
            modified_date TEXT
        )
    """)
    conn.commit()
    conn.close()

@app.route("/")
def home():
    return "서버 작동 중! 👋"

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data["username"]
    password = generate_password_hash(data["password"])
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                      (username, password))
        conn.commit()
        return jsonify({"message": "회원가입 성공!"})
    except:
        return jsonify({"message": "이미 존재하는 아이디예요!"}), 400
    finally:
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    if user and check_password_hash(user[2], password):
        session["username"] = username
        return jsonify({"message": "로그인 성공!", "username": username})
    else:
        return jsonify({"message": "아이디 또는 비밀번호가 틀렸어요!"}), 401

@app.route("/me")
def me():
    if "username" in session:
        return jsonify({"username": session["username"]})
    else:
        return jsonify({"message": "로그인 안 됨"}), 401

@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "로그아웃 완료!"})

@app.route("/notes", methods=["GET"])
def get_notes():
    if "username" not in session:
        return jsonify({"message": "로그인 필요!"}), 401
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notes WHERE username = ?", (session["username"],))
    rows = cursor.fetchall()
    conn.close()
    notes = []
    for row in rows:
        notes.append({
            "id": row[0],
            "title": row[2],
            "content": row[3],
            "font": row[4],
            "size": row[5],
            "date": row[6],
            "modified_date": row[7]
        })
    return jsonify(notes)

@app.route("/notes", methods=["POST"])
def save_note():
    if "username" not in session:
        return jsonify({"message": "로그인 필요!"}), 401
    data = request.get_json()
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notes (username, title, content, font, size, date, modified_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        session["username"],
        data.get("title", "새 노트"),
        data.get("content", ""),
        data.get("font", ""),
        data.get("size", "18px"),
        data.get("date", ""),
        data.get("modified_date", "")
    ))
    conn.commit()
    note_id = cursor.lastrowid
    conn.close()
    return jsonify({"message": "저장 완료!", "id": note_id})

@app.route("/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    if "username" not in session:
        return jsonify({"message": "로그인 필요!"}), 401
    data = request.get_json()
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE notes SET title=?, content=?, font=?, size=?, modified_date=?
        WHERE id=? AND username=?
    """, (
        data.get("title", ""),
        data.get("content", ""),
        data.get("font", ""),
        data.get("size", "18px"),
        data.get("modified_date", ""),
        note_id,
        session["username"]
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "수정 완료!"})

@app.route("/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    if "username" not in session:
        return jsonify({"message": "로그인 필요!"}), 401
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id=? AND username=?",
                  (note_id, session["username"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "삭제 완료!"})

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)