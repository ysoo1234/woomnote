begin;

insert into users (email, name, role)
values
  ('teacher@woomnote.dev', '김선생', 'teacher'),
  ('student1@woomnote.dev', '김하늘', 'student'),
  ('student2@woomnote.dev', '박민준', 'student'),
  ('student3@woomnote.dev', '이서윤', 'student')
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role;

insert into classrooms (school_name, grade, class_number, title, teacher_user_id)
select
  '움초등학교',
  3,
  1,
  '3학년 1반',
  u.id
from users u
where u.email = 'teacher@woomnote.dev'
on conflict (teacher_user_id, grade, class_number) do update
set
  school_name = excluded.school_name,
  title = excluded.title;

insert into classroom_members (classroom_id, user_id, student_number)
select c.id, u.id, x.student_number
from classrooms c
join (
  values
    ('student1@woomnote.dev', 1),
    ('student2@woomnote.dev', 2),
    ('student3@woomnote.dev', 3)
) as x(email, student_number)
  on true
join users u on u.email = x.email
where c.title = '3학년 1반'
on conflict (classroom_id, user_id) do update
set student_number = excluded.student_number;

insert into lessons (
  classroom_id,
  teacher_user_id,
  subject,
  lesson_date,
  title,
  description,
  allow_public_feed,
  status
)
select
  c.id,
  t.id,
  x.subject,
  x.lesson_date,
  x.title,
  x.description,
  true,
  'published'
from classrooms c
join users t on t.email = 'teacher@woomnote.dev'
join (
  values
    (
      '국어',
      current_date,
      '시의 목소리를 떠올리며 읽기',
      '오늘 읽은 시의 분위기와 마음을 생각하며 움노트를 작성해 보세요.'
    ),
    (
      '과학',
      current_date - 1,
      '강낭콩의 변화 관찰하기',
      '관찰한 강낭콩의 변화를 글과 그림으로 정리해 보세요.'
    )
) as x(subject, lesson_date, title, description)
  on true
where c.title = '3학년 1반'
and not exists (
  select 1
  from lessons l
  where l.classroom_id = c.id
    and l.lesson_date = x.lesson_date
    and l.title = x.title
);

insert into lesson_rubric_items (
  lesson_id,
  position,
  title,
  excellent_points,
  average_points,
  basic_points,
  excellent_criteria,
  average_criteria,
  basic_criteria
)
select
  l.id,
  x.position,
  x.title,
  x.excellent_points,
  x.average_points,
  x.basic_points,
  x.excellent_criteria,
  x.average_criteria,
  x.basic_criteria
from lessons l
join (
  values
    (
      '시의 목소리를 떠올리며 읽기',
      1,
      '작품 내용 이해',
      4,
      2,
      0,
      '시의 장면과 뜻을 또렷하게 설명한다.',
      '시의 뜻을 부분적으로 설명한다.',
      '시의 내용을 거의 설명하지 못한다.'
    ),
    (
      '시의 목소리를 떠올리며 읽기',
      2,
      '자기 생각 표현',
      4,
      2,
      0,
      '자신의 생각과 느낌을 구체적으로 적는다.',
      '느낌을 간단하게 적는다.',
      '느낌 표현이 거의 없다.'
    ),
    (
      '강낭콩의 변화 관찰하기',
      1,
      '관찰 기록',
      4,
      2,
      0,
      '변화 과정을 순서에 맞게 정확히 기록한다.',
      '일부 과정만 기록한다.',
      '기록이 불완전하다.'
    ),
    (
      '강낭콩의 변화 관찰하기',
      2,
      '과학적 설명',
      4,
      2,
      0,
      '관찰 결과를 자신의 말로 분명하게 설명한다.',
      '설명은 짧지만 의미는 있다.',
      '설명이 거의 없다.'
    )
) as x(
  lesson_title,
  position,
  title,
  excellent_points,
  average_points,
  basic_points,
  excellent_criteria,
  average_criteria,
  basic_criteria
)
  on l.title = x.lesson_title
on conflict (lesson_id, position) do update
set
  title = excluded.title,
  excellent_points = excluded.excellent_points,
  average_points = excluded.average_points,
  basic_points = excluded.basic_points,
  excellent_criteria = excluded.excellent_criteria,
  average_criteria = excluded.average_criteria,
  basic_criteria = excluded.basic_criteria;

insert into submissions (
  lesson_id,
  student_user_id,
  content,
  is_public,
  status,
  submitted_at
)
select
  l.id,
  u.id,
  x.content,
  x.is_public,
  'submitted',
  now()
from lessons l
join (
  values
    (
      '강낭콩의 변화 관찰하기',
      'student1@woomnote.dev',
      '초록색 잎이 자라면서 줄기가 더 곧게 섰다. 어제보다 훨씬 단단해진 모습이 보여서 식물이 자라고 있다는 걸 느꼈다.',
      true
    ),
    (
      '강낭콩의 변화 관찰하기',
      'student2@woomnote.dev',
      '강낭콩은 자라면서 잎의 크기와 줄기 움직임이 달라졌다. 내가 본 초록색 변화는 빛을 향해 자라는 준비처럼 보였다.',
      false
    ),
    (
      '시의 목소리를 떠올리며 읽기',
      'student1@woomnote.dev',
      '시를 읽을 때 목소리를 천천히 낮추면 마음이 차분해졌다. 나는 시의 장면을 떠올리며 조용히 읽어보고 싶었다.',
      true
    )
) as x(lesson_title, student_email, content, is_public)
  on l.title = x.lesson_title
join users u on u.email = x.student_email
on conflict (lesson_id, student_user_id) do update
set
  content = excluded.content,
  is_public = excluded.is_public,
  status = excluded.status,
  submitted_at = excluded.submitted_at;

insert into submission_feedbacks (
  submission_id,
  total_score,
  max_score,
  summary,
  strengths,
  improvements,
  status,
  model_name,
  generated_at
)
select
  s.id,
  x.total_score,
  x.max_score,
  x.summary,
  x.strengths,
  x.improvements,
  'completed',
  'gpt-5.4-mini',
  now()
from submissions s
join users u on u.id = s.student_user_id
join lessons l on l.id = s.lesson_id
join (
  values
    (
      'student1@woomnote.dev',
      '강낭콩의 변화 관찰하기',
      10,
      12,
      '관찰 내용을 순서대로 정리했고 식물의 변화를 자기 말로 잘 설명했어요.',
      array['변화 과정을 자연스럽게 설명했어요.', '관찰한 장면을 자기 말로 구체적으로 적었어요.']::text[],
      array['생활 속에서 비슷한 예를 하나 더 붙이면 더 좋아요.']::text[]
    ),
    (
      'student1@woomnote.dev',
      '시의 목소리를 떠올리며 읽기',
      11,
      12,
      '시를 읽으며 느낀 감정을 자신의 말로 잘 표현했어요.',
      array['목소리와 분위기의 연결이 좋아요.', '시의 장면을 떠올린 표현이 인상적이에요.']::text[],
      array['기억에 남는 구절을 한 가지 더 적어보면 더 좋아요.']::text[]
    )
) as x(student_email, lesson_title, total_score, max_score, summary, strengths, improvements)
  on u.email = x.student_email and l.title = x.lesson_title
where s.student_user_id = u.id
  and s.lesson_id = l.id
on conflict (submission_id) do update
set
  total_score = excluded.total_score,
  max_score = excluded.max_score,
  summary = excluded.summary,
  strengths = excluded.strengths,
  improvements = excluded.improvements,
  status = excluded.status,
  model_name = excluded.model_name,
  generated_at = excluded.generated_at;

commit;
