-- ローカル開発用の任意シード。
-- `supabase db reset` 実行時に自動で読み込まれる。本番では実行しないこと。

insert into public.members (name, sort_order, active) values
  ('山田 太郎', 10, true),
  ('佐藤 花子', 20, true),
  ('鈴木 一郎', 30, true),
  ('高橋 実', 40, false)   -- アーカイブ済みメンバーの例
on conflict (name) do nothing;
