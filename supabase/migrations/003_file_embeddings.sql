-- Enable pgvector extension for embedding storage
create extension if not exists vector;

-- Table to store file embeddings (semantic vectors)
create table if not exists file_embeddings (
  file_id uuid primary key references files(id) on delete cascade,
  embedding vector(1536),
  model text not null default 'text-embedding-3-small',
  created_at timestamptz default now()
);

-- Index for fast similarity search using cosine distance
-- ivfflat provides approximate nearest neighbor search; lists = 100 for moderate dataset sizes
create index if not exists file_embeddings_embedding_idx on file_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Function to retrieve similar files by embedding similarity
create or replace function get_similar_files(p_file_id uuid, p_limit int default 5)
returns table (
  file_id uuid,
  file_name text,
  file_type text,
  similarity float
) as $$
  select
    fe.file_id,
    f.name as file_name,
    f.type as file_type,
    1 - (fe.embedding <=> f_e.embedding) as similarity
  from file_embeddings f_e
  join file_embeddings fe on true
  join files f on f.id = fe.file_id
  where f_e.file_id = p_file_id
    and fe.file_id != p_file_id
  order by fe.embedding <=> f_e.embedding
  limit p_limit;
$$ language sql stable;
