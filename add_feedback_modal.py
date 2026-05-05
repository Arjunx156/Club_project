with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

feedback_modal = '''<!-- FEEDBACK MODAL -->
<div class="modal-overlay" id="feedbackModal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('feedbackModal')">✕</button>
    <h2 id="feedbackTitle">Rate Event</h2>
    <p class="sub">Your feedback helps us improve</p>
    <div class="form-group">
      <label class="form-label">Rating (1-5)</label>
      <input class="form-input" id="feedbackRating" type="number" min="1" max="5" value="5">
    </div>
    <div class="form-group">
      <label class="form-label">Review (Optional)</label>
      <textarea class="form-textarea" id="feedbackReview" placeholder="What did you like about this event?"></textarea>
    </div>
    <button class="btn btn-primary" onclick="submitFeedback()">Submit Feedback →</button>
  </div>
</div>'''

html = html.replace('<!-- DETAIL PANEL -->', feedback_modal + '\n\n<!-- DETAIL PANEL -->')

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
