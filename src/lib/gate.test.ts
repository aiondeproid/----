import { describe, it, expect, beforeEach } from "vitest";

import {
  createGateToken,
  verifyGateToken,
  isValidPasscode,
  isGateConfigured,
  safeNextPath,
  GATE_MAX_AGE_SEC,
} from "./gate";

describe("セッション Cookie（createGateToken / verifyGateToken）", () => {
  beforeEach(() => {
    process.env.SITE_PASSCODE = "correct horse battery staple";
  });

  it("発行したトークンを検証できる", () => {
    const token = createGateToken();
    expect(token).not.toBeNull();
    expect(token!.maxAge).toBe(GATE_MAX_AGE_SEC);
    expect(verifyGateToken(token!.value)).toBe(true);
  });

  it("失効するとその後は無効", () => {
    const issuedAt = 1_700_000_000_000;
    const token = createGateToken(issuedAt)!;
    expect(verifyGateToken(token.value, issuedAt + 1000)).toBe(true);
    expect(
      verifyGateToken(token.value, issuedAt + (GATE_MAX_AGE_SEC + 1) * 1000),
    ).toBe(false);
  });

  it("署名を改ざんすると無効", () => {
    const token = createGateToken()!;
    const payload = token.value.split(".")[0];
    expect(verifyGateToken(`${payload}.deadbeef`)).toBe(false);
    expect(verifyGateToken(`${payload}.`)).toBe(false);
    expect(verifyGateToken(payload)).toBe(false);
  });

  it("失効時刻を改ざんすると署名不一致で無効", () => {
    const token = createGateToken()!;
    const sig = token.value.split(".")[1];
    const tamperedExp = Math.floor(Date.now() / 1000) + GATE_MAX_AGE_SEC + 99999;
    expect(verifyGateToken(`${tamperedExp}.${sig}`)).toBe(false);
  });

  it("SITE_PASSCODE を変更すると既存トークンは無効になる", () => {
    const token = createGateToken()!;
    process.env.SITE_PASSCODE = "another-passcode";
    expect(verifyGateToken(token.value)).toBe(false);
  });

  it("空・null のトークンは無効", () => {
    expect(verifyGateToken(undefined)).toBe(false);
    expect(verifyGateToken(null)).toBe(false);
    expect(verifyGateToken("")).toBe(false);
  });

  it("SITE_PASSCODE 未設定ならトークンは発行も検証もできない", () => {
    delete process.env.SITE_PASSCODE;
    expect(createGateToken()).toBeNull();
    expect(verifyGateToken("1700000000.abcdef")).toBe(false);
    expect(isGateConfigured()).toBe(false);
  });
});

describe("isValidPasscode（定数時間比較）", () => {
  beforeEach(() => {
    process.env.SITE_PASSCODE = "s3cr3t-pass";
  });

  it("完全一致のみ true", () => {
    expect(isValidPasscode("s3cr3t-pass")).toBe(true);
    expect(isValidPasscode("s3cr3t-pas")).toBe(false);
    expect(isValidPasscode("s3cr3t-pass ")).toBe(false);
    expect(isValidPasscode("")).toBe(false);
  });

  it("未設定なら常に false", () => {
    delete process.env.SITE_PASSCODE;
    expect(isValidPasscode("s3cr3t-pass")).toBe(false);
  });
});

describe("safeNextPath（オープンリダイレクト防止）", () => {
  it("ローカル絶対パスは許可", () => {
    expect(safeNextPath("/list")).toBe("/list");
    expect(safeNextPath("/list?from=2026-09-01&name=%E5%B1%B1%E7%94%B0")).toBe(
      "/list?from=2026-09-01&name=%E5%B1%B1%E7%94%B0",
    );
  });

  it("外部 URL・プロトコル相対・非パスは null", () => {
    expect(safeNextPath("//evil.example.com")).toBeNull();
    expect(safeNextPath("/\\evil.example.com")).toBeNull();
    expect(safeNextPath("https://evil.example.com")).toBeNull();
    expect(safeNextPath("list")).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(123)).toBeNull();
  });
});
