-- LMS Integration - Assignment Synchronization
-- Stores assignments synced from LMS systems (Moodle, Canvas, Google Classroom)

create table if not exists lms_assignments (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    due_date timestamptz,
    max_points integer default 100,
    course_id text not null,
    external_id text not null,
    lms_type text not null check (lms_type in ('moodle', 'canvas', 'google')),
    lms_url text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    
    unique(external_id, lms_type, course_id)
);

create index if not exists idx_lms_assignments_course on lms_assignments(course_id);
create index if not exists idx_lms_assignments_due on lms_assignments(due_date);
create index if not exists idx_lms_assignments_lms_type on lms_assignments(lms_type);

-- Track submission status per student per assignment
create table if not exists lms_submissions (
    id uuid primary key default gen_random_uuid(),
    assignment_id uuid references lms_assignments(id) on delete cascade,
    student_id uuid references students(id) on delete cascade,
    submitted_at timestamptz,
    grade numeric,
    feedback text,
    file_id uuid references files(id),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    
    unique(assignment_id, student_id)
);

-- LMS connection settings (encrypted API tokens)
create table if not exists lms_connections (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    lms_type text not null check (lms_type in ('moodle', 'canvas', 'google')),
    base_url text,
    api_token_encrypted text,
    is_active boolean default true,
    last_sync timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Auto-update updated_at on lms_assignments
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists trg_lms_assignments_updated on lms_assignments;
create trigger trg_lms_assignments_updated
    before update on lms_assignments
    for each row
    execute function update_updated_at();