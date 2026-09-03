"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  ADMIN_COOKIE,
  createAdminToken,
  isAdminConfigured,
  isValidAdminPasscode,
  verifyAdminToken,
} from "@/lib/admin";
import {
  insertMember,
  moveMember,
  setMemberActive,
  updateMemberName,
  updateMemberSortOrder,
} from "@/lib/members";

export type ActionState = { ok: boolean; error: string | null };

const OK: ActionState = { ok: true, error: null };
const fail = (error: string): ActionState => ({ ok: false, error });

async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

function revalidateAll() {
  revalidatePath("/members");
  revalidatePath("/attendance");
  revalidatePath("/list");
}

/** 管理用合言葉を検証し、管理セッション Cookie を発行する。 */
export async function unlockAdminAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!isAdminConfigured()) {
    return fail("サーバー側で ADMIN_PASSCODE が設定されていません。");
  }
  if (passcode.length === 0) return fail("合言葉を入力してください。");
  if (!isValidAdminPasscode(passcode)) return fail("合言葉が違います。");

  const token = createAdminToken();
  if (!token) return fail("サーバー側で ADMIN_PASSCODE が設定されていません。");

  const store = await cookies();
  store.set(ADMIN_COOKIE, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAge,
  });
  revalidatePath("/members");
  return OK;
}

/** 管理セッションを終了する（フォームの action 用なので戻り値なし）。 */
export async function lockAdminAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  revalidatePath("/members");
}

const nameField = z
  .string()
  .trim()
  .min(1, "名前を入力してください")
  .max(100, "名前は 100 文字以内で入力してください");
const sortOrderField = z.coerce
  .number()
  .refine((n) => Number.isFinite(n), "表示順は数値で入力してください")
  .transform((n) => Math.trunc(n));

export async function addMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireAdmin())) return fail("管理用合言葉の認証が必要です。");
  const parsed = z
    .object({ name: nameField, sortOrder: sortOrderField })
    .safeParse({
      name: formData.get("name"),
      sortOrder: formData.get("sortOrder") || 0,
    });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await insertMember(parsed.data.name, parsed.data.sortOrder);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "追加に失敗しました");
  }
  revalidateAll();
  return OK;
}

export async function renameMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireAdmin())) return fail("管理用合言葉の認証が必要です。");
  const parsed = z
    .object({ id: z.uuid(), name: nameField })
    .safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await updateMemberName(parsed.data.id, parsed.data.name);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "更新に失敗しました");
  }
  revalidateAll();
  return OK;
}

export async function setSortOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireAdmin())) return fail("管理用合言葉の認証が必要です。");
  const parsed = z
    .object({ id: z.uuid(), sortOrder: sortOrderField })
    .safeParse({ id: formData.get("id"), sortOrder: formData.get("sortOrder") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await updateMemberSortOrder(parsed.data.id, parsed.data.sortOrder);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "更新に失敗しました");
  }
  revalidateAll();
  return OK;
}

export async function moveMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireAdmin())) return fail("管理用合言葉の認証が必要です。");
  const parsed = z
    .object({ id: z.uuid(), direction: z.enum(["up", "down"]) })
    .safeParse({
      id: formData.get("id"),
      direction: formData.get("direction"),
    });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await moveMember(parsed.data.id, parsed.data.direction);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "並び替えに失敗しました");
  }
  revalidateAll();
  return OK;
}

export async function setMemberActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await requireAdmin())) return fail("管理用合言葉の認証が必要です。");
  const parsed = z
    .object({
      id: z.uuid(),
      active: z.enum(["true", "false"]).transform((v) => v === "true"),
    })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await setMemberActive(parsed.data.id, parsed.data.active);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "更新に失敗しました");
  }
  revalidateAll();
  return OK;
}
