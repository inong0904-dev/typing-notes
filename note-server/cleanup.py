import sqlite3

conn = sqlite3.connect("database.db")
conn.execute("DELETE FROM users WHERE username IN ('test', 'test2')")
conn.commit()

print(conn.execute("SELECT * FROM users").fetchall())
conn.close()
print("삭제 완료!")