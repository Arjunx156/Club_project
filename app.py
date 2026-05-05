from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json
import math
import re
from collections import Counter

has_genai = False
try:
    from google import genai
    genai_client = genai.Client(api_key="AIzaSyBob26_v7k2NNQcGO-AxoCbZVhAHAtr5Qc")
    has_genai = True
except ImportError:
    print("google-genai not installed. Falling back to local AI.")

app = Flask(__name__)
CORS(app)

# DB config — reads from DATABASE_URL environment variable
# In Vercel dashboard: Settings > Environment Variables > add DATABASE_URL
# Format: postgresql://postgres:[PASSWORD]@db.YOURPROJECTREF.supabase.co:5432/postgres
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:Arjun%40156123@db.ocvctvycniapdeouekyi.supabase.co:6543/postgres"
)

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

# =========================
# LOCAL AI ALGORITHMS
# =========================
def get_keywords(text):
    if not text: return []
    words = re.findall(r'\w+', str(text).lower())
    stopwords = {"and", "the", "a", "an", "is", "for", "to", "in", "on", "of", "with", "at", "by", "this", "that", "it"}
    return [w for w in words if w not in stopwords]

def tf_idf_similarity(query_keywords, document_keywords):
    if not query_keywords or not document_keywords:
        return 0.0
    q_set = set(query_keywords)
    d_set = set(document_keywords)
    intersection = q_set.intersection(d_set)
    union = q_set.union(d_set)
    return len(intersection) / len(union) if union else 0.0

# =========================
# SERVE FRONTEND
# =========================
@app.route('/')
@app.route('/portal')
def home():
    return render_template('index.html')

# =========================
# GET EVENTS
# =========================
@app.route('/events', methods=['GET'])
def get_events():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT E.*,
            (SELECT COUNT(*) FROM PARTICIPATION P WHERE P.event_id = E.event_id) as registered
            FROM EVENT E
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            total = r.get('seats') or 50
            registered = r.get('registered') or 0
            result.append({
                "event_id": r["event_id"],
                "title": r["title"],
                "description": r["description"],
                "date": str(r["date"]),
                "time": str(r["time"]) if r["time"] else "",
                "venue": r["venue"],
                "category": r["category"],
                "total_seats": total,
                "registered": registered,
                "seats_left": max(0, total - registered)
            })
        cursor.close()
        db.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# GET RESOURCES
# =========================
@app.route('/resources', methods=['GET'])
def get_resources():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT R.*, M.name as added_by_name
            FROM RESOURCE R
            JOIN MEMBER M ON R.added_by = M.member_id
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append({
                "resource_id": r["resource_id"],
                "title": r["title"],
                "type": r["type"],
                "link": r["link"],
                "tags": r["tags"],
                "added_by": r["added_by_name"],
                "download_count": r["download_count"]
            })
        cursor.close()
        db.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# ADD EVENT
# =========================
@app.route('/add_event', methods=['POST'])
def add_event():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            INSERT INTO EVENT (title, description, date, time, venue, category, seats)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('title'),
            data.get('description'),
            data.get('date'),
            data.get('time'),
            data.get('venue'),
            data.get('category'),
            data.get('seats', 50)
        ))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Event added successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# DELETE EVENT
