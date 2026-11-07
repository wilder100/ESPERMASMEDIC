-- Espermas Medic Academy · Configuración COMPLETA de la base de datos.
-- Ejecutar UNA sola vez en Supabase > SQL Editor > New query > Run.

-- MedBanco · Esquema, seguridad (RLS) y funciones. Ejecutar en Supabase > SQL Editor.

-- ========== TABLAS ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  area text not null check (area in ('basicas','clinicas')),
  sort_order int not null default 0
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  unique (course_id, name)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  name text not null,
  unique (unit_id, name)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  statement text not null,
  option_a text not null, option_b text not null, option_c text not null,
  option_d text not null, option_e text not null,
  correct char(1) not null check (correct in ('A','B','C','D','E')),
  explanation text not null,
  wrong_explanations jsonb not null default '{}'::jsonb, -- {"A": "por qué es incorrecta", ...}
  image_url text,
  difficulty text not null default 'alta' check (difficulty in ('baja','media','alta')),
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  total_questions int not null check (total_questions in (20,50,100)),
  score int,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  exam_id uuid references public.exams(id) on delete set null,
  selected char(1) not null check (selected in ('A','B','C','D','E')),
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.attempts (user_id, created_at desc);
create index on public.questions (topic_id);

-- ========== FUNCIONES ==========
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea el perfil automáticamente al registrarse (siempre como 'student').
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- La corrección se calcula en el servidor: el cliente no puede falsear aciertos.
create or replace function public.set_attempt_correctness() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select (q.correct = new.selected) into new.is_correct
  from public.questions q where q.id = new.question_id;
  return new;
end $$;
create trigger attempts_set_correctness before insert on public.attempts
  for each row execute function public.set_attempt_correctness();

-- Conteo público de preguntas por curso (para las tarjetas).
create or replace function public.course_question_counts()
returns table (slug text, total bigint)
language sql security definer stable set search_path = '' as $$
  select c.slug, count(q.id)
  from public.courses c
  left join public.units u on u.course_id = c.id
  left join public.topics t on t.unit_id = u.id
  left join public.questions q on q.topic_id = t.id and q.is_active
  group by c.slug;
$$;
grant execute on function public.course_question_counts() to anon, authenticated;

-- ========== RLS ==========
alter table public.profiles  enable row level security;
alter table public.courses   enable row level security;
alter table public.units     enable row level security;
alter table public.topics    enable row level security;
alter table public.questions enable row level security;
alter table public.exams     enable row level security;
alter table public.attempts  enable row level security;

-- Perfiles: cada quien ve el suyo; solo puede editar su nombre (nunca el rol).
create policy "perfil propio (lectura)" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil propio (edición)" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- Catálogo: lectura pública de cursos/unidades/temas; solo admin escribe.
create policy "cursos lectura"   on public.courses for select using (true);
create policy "unidades lectura" on public.units   for select using (true);
create policy "temas lectura"    on public.topics  for select using (true);
create policy "cursos admin"   on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "unidades admin" on public.units   for all using (public.is_admin()) with check (public.is_admin());
create policy "temas admin"    on public.topics  for all using (public.is_admin()) with check (public.is_admin());

-- Preguntas: solo usuarios con sesión leen las activas; solo admin escribe.
create policy "preguntas lectura" on public.questions for select to authenticated
  using (is_active or public.is_admin());
create policy "preguntas admin" on public.questions for all
  using (public.is_admin()) with check (public.is_admin());

-- Intentos y simulacros: cada estudiante solo ve y crea los suyos.
create policy "intentos propios" on public.attempts for select using (user_id = auth.uid() or public.is_admin());
create policy "intentos insertar" on public.attempts for insert to authenticated with check (user_id = auth.uid());
create policy "simulacros propios" on public.exams for select using (user_id = auth.uid() or public.is_admin());
create policy "simulacros insertar" on public.exams for insert to authenticated with check (user_id = auth.uid());
create policy "simulacros cerrar" on public.exams for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========== STORAGE (imágenes de preguntas) ==========
insert into storage.buckets (id, name, public) values ('question-images','question-images', true)
on conflict (id) do nothing;
create policy "imagenes lectura" on storage.objects for select using (bucket_id = 'question-images');
create policy "imagenes admin"   on storage.objects for all
  using (bucket_id = 'question-images' and public.is_admin())
  with check (bucket_id = 'question-images' and public.is_admin());

-- MedBanco · Datos iniciales. Ejecutar DESPUÉS de 01_schema.sql.

insert into public.courses (slug, name, area, sort_order) values
 ('anatomia','Anatomía','basicas',1),('fisiologia','Fisiología','basicas',2),
 ('bioquimica','Bioquímica','basicas',3),('histologia','Histología','basicas',4),
 ('embriologia','Embriología','basicas',5),('microbiologia','Microbiología','basicas',6),
 ('parasitologia','Parasitología','basicas',7),('farmacologia','Farmacología','basicas',8),
 ('patologia','Patología','clinicas',9),('semiologia','Semiología','clinicas',10),
 ('medicina-interna','Medicina interna','clinicas',11),('cirugia','Cirugía','clinicas',12),
 ('pediatria','Pediatría','clinicas',13),('ginecologia-obstetricia','Ginecología y obstetricia','clinicas',14)
