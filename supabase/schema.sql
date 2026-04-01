create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  goal text not null default 'maintain',
  calorie_target integer,
  protein_target integer,
  is_premium boolean not null default false,
  age integer,
  weight_kg numeric,
  height_cm numeric,
  has_completed_onboarding boolean not null default false,
  has_received_demo boolean not null default true,
  notifications_enabled boolean not null default false,
  meal_reminders_enabled boolean not null default true,
  consistency_reminders_enabled boolean not null default true,
  progress_nudges_enabled boolean not null default true,
  notification_permission_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists has_received_demo boolean not null default true;
alter table public.profiles add column if not exists notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists meal_reminders_enabled boolean not null default true;
alter table public.profiles add column if not exists consistency_reminders_enabled boolean not null default true;
alter table public.profiles add column if not exists progress_nudges_enabled boolean not null default true;
alter table public.profiles add column if not exists notification_permission_status text;

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  meal_type text not null default 'unknown',
  original_text text not null,
  transcription_text text not null,
  total_calories numeric not null default 0,
  total_protein numeric not null default 0,
  total_carbs numeric not null default 0,
  total_fat numeric not null default 0,
  total_fiber numeric not null default 0,
  total_sugar numeric not null default 0,
  total_sodium numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  quantity numeric not null default 0,
  unit text not null default 'serving',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  sugar numeric not null default 0,
  sodium numeric not null default 0,
  confidence numeric,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nutrition_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  base_quantity numeric not null default 1,
  base_unit text not null default 'serving',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  sugar numeric not null default 0,
  sodium numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_correction_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_id uuid references public.meals(id) on delete set null,
  original_transcript text not null,
  parsed_estimate jsonb not null default '{}'::jsonb,
  clarification_answers jsonb not null default '[]'::jsonb,
  final_items jsonb not null default '[]'::jsonb,
  template_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists nutrition_references_user_normalized_name_idx
  on public.nutrition_references(user_id, normalized_name);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.nutrition_references enable row level security;
alter table public.meal_correction_signals enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id);

create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);

create policy "meals_update_own" on public.meals
  for update using (auth.uid() = user_id);

create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

create policy "meal_items_select_via_parent" on public.meal_items
  for select using (
    exists (
      select 1 from public.meals
      where public.meals.id = meal_items.meal_id
        and public.meals.user_id = auth.uid()
    )
  );

create policy "meal_items_insert_via_parent" on public.meal_items
  for insert with check (
    exists (
      select 1 from public.meals
      where public.meals.id = meal_items.meal_id
        and public.meals.user_id = auth.uid()
    )
  );

create policy "meal_items_update_via_parent" on public.meal_items
  for update using (
    exists (
      select 1 from public.meals
      where public.meals.id = meal_items.meal_id
        and public.meals.user_id = auth.uid()
    )
  );

create policy "meal_items_delete_via_parent" on public.meal_items
  for delete using (
    exists (
      select 1 from public.meals
      where public.meals.id = meal_items.meal_id
        and public.meals.user_id = auth.uid()
    )
  );

create policy "nutrition_references_select_own" on public.nutrition_references
  for select using (auth.uid() = user_id);

create policy "nutrition_references_insert_own" on public.nutrition_references
  for insert with check (auth.uid() = user_id);

create policy "nutrition_references_update_own" on public.nutrition_references
  for update using (auth.uid() = user_id);

create policy "nutrition_references_delete_own" on public.nutrition_references
  for delete using (auth.uid() = user_id);

create policy "meal_correction_signals_select_own" on public.meal_correction_signals
  for select using (auth.uid() = user_id);

create policy "meal_correction_signals_insert_own" on public.meal_correction_signals
  for insert with check (auth.uid() = user_id);

create policy "meal_correction_signals_update_own" on public.meal_correction_signals
  for update using (auth.uid() = user_id);

create policy "meal_correction_signals_delete_own" on public.meal_correction_signals
  for delete using (auth.uid() = user_id);
