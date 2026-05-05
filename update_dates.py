with open('Database.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

sql = sql.replace("'2025-04-10'", "'2026-05-10'")
sql = sql.replace("'2025-04-20'", "'2026-05-20'")
sql = sql.replace("'2025-05-05'", "'2026-06-05'")
sql = sql.replace("'2025-05-15'", "'2026-06-15'")

with open('Database.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
