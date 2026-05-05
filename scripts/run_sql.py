import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Arjun@156",
    "database": "ai_ds_club",
    "auth_plugin": "mysql_native_password"
}

print("Connecting to database...")
db = mysql.connector.connect(**DB_CONFIG)
cursor = db.cursor()

print("Reading setup_new_tables.sql...")
with open("setup_new_tables.sql", "r") as f:
    sql_script = f.read()

# Split the statements
statements = sql_script.split(';')

print("Executing SQL statements...")
for statement in statements:
    if statement.strip():
        try:
            cursor.execute(statement)
        except Exception as e:
            print(f"Error executing statement:\n{statement}\nError: {e}")

db.commit()
cursor.close()
db.close()
print("Database setup complete.")
