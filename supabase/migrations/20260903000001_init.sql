-- 勤怠管理アプリ 初期スキーマ
-- 仕様書「7. データモデル」「8. 認証・セキュリティ」に対応。
--
-- 前提: PostgreSQL 13+ / Supabase（gen_random_uuid() が組み込みで利用可能）。
-- 適用方法は supabase/README.md を参照。

-- ---------------------------------------------------------------------------
-- 共通: updated_at 自動更新トリガー
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- members: メンバー（名前リスト）
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,          -- 表示名。取り込みの照合キー
  sort_order integer     not null default 0,       -- 表示順（昇順）
  active     boolean     not null default true,    -- false = アーカイブ（非表示）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- attendance: 勤怠記録
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id           uuid        primary key default gen_random_uuid(),
  member_id    uuid        not null references public.members(id) on delete restrict,
  work_date    date        not null,               -- 勤務日（出勤時刻 + 4:00 境界から決定、手修正可）
  clock_in_at  timestamptz not null,               -- 出勤日時
  clock_out_at timestamptz,                         -- 退勤日時。NULL = 退勤待ち
  note         text,                                -- 備考
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

-- インデックス（仕様書 7.）
create index if not exists attendance_work_date_idx
  on public.attendance (work_date);
create index if not exists attendance_member_work_date_idx
  on public.attendance (member_id, work_date);

-- ---------------------------------------------------------------------------
-- RLS ポリシー（仕様書 8.）
--   attendance : anon に SELECT / INSERT / UPDATE / DELETE を許可（ログイン不要）
--   members    : anon は SELECT のみ。書き込みはサーバー経由のサービスロール
--                （サービスロールは RLS をバイパスするためポリシー不要）
-- 外周はサイト共通合言葉ゲート（Next.js proxy）で担保する。
-- ---------------------------------------------------------------------------
alter table public.members    enable row level security;
alter table public.attendance enable row level security;

-- members: 参照のみ
create policy members_select_anon
  on public.members
  for select
  to anon
  using (true);

-- attendance: 全操作を許可
create policy attendance_select_anon
  on public.attendance
  for select
  to anon
  using (true);

create policy attendance_insert_anon
  on public.attendance
  for insert
  to anon
  with check (true);

create policy attendance_update_anon
  on public.attendance
  for update
  to anon
  using (true)
  with check (true);

create policy attendance_delete_anon
  on public.attendance
  for delete
  to anon
  using (true);
