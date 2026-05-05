-- Run this entire file in MySQL Workbench on the ai_ds_club database
-- ============================================================
-- STEP 1: NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS PROJECT (
  project_id   INT AUTO_INCREMENT PRIMARY KEY,
  member_id    INT,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  tags         VARCHAR(255),
  tech_stack   VARCHAR(255),
  github_link  VARCHAR(500),
  demo_link    VARCHAR(500),
  views        INT DEFAULT 0,
  likes        INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES MEMBER(member_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PROJECT_LIKE (
  member_id  INT NOT NULL,
  project_id INT NOT NULL,
  PRIMARY KEY (member_id, project_id)
);

CREATE TABLE IF NOT EXISTS TEAM_REQUEST (
  request_id   INT AUTO_INCREMENT PRIMARY KEY,
  member_id    INT,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  event_name   VARCHAR(255),
  skills_needed VARCHAR(500),
  team_size    INT DEFAULT 2,
  contact      VARCHAR(255),
  status       ENUM('open','closed') DEFAULT 'open',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES MEMBER(member_id) ON DELETE SET NULL
);

-- ============================================================
-- STEP 2: NEW EVENTS
-- ============================================================
-- Adjust dates, times, venue, and seats as needed before running

INSERT INTO EVENT (title, description, date, time, venue, category, seats) VALUES
('Version Control and Bash',
 'An introductory session covering essential command-line skills with Bash scripting and understanding version control fundamentals every developer needs.',
 '2025-06-05', '10:00:00', 'Lab 301', 'Workshop', 60),

('Git Version Control and GitHub',
 'A hands-on workshop on Git branching, merging, pull requests, and collaborative development workflows using GitHub.',
 '2025-06-12', '10:00:00', 'Lab 301', 'Workshop', 60),

('Agentic AI Session',
 'Explore the paradigm shift from static LLMs to autonomous AI agents — covering planning, tool use, memory, and multi-step reasoning.',
 '2025-06-19', '11:00:00', 'Seminar Hall A', 'Talk', 120),

('Build a Gemini-Powered YouTube Summarizer',
 'A project workshop where participants build an end-to-end app that fetches YouTube transcripts and summarises them using the Gemini API.',
 '2025-06-26', '10:00:00', 'Lab 302', 'Workshop', 40),

('Getting Started with MCP, ADK and A2A',
 'An introductory session on Google''s Model Context Protocol, Agent Development Kit (ADK), and Agent-to-Agent (A2A) communication frameworks.',
 '2025-07-03', '10:00:00', 'Lab 302', 'Workshop', 50),

('Building Personalized Agents with ADK, MCP, and Memory Bank',
 'Advanced workshop on wiring persistent memory into agents built with the ADK and MCP, enabling personalized, context-aware AI assistants.',
 '2025-07-10', '10:00:00', 'Lab 302', 'Workshop', 40),

('Build a Location Intelligence ADK Agent with MCP servers for BigQuery and Google Maps',
 'Project workshop building a geo-aware agent using ADK that queries spatial data from BigQuery and renders results via Google Maps MCP.',
 '2025-07-17', '10:00:00', 'Lab 302', 'Workshop', 35),

('Agentverse — The Scholar''s Grimoire: Building Knowledge Engines with RAG',
 'Deep-dive into Retrieval Augmented Generation (RAG) pipelines — from embedding strategies and vector stores to production-grade knowledge engines.',
 '2025-07-24', '10:00:00', 'Seminar Hall A', 'Talk', 100),

('Agentverse — The Summoner''s Concord: Architecting Multi-Agent Systems',
 'Capstone session on orchestrating networks of specialised agents — covering communication protocols, delegation patterns, and fault tolerance.',
 '2025-07-31', '10:00:00', 'Seminar Hall A', 'Talk', 100);
