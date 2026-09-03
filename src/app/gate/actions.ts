"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  GATE_COOKIE,
  createGateToken,
  isGateConfigured,
  isValidPasscode,
  safeNextPath,
} from "@/lib/gate";

export type GateFormState = { error: string | null };

/**
 * 合言葉を検証し、正しければセッション Cookie を発行して元のパスへ戻す。
 * フォームの `useActionState` から呼ばれる。
 */
export async function submitPasscode(
  _prev: GateFormState,
  formData: FormData,
): Promise<GateFormState> {
  const passcode = String(formData.get("passcode") ?? "");
  const next = safeNextPath(formData.get("next")) ?? "/";

  if (!isGateConfigured()) {
    return { error: "サーバー側で SITE_PASSCODE が設定されていません。" };
  }
  if (passcode.length === 0) {
    return { error: "合言葉を入力してください。" };
  }
  if (!isValidPasscode(passcode)) {
    return { error: "合言葉が違います。" };
  }

  const token = createGateToken();
  if (!token) {
    return { error: "サーバー側で SITE_PASSCODE が設定されていません。" };
  }

  const store = await cookies();
  store.set(GATE_COOKIE, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAge,
  });

  redirect(next);
}
