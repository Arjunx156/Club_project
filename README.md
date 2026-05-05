# ORCA — Odyssey Research & Club of AI

> **The official web portal for the AI & Data Science Club**

ORCA is a full-stack Flask web application that serves as the central hub for the AI & DS Club. It features event management, project tracking, leaderboards, user authentication, and more.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python / Flask |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Authentication | Flask-Login + bcrypt |

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Club_project.git
cd Club_project
```

### 2. Create and activate a virtual environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install flask flask-login flask-mysqldb bcrypt
```

### 4. Set up the database
- Import `Database.sql` into your MySQL server:
```bash
mysql -u root -p < Database.sql
```

### 5. Configure environment variables
Create a `.env` file (do **not** commit this):
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DB=club_db
SECRET_KEY=your-secret-key
```

### 6. Run the app
```bash
python app.py
```
Visit `http://localhost:5000` in your browser.

---

## 📁 Project Structure

```
Club_project/
├── app.py              # Main Flask application
├── Database.sql        # MySQL schema and seed data
├── static/             # CSS, JS, images
├── templates/          # Jinja2 HTML templates
└── README.md
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push and open a Pull Request

---

*Built with ❤️ by the AI & DS Club Team*
