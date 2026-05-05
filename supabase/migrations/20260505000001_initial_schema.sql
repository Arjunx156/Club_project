-- ============================================================
-- ORCA Portal - PostgreSQL Schema (Supabase)
-- Converted from MySQL
-- ============================================================

-- 1. MEMBER TABLE
CREATE TABLE IF NOT EXISTS MEMBER (
    member_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    year INT,
    role VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100) DEFAULT 'pass123',
    bio TEXT,
    subcommittee VARCHAR(50) DEFAULT 'General',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved SMALLINT DEFAULT 1
);

-- 2. RESOURCE TABLE
CREATE TABLE IF NOT EXISTS RESOURCE (
    resource_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    type VARCHAR(50),
    link TEXT,
    tags VARCHAR(100),
    added_by INT REFERENCES MEMBER(member_id),
    download_count INT DEFAULT 0
);

-- 3. EVENT TABLE
CREATE TABLE IF NOT EXISTS EVENT (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    date DATE,
    time TIME,
    venue VARCHAR(100),
    category VARCHAR(50),
    seats INT DEFAULT 50
);

-- 4. PARTICIPATION TABLE
CREATE TABLE IF NOT EXISTS PARTICIPATION (
    participation_id SERIAL PRIMARY KEY,
    member_id INT REFERENCES MEMBER(member_id),
    event_id INT REFERENCES EVENT(event_id),
    role_in_event VARCHAR(50),
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. EVENT_FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS EVENT_FEEDBACK (
    feedback_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES EVENT(event_id),
    member_id INT REFERENCES MEMBER(member_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ANNOUNCEMENT TABLE
CREATE TABLE IF NOT EXISTS ANNOUNCEMENT (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    created_by INT REFERENCES MEMBER(member_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PROJECT TABLE
CREATE TABLE IF NOT EXISTS PROJECT (
    project_id SERIAL PRIMARY KEY,
    member_id INT REFERENCES MEMBER(member_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags VARCHAR(255),
    tech_stack VARCHAR(255),
    github_link VARCHAR(500),
    demo_link VARCHAR(500),
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PROJECT_LIKE TABLE
CREATE TABLE IF NOT EXISTS PROJECT_LIKE (
    member_id INT NOT NULL,
    project_id INT NOT NULL,
    PRIMARY KEY (member_id, project_id)
);

-- 9. TEAM_REQUEST TABLE
CREATE TABLE IF NOT EXISTS TEAM_REQUEST (
    request_id SERIAL PRIMARY KEY,
    member_id INT REFERENCES MEMBER(member_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_name VARCHAR(255),
    skills_needed VARCHAR(500),
    team_size INT DEFAULT 2,
    contact VARCHAR(255),
    status VARCHAR(10) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO MEMBER (name, year, role, email, password, bio, subcommittee) VALUES
('Arjun', 1, 'member', 'arjun@gmail.com', 'pass', 'Passionate about Machine Learning and Neural Networks.', 'Machine Learning'),
('Rahul', 2, 'core', 'rahul@gmail.com', 'pass', 'Core member and Deep Learning enthusiast. Organizes club events.', 'Deep Learning'),
('Anjali', 3, 'member', 'anjali@gmail.com', 'pass', 'Data Science lover. Enjoys working with real-world datasets.', 'Data Science')
ON CONFLICT (email) DO NOTHING;

INSERT INTO EVENT (title, description, date, time, venue, category, seats) VALUES
('AI Workshop', 'Hands-on introduction to Artificial Intelligence concepts including supervised learning, neural networks, and model evaluation using Python and scikit-learn.', '2026-05-10', '10:00:00', 'Lab 1', 'Workshop', 50),
('Hackathon', '24-hour coding challenge with real-world datasets. Prizes worth Rs 10,000. Industry mentors available throughout.', '2026-05-20', '09:00:00', 'Auditorium', 'Hackathon', 50),
('Data Science Talk', 'Industry expert shares insights on how data science is applied in top tech companies. Q&A session included.', '2026-06-05', '15:00:00', 'Seminar Hall', 'Talk', 60),
('NLP Workshop', 'Deep dive into Natural Language Processing — tokenization, embeddings, transformers. Hands-on with HuggingFace.', '2026-06-15', '11:00:00', 'Lab 2', 'Workshop', 40),
('Version Control and Bash', 'An introductory session covering essential command-line skills with Bash scripting and understanding version control fundamentals every developer needs.', '2025-06-05', '10:00:00', 'Lab 301', 'Workshop', 60),
('Git Version Control and GitHub', 'A hands-on workshop on Git branching, merging, pull requests, and collaborative development workflows using GitHub.', '2025-06-12', '10:00:00', 'Lab 301', 'Workshop', 60),
('Agentic AI Session', 'Explore the paradigm shift from static LLMs to autonomous AI agents — covering planning, tool use, memory, and multi-step reasoning.', '2025-06-19', '11:00:00', 'Seminar Hall A', 'Talk', 120),
('Build a Gemini-Powered YouTube Summarizer', 'A project workshop where participants build an end-to-end app that fetches YouTube transcripts and summarises them using the Gemini API.', '2025-06-26', '10:00:00', 'Lab 302', 'Workshop', 40),
('Getting Started with MCP, ADK and A2A', 'An introductory session on Google''s Model Context Protocol, Agent Development Kit (ADK), and Agent-to-Agent (A2A) communication frameworks.', '2025-07-03', '10:00:00', 'Lab 302', 'Workshop', 50),
('Building Personalized Agents with ADK, MCP, and Memory Bank', 'Advanced workshop on wiring persistent memory into agents built with the ADK and MCP, enabling personalized, context-aware AI assistants.', '2025-07-10', '10:00:00', 'Lab 302', 'Workshop', 40),
('Build a Location Intelligence ADK Agent with MCP servers for BigQuery and Google Maps', 'Project workshop building a geo-aware agent using ADK that queries spatial data from BigQuery and renders results via Google Maps MCP.', '2025-07-17', '10:00:00', 'Lab 302', 'Workshop', 35),
('Agentverse — The Scholar''s Grimoire: Building Knowledge Engines with RAG', 'Deep-dive into Retrieval Augmented Generation (RAG) pipelines — from embedding strategies and vector stores to production-grade knowledge engines.', '2025-07-24', '10:00:00', 'Seminar Hall A', 'Talk', 100),
('Agentverse — The Summoner''s Concord: Architecting Multi-Agent Systems', 'Capstone session on orchestrating networks of specialised agents — covering communication protocols, delegation patterns, and fault tolerance.', '2025-07-31', '10:00:00', 'Seminar Hall A', 'Talk', 100);

INSERT INTO RESOURCE (title, type, link, tags, added_by, download_count) VALUES
('ML Notes', 'PDF', 'https://www.coursera.org/learn/machine-learning', 'ML', 2, 87),
('DL Tutorial', 'Video', 'https://www.tensorflow.org/tutorials', 'DL', 2, 64),
('Python for Data Science', 'PDF', 'https://www.kaggle.com/learn/python', 'DataScience', 2, 45),
('NLP with HuggingFace', 'Video', 'https://huggingface.co/learn', 'DL', 2, 32);

INSERT INTO ANNOUNCEMENT (title, content, created_by) VALUES
('Welcome to the Portal!', 'The AI & DS Club portal is now live. Register for upcoming events and explore our resource library. More features coming soon!', 2),
('Hackathon Registration Open', 'Registrations are now open for our annual hackathon. Limited seats — register now to secure your spot!', 2),
('New Resources Added', 'Check out the newly added NLP with HuggingFace tutorial and Python for Data Science guide in the Resource Library.', 2);
