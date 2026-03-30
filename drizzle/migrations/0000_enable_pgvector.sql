-- Enable pgvector extension for embedding storage and similarity search.
-- Safe to run even if already enabled (IF NOT EXISTS).
CREATE EXTENSION IF NOT EXISTS vector;