on conflict (slug) do nothing;

-- Unidades y temas de ejemplo (el admin podrá crear más desde el panel).
with v(slug, unit, topic) as (values
 ('medicina-interna','Cardiología','Síndromes coronarios agudos'),
 ('fisiologia','Sistema respiratorio','Hipoxemia y gradiente A-a'),
 ('farmacologia','Quimioterapia antiinfecciosa','Antituberculosos'),
 ('microbiologia','Bacteriología','Neisseria y complemento'),
 ('pediatria','Cirugía pediátrica','Estenosis hipertrófica de píloro'),
 ('ginecologia-obstetricia','Obstetricia patológica','Trastornos hipertensivos del embarazo')),
u as (
  insert into public.units (course_id, name, sort_order)
  select c.id, v.unit, 1 from v join public.courses c on c.slug = v.slug
  returning id, course_id, name)
insert into public.topics (unit_id, name)
select u.id, v.topic from u join public.courses c on c.id = u.course_id
join v on v.slug = c.slug and v.unit = u.name;

-- Preguntas ORIGINALES (no copiadas de exámenes reales), estilo residentado, dificultad alta.
insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Varón de 58 años con dolor torácico opresivo de 40 minutos. PA 82/50 mmHg, ingurgitación yugular, pulmones limpios. ECG: elevación del ST en II, III y aVF y en V4R. Además de antiagregación, ¿cuál es la conducta inicial más adecuada?',
 'Nitroglicerina sublingual','Furosemida endovenosa','Solución salina 0,9 % en bolo','Morfina endovenosa en dosis altas','Metoprolol endovenoso','C',
 'Infarto inferior con compromiso del ventrículo derecho: el gasto depende de la precarga. Se indica reposición de volumen y reperfusión urgente.',
 '{"A":"Los nitratos reducen la precarga y precipitan hipotensión grave en infarto de VD.","B":"Los diuréticos disminuyen la precarga; el paciente no tiene congestión pulmonar.","D":"La morfina en dosis altas reduce la precarga y empeora la hipotensión.","E":"Los betabloqueadores están contraindicados con hipotensión y bajo gasto."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Síndromes coronarios agudos';

insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Paciente sedado con opioides presenta PaO2 55 mmHg y PaCO2 70 mmHg con aire ambiente. El gradiente alvéolo-arterial de O2 es normal. ¿Cuál es el mecanismo de la hipoxemia?',
 'Hipoventilación alveolar','Cortocircuito (shunt) derecha-izquierda','Alteración de la relación ventilación/perfusión','Alteración de la difusión','Baja presión inspirada de O2 por altitud','A',
 'La hipoxemia con PaCO2 elevada y gradiente A-a normal indica hipoventilación pura. En la altitud el gradiente también es normal, pero la PaCO2 está baja por hiperventilación compensadora.',
 '{"B":"El shunt aumenta el gradiente A-a y no corrige con O2 al 100 %.","C":"La alteración V/Q aumenta el gradiente A-a.","D":"La alteración de la difusión aumenta el gradiente A-a, sobre todo en ejercicio.","E":"En altitud la PaCO2 desciende; aquí está elevada."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Hipoxemia y gradiente A-a';

insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Un paciente con tuberculosis pulmonar en tratamiento presenta parestesias en guante y calcetín. ¿Qué fármaco es el responsable y qué medida lo previene?',
 'Isoniazida; suplementar piridoxina (B6)','Rifampicina; suplementar tiamina','Etambutol; suplementar piridoxina','Pirazinamida; suplementar ácido fólico','Estreptomicina; suplementar cobalamina','A',
 'La isoniazida compite con la piridoxina y aumenta su excreción, causando neuropatía periférica. Se previene con B6, sobre todo en diabéticos, alcohólicos, desnutridos y gestantes.',
 '{"B":"La rifampicina causa hepatotoxicidad e inductor enzimático, no neuropatía.","C":"El etambutol produce neuritis óptica (discromatopsia rojo-verde).","D":"La pirazinamida produce hiperuricemia y hepatotoxicidad.","E":"La estreptomicina produce ototoxicidad y nefrotoxicidad."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Antituberculosos';

insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Un adolescente presenta su segundo episodio de meningitis por Neisseria meningitidis. ¿Qué deficiencia inmunológica es la más probable?',
 'C3','Inhibidor de C1','Componentes terminales del complemento (C5-C9)','IgA secretora','Linfocitos B (agammaglobulinemia ligada a X)','C',
 'El complejo de ataque a membrana (C5b-C9) es esencial para lisar Neisseria. Su déficit predispone a infecciones neisserianas recurrentes.',
 '{"A":"El déficit de C3 causa infecciones piógenas graves por bacterias encapsuladas en general.","B":"El déficit de inhibidor de C1 causa angioedema hereditario.","D":"El déficit de IgA se asocia a infecciones sinopulmonares y gastrointestinales.","E":"La agammaglobulinemia ligada a X predispone a infecciones recurrentes por encapsulados y enterovirus."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Neisseria y complemento';

insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Lactante de 4 semanas con vómitos en proyectil no biliosos tras cada toma y masa palpable en epigastrio. ¿Qué alteración hidroelectrolítica es esperable?',
 'Acidosis metabólica hiperclorémica','Alcalosis metabólica hipoclorémica e hipopotasémica','Acidosis respiratoria con hiperpotasemia','Alcalosis respiratoria con hipernatremia','Acidosis metabólica con brecha aniónica elevada','B',
 'En la estenosis hipertrófica de píloro se pierde HCl por el vómito, con alcalosis metabólica hipoclorémica; la hipopotasemia se agrava por el hiperaldosteronismo secundario. Se corrige antes de la piloromiotomía.',
 '{"A":"La pérdida de cloro por vómito no genera hipercloremia.","C":"No hay falla ventilatoria primaria.","D":"No existe hiperventilación primaria ni hipernatremia característica.","E":"La brecha aniónica elevada ocurre en cetoacidosis o acidosis láctica."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Estenosis hipertrófica de píloro';

insert into public.questions (topic_id, statement, option_a, option_b, option_c, option_d, option_e, correct, explanation, wrong_explanations, difficulty, source)
select t.id,
 'Gestante de 34 semanas con PA 165/110 mmHg, cefalea, dolor en epigastrio, plaquetas 90 000/mm³ y TGO elevada. ¿Cuál es la conducta más adecuada?',
 'Reposo domiciliario y control en una semana','Sulfato de magnesio, antihipertensivo y finalización del embarazo tras estabilizar','Solo labetalol y continuar hasta las 37 semanas','Furosemida y observación','Corticoides y manejo expectante prolongado','B',
 'Cuadro compatible con preeclampsia con criterios de severidad / síndrome HELLP. Se previene la eclampsia con sulfato de magnesio, se controla la presión y se termina la gestación, iniciando corticoides para madurez pulmonar si no retrasa la interrupción.',
 '{"A":"Riesgo inminente de eclampsia, desprendimiento y falla orgánica.","C":"El manejo expectante no es aceptable con HELLP.","D":"Los diuréticos no tratan la preeclampsia y reducen el volumen plasmático.","E":"El manejo expectante prolongado está contraindicado con HELLP a esta edad gestacional."}'::jsonb,
 'alta','Original · estilo residentado'
from public.topics t where t.name = 'Trastornos hipertensivos del embarazo';

-- MedBanco · Simulacros. Ejecutar en SQL Editor DESPUÉS de 01 y 02.

-- Permite simulacros con menos preguntas si el banco aún es pequeño.
alter table public.exams drop constraint if exists exams_total_questions_check;
alter table public.exams add constraint exams_total_questions_check check (total_questions between 1 and 100);
alter table public.exams
  add column if not exists time_limit_seconds int,
  add column if not exists correct_count int,
  add column if not exists duration_seconds int;

-- El cliente ya no puede editar notas: solo la función de abajo las escribe.
revoke update on public.exams from authenticated, anon;

-- Califica en el servidor: guarda respuestas, cuenta aciertos y cierra el simulacro.
create or replace function public.finish_exam(p_exam_id uuid, p_answers jsonb, p_elapsed int)
returns table (r_correct int, r_total int, r_score int)
language plpgsql security definer set search_path = '' as $$
declare v_total int; v_ok int;
begin
  select e.total_questions into v_total from public.exams e
  where e.id = p_exam_id and e.user_id = auth.uid() and e.finished_at is null;
  if v_total is null then raise exception 'Simulacro no válido o ya finalizado'; end if;

  insert into public.attempts (user_id, question_id, exam_id, selected)
  select auth.uid(), (a ->> 'question_id')::uuid, p_exam_id, a ->> 'selected'
  from jsonb_array_elements(p_answers) a;

  select count(distinct t.question_id) into v_ok from public.attempts t
  where t.exam_id = p_exam_id and t.is_correct;

  update public.exams e set
    correct_count = v_ok,
    score = round(v_ok * 100.0 / v_total),
    finished_at = now(),
    duration_seconds = least(greatest(p_elapsed, 0), coalesce(e.time_limit_seconds, p_elapsed))
  where e.id = p_exam_id;

  return query select v_ok, v_total, round(v_ok * 100.0 / v_total)::int;
end $$;
grant execute on function public.finish_exam(uuid, jsonb, int) to authenticated;