# =========================
@app.route('/delete_event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("DELETE FROM PARTICIPATION WHERE event_id = %s", (event_id,))
        cursor.execute("DELETE FROM EVENT WHERE event_id = %s", (event_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Event deleted successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    

# =========================
# EDIT EVENT
# =========================
@app.route('/update_event/<int:event_id>', methods=['POST'])
def update_event(event_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            UPDATE EVENT SET title=%s, description=%s, date=%s, time=%s,
            venue=%s, category=%s, seats=%s WHERE event_id=%s
        """, (data['title'], data['description'], data['date'], data['time'],
              data['venue'], data['category'], data['seats'], event_id))
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Event updated"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================
# ADD RESOURCE
# =========================
@app.route('/add_resource', methods=['POST'])
def add_resource():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            INSERT INTO RESOURCE (title, type, link, tags, added_by, download_count)
            VALUES (%s, %s, %s, %s, %s, 0)
        """, (
            data.get('title'),
            data.get('type'),
            data.get('link'),
            data.get('tags'),
            data.get('added_by')
        ))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Resource added successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# DELETE RESOURCE
# =========================
@app.route('/delete_resource/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("DELETE FROM RESOURCE WHERE resource_id = %s", (resource_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Resource deleted successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# TRACK DOWNLOAD
# =========================
@app.route('/download/<int:resource_id>', methods=['POST'])
def track_download(resource_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            UPDATE RESOURCE SET download_count = download_count + 1
            WHERE resource_id = %s
        """, (resource_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Download tracked"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# REGISTER FOR EVENT
# =========================
@app.route('/register', methods=['POST'])
def register():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        member_id = data.get('member_id')
        event_id = data.get('event_id')

        # Check if already registered or waitlisted
        cursor.execute("""
            SELECT status FROM PARTICIPATION
            WHERE member_id=%s AND event_id=%s
        """, (member_id, event_id))
        row = cursor.fetchone()
        if row:
            cursor.close()
            db.close()
            return jsonify({"message": f"Already {row['status']} for this event!"}), 400

        # Check seat availability
        cursor.execute("SELECT seats FROM EVENT WHERE event_id=%s", (event_id,))
        event = cursor.fetchone()
        if not event:
            return jsonify({"message": "Event not found"}), 404
            
        cursor.execute("SELECT COUNT(*) as registered FROM PARTICIPATION WHERE event_id=%s AND status='registered'", (event_id,))
        reg_count = cursor.fetchone()['registered']
        
        status = 'registered' if reg_count < event['seats'] else 'waitlisted'

        cursor.execute("""
            INSERT INTO PARTICIPATION (member_id, event_id, role_in_event, status)
            VALUES (%s, %s, %s, %s)
        """, (member_id, event_id, "participant", status))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": f"Successfully {status}!", "status": status})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# UNREGISTER EVENT (WITH WAITLIST LOGIC)
# =========================


# =========================
# MY REGISTRATIONS
# =========================
@app.route('/my_registrations/<int:member_id>', methods=['GET'])
def my_registrations(member_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT E.event_id, E.title, E.date, E.time, E.venue, E.category, P.registered_at, P.status
            FROM PARTICIPATION P
            JOIN EVENT E ON P.event_id = E.event_id
            WHERE P.member_id = %s
            ORDER BY P.registered_at DESC
        """, (member_id,))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append({
                "event_id": r["event_id"],
                "title": r["title"],
                "date": str(r["date"]),
                "time": str(r["time"]) if r["time"] else "",
                "venue": r["venue"],
                "category": r["category"],
                "status": r["status"] if r["status"] else "registered",
                "registered_at": str(r["registered_at"])
            })
        cursor.close()
        db.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# LOGIN
# =========================
@app.route('/login', methods=['POST'])
def login():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        email = data.get('email')
        password = data.get('password')

        cursor.execute("SELECT * FROM MEMBER WHERE email = %s", (email,))
        member = cursor.fetchone()
        cursor.close()
        db.close()

        if not member:
            return jsonify({"message": "Email not found"}), 401
        if member.get('approved') == 0:
            return jsonify({"message": "Your account is pending admin approval."}), 401
        if member.get('password') != password:
            return jsonify({"message": "Wrong password"}), 401

        return jsonify({
            "member_id": member["member_id"],
            "name": member["name"],
            "role": member["role"],
            "email": member["email"],
            "subcommittee": member["subcommittee"],
            "bio": member["bio"],
            "year": member["year"],
            "joined_at": str(member["joined_at"])
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# GET MEMBER PROFILE
# =========================
@app.route('/profile/<int:member_id>', methods=['GET'])
def get_profile(member_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM MEMBER WHERE member_id = %s", (member_id,))
        member = cursor.fetchone()

        cursor.execute("SELECT COUNT(*) as cnt FROM PARTICIPATION WHERE member_id = %s", (member_id,))
        participation = cursor.fetchone()

        cursor.execute("SELECT COUNT(*) as cnt FROM RESOURCE WHERE added_by = %s", (member_id,))
        resources = cursor.fetchone()

        cursor.close()
        db.close()

        return jsonify({
            "member_id": member["member_id"],
            "name": member["name"],
            "email": member["email"],
            "role": member["role"],
            "year": member["year"],
            "bio": member["bio"],
            "subcommittee": member["subcommittee"],
            "joined_at": str(member["joined_at"]),
            "events_attended": participation["cnt"],
            "resources_added": resources["cnt"]
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# UPDATE PROFILE
# =========================
@app.route('/update_profile', methods=['POST'])
def update_profile():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            UPDATE MEMBER SET bio = %s, subcommittee = %s
            WHERE member_id = %s
        """, (data.get('bio'), data.get('subcommittee'), data.get('member_id')))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Profile updated"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# GET ANNOUNCEMENTS
# =========================
@app.route('/announcements', methods=['GET'])
def get_announcements():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT A.*, M.name as created_by_name
            FROM ANNOUNCEMENT A
            JOIN MEMBER M ON A.created_by = M.member_id
            ORDER BY A.created_at DESC
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append({
                "announcement_id": r["announcement_id"],
                "title": r["title"],
                "content": r["content"],
                "created_by": r["created_by_name"],
                "created_at": str(r["created_at"])
            })
        cursor.close()
        db.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# ADD ANNOUNCEMENT
# =========================
@app.route('/add_announcement', methods=['POST'])
def add_announcement():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            INSERT INTO ANNOUNCEMENT (title, content, created_by)
            VALUES (%s, %s, %s)
        """, (data.get('title'), data.get('content'), data.get('created_by')))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Announcement added"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# ANALYTICS
# =========================
@app.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute("SELECT COUNT(*) as cnt FROM MEMBER")
        total_members = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) as cnt FROM EVENT")
        total_events = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) as cnt FROM RESOURCE")
        total_resources = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) as cnt FROM PARTICIPATION")
        total_registrations = cursor.fetchone()['cnt']

        cursor.execute("""
            SELECT E.title, E.category, COUNT(P.member_id) as count
            FROM EVENT E
            LEFT JOIN PARTICIPATION P ON E.event_id = P.event_id
            GROUP BY E.event_id, E.title, E.category
            ORDER BY count DESC
        """)
        events_data = cursor.fetchall()

        cursor.execute("""
            SELECT subcommittee, COUNT(*) as count
            FROM MEMBER GROUP BY subcommittee ORDER BY count DESC
        """)
        subcommittee_data = cursor.fetchall()

        cursor.execute("""
            SELECT title, tags, download_count
            FROM RESOURCE ORDER BY download_count DESC LIMIT 5
        """)
        top_resources = cursor.fetchall()

        cursor.execute("""
            SELECT category, COUNT(*) as count FROM EVENT GROUP BY category
        """)
        category_data = cursor.fetchall()

        cursor.execute("""
            SELECT M.name, E.title, P.registered_at
            FROM PARTICIPATION P
            JOIN MEMBER M ON P.member_id = M.member_id
            JOIN EVENT E ON P.event_id = E.event_id
            ORDER BY P.registered_at DESC LIMIT 10
        """)
        recent_regs = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify({
            "total_members": total_members,
            "total_events": total_events,
            "total_resources": total_resources,
            "total_registrations": total_registrations,
            "events_data": events_data,
            "subcommittee_data": subcommittee_data,
            "top_resources": top_resources,
            "category_data": category_data,
            "recent_registrations": [
                {
                    "name": r["name"],
                    "title": r["title"],
                    "registered_at": str(r["registered_at"])
                } for r in recent_regs
            ]
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# AI — CHATBOT (GEMINI with LOCAL FALLBACK)
# =========================
@app.route('/ai/chat', methods=['POST'])
def ai_chat():
    try:
        data = request.json
        user_message = data.get('message', '').lower()
        member_id = data.get('member_id')
        
        if has_genai:
            db = get_db()
            cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT title, date, venue, category, seats FROM EVENT")
            events = cursor.fetchall()
            cursor.execute("SELECT title, tags, download_count FROM RESOURCE")
            resources = cursor.fetchall()
            cursor.close()
            db.close()
            
            events_text = "\\n".join([f"- {e['title']} ({e['category']}) on {e['date']} at {e['venue']}" for e in events])
            resources_text = "\\n".join([f"- {r['title']} ({r['tags']})" for r in resources])
            
            prompt = f"You are the AI & DS Club assistant. Be concise (2-3 sentences max) and use emojis. \\nEVENTS: {events_text} \\nRESOURCES: {resources_text} \\nUser asks: {user_message}"
            
            response = genai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return jsonify({"response": response.text.strip()})
        else:
            # Rule-based fallback
            if any(w in user_message for w in ['event', 'upcoming', 'when', 'next']):
                return jsonify({"response": "You can check out upcoming events like Workshops and Hackathons in the Events tab! Or look at the calendar on the dashboard."})
            elif any(w in user_message for w in ['resource', 'learn', 'download', 'pdf']):
                return jsonify({"response": "We have a curated Resource Library with ML, DL, and Data Science materials. Head over to the Resources tab to explore and download!"})
            elif any(w in user_message for w in ['register', 'waitlist', 'status', 'my']):
                return jsonify({"response": "You can view your confirmed registrations and waitlist status in the 'My Registrations' section."})
            elif any(w in user_message for w in ['hi', 'hello', 'hey']):
                return jsonify({"response": "Hello! 👋 I'm the Club AI Assistant. Ask me about events, resources, or your registrations."})
            else:
                return jsonify({"response": "I'm a simple AI assistant right now! Try asking me about 'upcoming events', 'resources to learn', or 'my registrations'."})
    except Exception as e:
        return jsonify({"response": f"Sorry, I encountered an error: {str(e)}"}), 500

# =========================
# AI — GENERATE EVENT DESCRIPTION (GEMINI with LOCAL FALLBACK)
# =========================
@app.route('/ai/generate_description', methods=['POST'])
def generate_description():
    try:
        data = request.json
        title = data.get('title', 'Event')
        category = data.get('category', 'Session')
        venue = data.get('venue', 'Campus')

        if has_genai:
            prompt = f"Write a short, engaging 2-3 sentence event description for an AI & DS Club event. Title: {title}. Type: {category}. Venue: {venue}. No bullet points. No formatting."
            response = genai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            description = response.text.strip()
        else:
            description = f"Join us for an exciting {category} on '{title}'! This session will be held at {venue}. It is a fantastic opportunity to build your skills, network with peers, and learn from experts in the community. Don't miss out!"
        
        return jsonify({"description": description})
    except Exception as e:
        return jsonify({"description": ""}), 500

# =========================
# AI — RECOMMENDATIONS (LOCAL ALGORITHM)
# =========================
@app.route('/ai/recommendations/<int:member_id>', methods=['GET'])
def get_recommendations(member_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute("SELECT * FROM MEMBER WHERE member_id = %s", (member_id,))
        member = cursor.fetchone()

        cursor.execute("""
            SELECT E.title, E.category FROM PARTICIPATION P
            JOIN EVENT E ON P.event_id = E.event_id
            WHERE P.member_id = %s
        """, (member_id,))
        registered = cursor.fetchall()

        cursor.execute("""
            SELECT event_id, title, category FROM EVENT WHERE event_id NOT IN (
                SELECT event_id FROM PARTICIPATION WHERE member_id = %s
            )
        """, (member_id,))
        available_events = cursor.fetchall()

        cursor.execute("SELECT resource_id, title, tags FROM RESOURCE")
        all_resources = cursor.fetchall()

        cursor.close()
        db.close()

        # Collect user preferences based on past events and subcommittee
        prefs = set(get_keywords(member.get('subcommittee', '')))
        for e in registered:
            prefs.update(get_keywords(e['title']))
            prefs.update(get_keywords(e['category']))
        
        if not prefs:
            prefs = {"machine", "learning", "data", "science", "ai"}
            
        # Score available events
        evt_scores = []
        for e in available_events:
            text = f"{e['title']} {e['category']}"
            score = tf_idf_similarity(list(prefs), get_keywords(text))
            evt_scores.append((score, e))
        
        # Score resources
        res_scores = []
        for r in all_resources:
            text = f"{r['title']} {r['tags']}"
            score = tf_idf_similarity(list(prefs), get_keywords(text))
            res_scores.append((score, r))
            
        evt_scores.sort(key=lambda x: x[0], reverse=True)
        res_scores.sort(key=lambda x: x[0], reverse=True)
        
        matched_events = [x[1] for x in evt_scores[:2]]
        matched_resources = [x[1] for x in res_scores[:2]]

        return jsonify({
            "events": matched_events,
            "resources": matched_resources
        })
    except Exception as e:
        return jsonify({"events": [], "resources": []}), 500

# =========================
# AI — SMART INSIGHTS (LOCAL ALGORITHM)
# =========================
@app.route('/ai/insights', methods=['GET'])
def get_insights():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("SELECT E.title, COUNT(P.member_id) as registrations FROM EVENT E LEFT JOIN PARTICIPATION P ON E.event_id = P.event_id GROUP BY E.event_id ORDER BY registrations DESC LIMIT 1")
        top_event = cursor.fetchone()
        
        cursor.execute("SELECT tags, SUM(download_count) as downloads FROM RESOURCE GROUP BY tags ORDER BY downloads DESC LIMIT 1")
        top_res = cursor.fetchone()
        
        cursor.execute("SELECT subcommittee, COUNT(*) as count FROM MEMBER GROUP BY subcommittee ORDER BY count DESC LIMIT 1")
        top_sub = cursor.fetchone()
        
        cursor.close()
        db.close()
        
        insights = []
        if top_event and top_event['title']:
            insights.append(f"'{top_event['title']}' is currently the most popular event with {top_event['registrations']} registrations.")
        if top_res and top_res['tags']:
            insights.append(f"Resources tagged '{top_res['tags']}' are the most downloaded learning materials.")
        if top_sub and top_sub['subcommittee']:
            insights.append(f"The '{top_sub['subcommittee']}' subcommittee has the largest active member base.")
            
        # Fallbacks
        while len(insights) < 3:
            insights.append("Engagement is growing steadily this month across all activities.")
            
        return jsonify({"insights": insights[:3]})
    except Exception as e:
        return jsonify({"insights": ["Analytics insights unavailable right now."]}), 500

# =========================
# AI — NATURAL LANGUAGE SEARCH (LOCAL ALGORITHM)
# =========================
@app.route('/ai/search', methods=['POST'])
def ai_search():
    try:
        data = request.json
        query = data.get('query', '')
        q_keys = get_keywords(query)
        
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT event_id, title, description, category, date, venue FROM EVENT")
        events = cursor.fetchall()
        cursor.execute("SELECT resource_id, title, type, tags, link FROM RESOURCE")
        resources = cursor.fetchall()
        cursor.close()
        db.close()

        matched_events = []
        for e in events:
            text = f"{e['title']} {e['description']} {e['category']}"
            score = tf_idf_similarity(q_keys, get_keywords(text))
            if score > 0 or any(k in text.lower() for k in q_keys):
                matched_events.append((score, e))
        
        matched_resources = []
        for r in resources:
            text = f"{r['title']} {r['tags']} {r['type']}"
            score = tf_idf_similarity(q_keys, get_keywords(text))
            if score > 0 or any(k in text.lower() for k in q_keys):
                matched_resources.append((score, r))
                
        # Sort by score descending
        matched_events.sort(key=lambda x: x[0], reverse=True)
        matched_resources.sort(key=lambda x: x[0], reverse=True)
        
        events_ret = [x[1] for x in matched_events[:5]]
        resources_ret = [x[1] for x in matched_resources[:5]]

        return jsonify({
            "events": events_ret,
            "resources": resources_ret,
            "message": f"Found {len(events_ret)} events and {len(resources_ret)} resources matching '{query}'"
        })
    except Exception as e:
        return jsonify({"events": [], "resources": [], "message": "Search failed"}), 500
    
@app.route('/delete_announcement/<int:announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("DELETE FROM ANNOUNCEMENT WHERE announcement_id = %s", (announcement_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Announcement deleted"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# LEADERBOARD (GAMIFICATION)
# =========================
@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Calculate points: 10 per event attended, 20 per resource, 2 per download
        cursor.execute("""
            SELECT M.member_id, M.name, M.subcommittee,
            (SELECT COUNT(*) FROM PARTICIPATION P WHERE P.member_id = M.member_id AND P.status='registered') * 10 +
            (SELECT COUNT(*) FROM RESOURCE R WHERE R.added_by = M.member_id) * 20 +
            (SELECT IFNULL(SUM(download_count), 0) FROM RESOURCE R WHERE R.added_by = M.member_id) * 2
            AS points
            FROM MEMBER M
            ORDER BY points DESC
            LIMIT 10
        """)
        leaders = cursor.fetchall()
        
        for leader in leaders:
            pts = leader['points'] or 0
            leader['points'] = pts
            if pts >= 100: leader['tier'] = 'Platinum'
            elif pts >= 50: leader['tier'] = 'Gold'
            elif pts >= 20: leader['tier'] = 'Silver'
            else: leader['tier'] = 'Bronze'
            
        cursor.close()
        db.close()
        return jsonify(leaders)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# SUBMIT EVENT FEEDBACK
# =========================
@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        member_id = data.get('member_id')
        event_id = data.get('event_id')
        rating = data.get('rating')
        review = data.get('review', '')
        
        cursor.execute("SELECT COUNT(*) as cnt FROM EVENT_FEEDBACK WHERE member_id=%s AND event_id=%s", (member_id, event_id))
        if cursor.fetchone()['cnt'] > 0:
            return jsonify({"message": "Feedback already submitted!"}), 400
            
        cursor.execute("""
            INSERT INTO EVENT_FEEDBACK (event_id, member_id, rating, review)
            VALUES (%s, %s, %s, %s)
        """, (event_id, member_id, rating, review))
        
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Feedback submitted successfully!"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500



@app.route('/update_announcement/<int:announcement_id>', methods=['POST'])
def update_announcement(announcement_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute(
            "UPDATE ANNOUNCEMENT SET title=%s, content=%s WHERE announcement_id=%s",
            (data.get('title'), data.get('content'), announcement_id)
        )
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Updated"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    

@app.route('/resource_tags', methods=['GET'])
def get_resource_tags():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT DISTINCT tags FROM RESOURCE WHERE tags IS NOT NULL")
        rows = cursor.fetchall()
        cursor.close(); db.close()
        return jsonify([r['tags'] for r in rows])
    except Exception as e:
        return jsonify([]), 500


@app.route('/request_membership', methods=['POST'])
def request_membership():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            INSERT INTO MEMBER (name, year, role, email, password, subcommittee, approved)
            VALUES (%s, %s, 'member', %s, %s, %s, 0)
        """, (data['name'], data['year'], data['email'], data['password'], data['subcommittee']))
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Request submitted. Await admin approval."})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/pending_members', methods=['GET'])
def pending_members():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT member_id, name, email, year, subcommittee FROM MEMBER WHERE approved=0")
        rows = cursor.fetchall()
        cursor.close(); db.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify([]), 500

@app.route('/approve_member/<int:member_id>', methods=['POST'])
def approve_member(member_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("UPDATE MEMBER SET approved=1 WHERE member_id=%s", (member_id,))
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Approved"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@app.route('/update_resource/<int:resource_id>', methods=['POST'])
def update_resource(resource_id):
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        cursor.execute("""
            UPDATE RESOURCE SET title=%s, tags=%s, type=%s, link=%s
            WHERE resource_id=%s
        """, (data.get('title'), data.get('tags'), data.get('type'), data.get('link'), resource_id))
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Resource updated"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@app.route('/unregister', methods=['POST'])
def unregister():
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        data = request.json
        member_id = data.get('member_id')
        event_id = data.get('event_id')
        
        # Check current status before deleting
        cursor.execute("SELECT status FROM PARTICIPATION WHERE member_id=%s AND event_id=%s", (member_id, event_id))
        row = cursor.fetchone()

        cursor.execute("""
            DELETE FROM PARTICIPATION
            WHERE member_id=%s AND event_id=%s
        """, (member_id, event_id))
        
        if row and row['status'] == 'registered':
            # Promote the next person from waitlist
            cursor.execute("""
                SELECT member_id FROM PARTICIPATION 
                WHERE event_id=%s AND status='waitlisted' 
                ORDER BY registered_at ASC LIMIT 1
            """, (event_id,))
            next_user = cursor.fetchone()
            if next_user:
                cursor.execute("""
                    UPDATE PARTICIPATION SET status='registered'
                    WHERE member_id=%s AND event_id=%s
                """, (next_user['member_id'], event_id))

        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Unregistered successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# PROJECT SHOWCASE (DB-backed)
# =========================
@app.route('/projects', methods=['GET'])
def get_projects():
    try:
        db = get_db(); cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT P.*, M.name AS author,
                   (SELECT COUNT(*) FROM PROJECT_LIKE L WHERE L.project_id = P.project_id) AS likes
            FROM PROJECT P
            LEFT JOIN MEMBER M ON P.member_id = M.member_id
            ORDER BY P.created_at DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            r['created_at'] = str(r['created_at'])[:10]
        cursor.close(); db.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify([]), 500

@app.route('/projects', methods=['POST'])
def create_project():
    try:
        data = request.json
        db = get_db(); cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            INSERT INTO PROJECT (member_id, title, description, tags, tech_stack, github_link, demo_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data.get('member_id'), data.get('title'), data.get('description'),
              data.get('tags'), data.get('tech_stack'), data.get('github_link'), data.get('demo_link')))
        db.commit()
        project_id = cursor.lastrowid
        cursor.close(); db.close()
        return jsonify({"message": "Project posted!", "project_id": project_id})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/projects/<int:project_id>/like', methods=['POST'])
def like_project(project_id):
    try:
        data = request.json
        member_id = data.get('member_id')
        db = get_db(); cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT 1 FROM PROJECT_LIKE WHERE member_id=%s AND project_id=%s", (member_id, project_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("DELETE FROM PROJECT_LIKE WHERE member_id=%s AND project_id=%s", (member_id, project_id))
            cursor.execute("UPDATE PROJECT SET likes = likes - 1 WHERE project_id=%s", (project_id,))
            liked = False
        else:
            cursor.execute("INSERT INTO PROJECT_LIKE (member_id, project_id) VALUES (%s, %s)", (member_id, project_id))
            cursor.execute("UPDATE PROJECT SET likes = likes + 1 WHERE project_id=%s", (project_id,))
            liked = True
        db.commit()
        cursor.execute("SELECT likes FROM PROJECT WHERE project_id=%s", (project_id,))
        row = cursor.fetchone()
        cursor.close(); db.close()
        return jsonify({"likes": row['likes'] if row else 0, "liked": liked})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/projects/<int:project_id>/view', methods=['POST'])
def view_project(project_id):
    try:
        db = get_db(); cursor = db.cursor()
        cursor.execute("UPDATE PROJECT SET views = views + 1 WHERE project_id=%s", (project_id,))
        db.commit(); cursor.close(); db.close()
        return jsonify({"message": "ok"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    try:
        data = request.json or {}
        member_id = data.get('member_id')
        db = get_db(); cursor = db.cursor()
        cursor.execute("DELETE FROM PROJECT_LIKE WHERE project_id=%s", (project_id,))
        cursor.execute("DELETE FROM PROJECT WHERE project_id=%s AND member_id=%s", (project_id, member_id))
        db.commit(); cursor.close(); db.close()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# TEAM FINDER (DB-backed)
# =========================
@app.route('/team_requests', methods=['GET'])
def get_team_requests():
    try:
        db = get_db(); cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT T.*, M.name AS author
            FROM TEAM_REQUEST T
            LEFT JOIN MEMBER M ON T.member_id = M.member_id
            ORDER BY T.created_at DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            r['created_at'] = str(r['created_at'])[:10]
        cursor.close(); db.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify([]), 500

@app.route('/team_requests', methods=['POST'])
def create_team_request():
    try:
        data = request.json
        db = get_db(); cursor = db.cursor()
        cursor.execute("""
            INSERT INTO TEAM_REQUEST (member_id, title, description, event_name, skills_needed, team_size, contact)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data.get('member_id'), data.get('title'), data.get('description'),
              data.get('event_name'), data.get('skills_needed'),
              data.get('team_size', 2), data.get('contact')))
        db.commit(); cursor.close(); db.close()
        return jsonify({"message": "Request posted!"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/team_requests/<int:request_id>/status', methods=['POST'])
def toggle_team_status(request_id):
    try:
        data = request.json or {}
        member_id = data.get('member_id')
        db = get_db(); cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT status FROM TEAM_REQUEST WHERE request_id=%s AND member_id=%s", (request_id, member_id))
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Not found"}), 404
        new_status = 'closed' if row['status'] == 'open' else 'open'
        cursor.execute("UPDATE TEAM_REQUEST SET status=%s WHERE request_id=%s", (new_status, request_id))
        db.commit(); cursor.close(); db.close()
        return jsonify({"status": new_status})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/team_requests/<int:request_id>', methods=['DELETE'])
def delete_team_request(request_id):
    try:
        data = request.json or {}
        member_id = data.get('member_id')
        db = get_db(); cursor = db.cursor()
        cursor.execute("DELETE FROM TEAM_REQUEST WHERE request_id=%s AND member_id=%s", (request_id, member_id))
        db.commit(); cursor.close(); db.close()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# =========================
# RUN APP
# =========================
if __name__ == '__main__':
    app.run(debug=True)