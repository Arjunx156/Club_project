DROP DATABASE IF EXISTS ai_ds_club;
CREATE DATABASE ai_ds_club;
USE ai_ds_club;

-- 1. MEMBER TABLE
CREATE TABLE MEMBER (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    year INT,
    role VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100) DEFAULT 'pass123',
    bio TEXT,
    subcommittee VARCHAR(50) DEFAULT 'General',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RESOURCE TABLE
CREATE TABLE RESOURCE (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    type VARCHAR(50),
    link TEXT,
    tags VARCHAR(100),
    added_by INT,
    download_count INT DEFAULT 0,
    FOREIGN KEY (added_by) REFERENCES MEMBER(member_id)
);

-- 3. EVENT TABLE
CREATE TABLE EVENT (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    date DATE,
    time TIME,
    venue VARCHAR(100),
    category VARCHAR(50),
    seats INT DEFAULT 50
);

-- 4. PARTICIPATION TABLE
CREATE TABLE PARTICIPATION (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    event_id INT,
    role_in_event VARCHAR(50),
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id)
);

-- 6. EVENT_FEEDBACK TABLE
CREATE TABLE EVENT_FEEDBACK (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    member_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id),
    FOREIGN KEY (member_id) REFERENCES MEMBER(member_id)
);

-- 5. ANNOUNCEMENT TABLE
CREATE TABLE ANNOUNCEMENT (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES MEMBER(member_id)
);

-- =====================
-- INSERT SAMPLE DATA
-- =====================

-- MEMBERS
INSERT INTO MEMBER (name, year, role, email, password, bio, subcommittee) VALUES
('Arjun', 1, 'member', 'arjun@gmail.com', 'pass', 'Passionate about Machine Learning and Neural Networks.', 'Machine Learning'),
('Rahul', 2, 'core', 'rahul@gmail.com', 'pass', 'Core member and Deep Learning enthusiast. Organizes club events.', 'Deep Learning'),
('Anjali', 3, 'member', 'anjali@gmail.com', 'pass', 'Data Science lover. Enjoys working with real-world datasets.', 'Data Science');

-- EVENTS
INSERT INTO EVENT (title, description, date, time, venue, category, seats) VALUES
('AI Workshop', 'Hands-on introduction to Artificial Intelligence concepts including supervised learning, neural networks, and model evaluation using Python and scikit-learn.', '2026-05-10', '10:00:00', 'Lab 1', 'Workshop', 50),
('Hackathon', '24-hour coding challenge with real-world datasets. Prizes worth Rs 10,000. Industry mentors available throughout.', '2026-05-20', '09:00:00', 'Auditorium', 'Hackathon', 50),
('Data Science Talk', 'Industry expert shares insights on how data science is applied in top tech companies. Q&A session included.', '2026-06-05', '15:00:00', 'Seminar Hall', 'Talk', 60),
('NLP Workshop', 'Deep dive into Natural Language Processing — tokenization, embeddings, transformers. Hands-on with HuggingFace.', '2026-06-15', '11:00:00', 'Lab 2', 'Workshop', 40);

-- RESOURCES
INSERT INTO RESOURCE (title, type, link, tags, added_by, download_count) VALUES
('ML Notes', 'PDF', 'https://www.coursera.org/learn/machine-learning', 'ML', 2, 87),
('DL Tutorial', 'Video', 'https://www.tensorflow.org/tutorials', 'DL', 2, 64),
('Python for Data Science', 'PDF', 'https://www.kaggle.com/learn/python', 'DataScience', 2, 45),
('NLP with HuggingFace', 'Video', 'https://huggingface.co/learn', 'DL', 2, 32);

-- PARTICIPATION
INSERT INTO PARTICIPATION (member_id, event_id, role_in_event) VALUES
(1, 1, 'attendee'),
(3, 2, 'participant'),
(1, 2, 'participant'),
(2, 3, 'participant'),
(3, 3, 'participant');

-- ANNOUNCEMENTS
INSERT INTO ANNOUNCEMENT (title, content, created_by) VALUES
('Welcome to the Portal!', 'The AI & DS Club portal is now live. Register for upcoming events and explore our resource library. More features coming soon!', 2),
('Hackathon Registration Open', 'Registrations are now open for our annual hackathon. Limited seats — register now to secure your spot!', 2),
('New Resources Added', 'Check out the newly added NLP with HuggingFace tutorial and Python for Data Science guide in the Resource Library.', 2);

-- =====================
-- QUERIES (for presentation)
-- =====================

-- Active members and their participation counts
SELECT M.name, M.role, M.subcommittee, COUNT(P.participation_id) AS events_attended
FROM MEMBER M
LEFT JOIN PARTICIPATION P ON M.member_id = P.member_id
GROUP BY M.member_id, M.name, M.role, M.subcommittee
ORDER BY events_attended DESC;

-- Most registered events
SELECT E.title, E.category, COUNT(P.member_id) AS total_participants
FROM EVENT E
LEFT JOIN PARTICIPATION P ON E.event_id = P.event_id
GROUP BY E.event_id, E.title, E.category
ORDER BY total_participants DESC;

-- Most accessed resource types
SELECT tags, SUM(download_count) AS total_downloads
FROM RESOURCE
GROUP BY tags
ORDER BY total_downloads DESC;

-- Resources added by core members
SELECT R.title, R.tags, R.download_count, M.name AS added_by
FROM RESOURCE R
JOIN MEMBER M ON R.added_by = M.member_id
WHERE M.role = 'core';

-- Transaction: register member for event
START TRANSACTION;
INSERT INTO PARTICIPATION (member_id, event_id, role_in_event)
VALUES (3, 1, 'participant');
COMMIT;

-- =====================
-- VERIFY ALL TABLES
-- =====================
SELECT * FROM MEMBER;
SELECT * FROM EVENT;
SELECT * FROM RESOURCE;
SELECT * FROM PARTICIPATION;
SELECT * FROM ANNOUNCEMENT;
SELECT * FROM EVENT_FEEDBACK;

ALTER TABLE MEMBER ADD COLUMN approved TINYINT DEFAULT 1;
-- existing members stay approved; new requests will default to 0