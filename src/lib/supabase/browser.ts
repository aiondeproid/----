"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

/**
 * ブラウザ用の Supabase クライアント（anon キー）。
 *
 * このアプリはログイン不要なので、セッション永続化・自動リフレッシュは無効にする。
 * RLS により attendance は全操作可、members は SELECT のみ。
 */
export function getBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。.env.local を確認してください。",
    );
  }

  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
