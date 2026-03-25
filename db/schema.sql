begin;

create extension if not exists pgcrypto;

do $$
begin
  create type app_role as enum ('student', 'teacher', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type lesson_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type submission_status as enum ('draft', 'submitted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type feedback_status as enum ('pending', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role app_role not null default 'student',
  image_url text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  school_name text,
  grade smallint not null check (grade between 1 and 12),
  class_number smallint not null check (class_number between 1 and 99),
  title text not null,
  teacher_user_id uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_user_id, grade, class_number)
);

create table if not exists classroom_members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  student_number smallint,
  joined_at timestamptz not null default now(),
  unique (classroom_id, user_id)
);

create unique index if not exists classroom_members_unique_number_idx
  on classroom_members (classroom_id, student_number)
  where student_number is not null;

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  teacher_user_id uuid not null references users(id) on delete restrict,
  subject text not null,
  lesson_date date not null,
  title text not null,
  description text not null,
  allow_public_feed boolean not null default true,
  status lesson_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lesson_rubric_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  position smallint not null,
  title text not null,
  excellent_points smallint not null default 4,
  average_points smallint not null default 2,
  basic_points smallint not null default 0,
  excellent_criteria text not null,
  average_criteria text not null,
  basic_criteria text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_public boolean not null default false,
  status submission_status not null default 'submitted',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_user_id)
);

create table if not exists submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  file_name text,
  file_url text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists submission_feedbacks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references submissions(id) on delete cascade,
  total_score smallint,
  max_score smallint,
  summary text,
  strengths text[] not null default '{}'::text[],
  improvements text[] not null default '{}'::text[],
  status feedback_status not null default 'pending',
  model_name text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_classroom_date_idx
  on lessons (classroom_id, lesson_date desc);

create index if not exists submissions_student_idx
  on submissions (student_user_id, submitted_at desc);

create index if not exists submissions_lesson_idx
  on submissions (lesson_id, submitted_at desc);

create index if not exists feedbacks_status_idx
  on submission_feedbacks (status, generated_at desc);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row
execute function set_updated_at();

drop trigger if exists classrooms_set_updated_at on classrooms;
create trigger classrooms_set_updated_at
before update on classrooms
for each row
execute function set_updated_at();

drop trigger if exists lessons_set_updated_at on lessons;
create trigger lessons_set_updated_at
before update on lessons
for each row
execute function set_updated_at();

drop trigger if exists lesson_rubric_items_set_updated_at on lesson_rubric_items;
create trigger lesson_rubric_items_set_updated_at
before update on lesson_rubric_items
for each row
execute function set_updated_at();

drop trigger if exists submissions_set_updated_at on submissions;
create trigger submissions_set_updated_at
before update on submissions
for each row
execute function set_updated_at();

drop trigger if exists submission_feedbacks_set_updated_at on submission_feedbacks;
create trigger submission_feedbacks_set_updated_at
before update on submission_feedbacks
for each row
execute function set_updated_at();

commit;
