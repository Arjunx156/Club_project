import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = r'''        cursor.execute\("SELECT COUNT\(\*\) as cnt FROM RESOURCE WHERE added_by = %s", \(member_id,\)\)
        resources = cursor.fetchone\(\)

        cursor.close\(\)
        db.close\(\)

        return jsonify\(\{
            "member_id": member\["member_id"\],
            "name": member\["name"\],
            "year": member\["year"\],
            "role": member\["role"\],
            "email": member\["email"\],
            "bio": member\["bio"\],
            "subcommittee": member\["subcommittee"\],
            "joined_at": str\(member\["joined_at"\]\),
            "events_attended": participation\["cnt"\],
            "resources_added": resources\["cnt"\]
        \}\)'''

new_block = '''        cursor.execute("SELECT COUNT(*) as cnt, IFNULL(SUM(download_count), 0) as downloads FROM RESOURCE WHERE added_by = %s", (member_id,))
        resources = cursor.fetchone()

        cursor.close()
        db.close()

        return jsonify({
            "member_id": member["member_id"],
            "name": member["name"],
            "year": member["year"],
            "role": member["role"],
            "email": member["email"],
            "bio": member["bio"],
            "subcommittee": member["subcommittee"],
            "joined_at": str(member["joined_at"]),
            "events_attended": participation["cnt"],
            "resources_added": resources["cnt"],
            "total_downloads": int(resources["downloads"])
        })'''

new_content = re.sub(old_block, new_block, content, flags=re.DOTALL)
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
