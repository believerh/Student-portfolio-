-- File Versioning System
-- Creates table to track file versions with restore capability

create table if not exists file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade not null,
  version_number integer not null,
  storage_path text not null,
  data text not null,
  size text not null,
  mime_type text,
  created_by uuid references users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  unique(file_id, version_number)
);

create index if not exists idx_file_versions_file_id on file_versions(file_id);
create index if not exists idx_file_versions_created_at on file_versions(created_at desc);

-- Enable RLS
alter table file_versions enable row level security;

-- Policy: allow read for authenticated users; write for admins/owners
create policy "Authenticated users can read file versions"
  on file_versions for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own file versions"
  on file_versions for insert
  with check (
    created_by = auth.uid() or
    exists (
      select 1 from files
      where files.id = file_versions.file_id
      and files.student_id = auth.uid()
    )
  );

create policy "Users can update their own file versions"
  on file_versions for update
  using (
    created_by = auth.uid() or
    exists (
      select 1 from files
      where files.id = file_versions.file_id
      and files.student_id = auth.uid()
    )
  );

create policy "Users can delete their own file versions"
  on file_versions for delete
  using (
    created_by = auth.uid() or
    exists (
      select 1 from files
      where files.id = file_versions.file_id
      and files.student_id = auth.uid()
    )
  );
