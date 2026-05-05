with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find and remove the middle if __name__ == '__main__':
# and fix indentation errors

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == "if __name__ == '__main__':":
        if i < len(lines) - 20: # not the last one
            skip = True
            continue
    if skip and line.strip() == "app.run(debug=True)":
        skip = False
        continue
    new_lines.append(line)

# Wait, there's another issue. The lines around 931:
#         db.commit()
#         cursor.close(); db.close()
#         return jsonify({"message": "Deleted"})
#     except Exception as e:
#         return jsonify({"message": str(e)}), 500

# This looks like it was the tail end of the old delete_announcement function!
# Because I replaced delete_announcement but the original had these trailing lines.
# Let's fix this properly.

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Remove the bad duplicate delete_announcement tail block
import re
bad_block = r"if __name__ == '__main__':\s+app\.run\(debug=True\)\s+db\.commit\(\)\s+cursor\.close\(\); db\.close\(\)\s+return jsonify\(\{\"message\": \"Deleted\"\}\)\s+except Exception as e:\s+return jsonify\(\{\"message\": str\(e\)\}\), 500"
content = re.sub(bad_block, "", content)

# Remove the duplicate unregister at the bottom
bad_unregister = r"@app\.route\('/unregister', methods=\['POST'\]\)\s+def unregister\(\):.*?except Exception as e:\s+return jsonify\(\{\"message\": str\(e\)\}\), 500"
content = re.sub(bad_unregister, "", content, flags=re.DOTALL, count=1) # only if duplicate. Wait, my new unregister is at line 269. The old one is at the bottom.

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)
