import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL が未設定です。");
  return url;
}

/**
 * サーバー用の Supabase クライアント（service_role キー）。
 *
 * RLS をバイパスする。members の追加・更新・アーカイブや、
 * 取り込み処理など「サーバー側でのみ許可する書き込み」に使う。
 * 必ずサーバー環境（Route Handler / Server Action）からのみ呼ぶこと。
 */
export function createServiceRoleClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が未設定です。サーバー環境変数を確認してください。",
    );
  }
  return createClient(getUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * サーバー用の Supabase クライアント（anon キー）。
 * サーバーコンポーネントや Route Handler での読み取りに使う（RLS 準拠）。
 */
export function createAnonServerClient(): SupabaseClient {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
  }
  return createClient(getUrl(), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
