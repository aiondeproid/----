import { describe, it, expect } from "vitest";
import {
  resolveWorkDate,
  formatRowClock,
  formatWorkedDuration,
  workedMinutes,
  formatTotalDuration,
  weekdayJa,
  toDateTimeInput,
  dateTimeInputToIso,
  currentMonthRange,
  isWorkDateString,
} from "./time";

describe("resolveWorkDate（勤務日の自動判定 / 4:00 境界）", () => {
  it("4:00 以降の出勤はその暦日", () => {
    expect(resolveWorkDate("2026-09-04T04:00:00+09:00")).toBe("2026-09-04");
    expect(resolveWorkDate("2026-09-04T04:30:00+09:00")).toBe("2026-09-04");
    expect(resolveWorkDate("2026-09-04T09:00:00+09:00")).toBe("2026-09-04");
  });

  it("3:59 以前（深夜）の出勤は前日", () => {
    expect(resolveWorkDate("2026-09-04T03:59:00+09:00")).toBe("2026-09-03");
    expect(resolveWorkDate("2026-09-04T03:30:00+09:00")).toBe("2026-09-03");
    expect(resolveWorkDate("2026-09-04T01:30:00+09:00")).toBe("2026-09-03");
    expect(resolveWorkDate("2026-09-04T00:00:00+09:00")).toBe("2026-09-03");
  });

  it("仕様書の例", () => {
    // 9/3 22:00 出勤 〜 9/4 06:00 退勤 → 勤務日 9/3
    expect(resolveWorkDate("2026-09-03T22:00:00+09:00")).toBe("2026-09-03");
    // 9/4 01:30 出勤 → 勤務日 9/3
    expect(resolveWorkDate("2026-09-04T01:30:00+09:00")).toBe("2026-09-03");
  });

  it("月をまたぐ深夜出勤は前月末日", () => {
    expect(resolveWorkDate("2026-10-01T02:00:00+09:00")).toBe("2026-09-30");
  });

  it("入力が UTC の ISO 文字列でも JST 基準で判定する", () => {
    // 2026-09-03T16:30:00Z == 2026-09-04 01:30 JST → 前日 9/3
    expect(resolveWorkDate("2026-09-03T16:30:00.000Z")).toBe("2026-09-03");
  });
});

describe("formatRowClock（勤務日 0:00 起点の 24 時間超え表記）", () => {
  it("同日内は通常の HH:MM", () => {
    expect(formatRowClock("2026-09-04T09:05:00+09:00", "2026-09-04")).toBe("09:05");
    expect(formatRowClock("2026-09-04T18:00:00+09:00", "2026-09-04")).toBe("18:00");
  });

  it("勤務日を起点に翌日へまたぐと 24:00 以上", () => {
    // 勤務日 9/3、出勤 22:00
    expect(formatRowClock("2026-09-03T22:00:00+09:00", "2026-09-03")).toBe("22:00");
    // 勤務日 9/3、退勤（実際は 9/4 04:00）→ 28:00
    expect(formatRowClock("2026-09-04T04:00:00+09:00", "2026-09-03")).toBe("28:00");
    // 勤務日 9/3、深夜 01:30 出勤 → 25:30
    expect(formatRowClock("2026-09-04T01:30:00+09:00", "2026-09-03")).toBe("25:30");
  });

  it("勤務日ちょうど 0:00 は 00:00", () => {
    expect(formatRowClock("2026-09-03T00:00:00+09:00", "2026-09-03")).toBe("00:00");
  });
});

describe("formatWorkedDuration / workedMinutes（実働時間）", () => {
  it("日をまたぐ実働を H:MM で返す", () => {
    // 22:00 〜 翌 04:00 = 6:00
    expect(
      formatWorkedDuration(
        "2026-09-03T22:00:00+09:00",
        "2026-09-04T04:00:00+09:00",
      ),
    ).toBe("6:00");
  });

  it("端数の分も保持する（丸めなし）", () => {
    expect(
      formatWorkedDuration(
        "2026-09-04T09:00:00+09:00",
        "2026-09-04T17:37:00+09:00",
      ),
    ).toBe("8:37");
  });

  it("退勤未入力は --:--", () => {
    expect(formatWorkedDuration("2026-09-04T09:00:00+09:00", null)).toBe("--:--");
    expect(formatWorkedDuration("2026-09-04T09:00:00+09:00", undefined)).toBe(
      "--:--",
    );
    expect(workedMinutes("2026-09-04T09:00:00+09:00", null)).toBeNull();
  });

  it("workedMinutes は分数を返す", () => {
    expect(
      workedMinutes("2026-09-03T22:00:00+09:00", "2026-09-04T04:00:00+09:00"),
    ).toBe(360);
  });
});

describe("formatTotalDuration（合計 / 24 時間超えも桁数制限なし）", () => {
  it("24 時間未満", () => {
    expect(formatTotalDuration(90)).toBe("1:30");
    expect(formatTotalDuration(0)).toBe("0:00");
  });

  it("24 時間以上でもそのまま表示", () => {
    expect(formatTotalDuration(1500)).toBe("25:00");
    expect(formatTotalDuration(60 * 132 + 5)).toBe("132:05");
  });
});

describe("weekdayJa", () => {
  it("勤務日の曜日を日本語 1 文字で返す", () => {
    expect(weekdayJa("2026-09-03")).toBe("木");
    expect(weekdayJa("2026-09-06")).toBe("日");
    expect(weekdayJa("2026-09-07")).toBe("月");
  });
});

describe("入力値の変換", () => {
  it("dateTimeInputToIso は JST のウォールクロックを絶対時刻にする", () => {
    expect(dateTimeInputToIso("2026-09-04", "01:30")).toBe(
      "2026-09-03T16:30:00.000Z",
    );
  });

  it("toDateTimeInput は絶対時刻を JST の日付 + 時刻に分解する", () => {
    expect(toDateTimeInput("2026-09-03T16:30:00.000Z")).toEqual({
      date: "2026-09-04",
      time: "01:30",
    });
  });

  it("往復して一致する", () => {
    const iso = dateTimeInputToIso("2026-12-31", "23:45")!;
    expect(toDateTimeInput(iso)).toEqual({ date: "2026-12-31", time: "23:45" });
  });

  it("不正な入力は null", () => {
    expect(dateTimeInputToIso("2026-09-04", "99:99")).toBeNull();
    expect(dateTimeInputToIso("not-a-date", "10:00")).toBeNull();
  });
});

describe("currentMonthRange", () => {
  it("参照日の当月 1 日〜末日を返す", () => {
    expect(currentMonthRange("2026-09-15T10:00:00+09:00")).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(currentMonthRange("2026-02-10T10:00:00+09:00")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});

describe("isWorkDateString", () => {
  it("YYYY-MM-DD のみ受け付ける", () => {
    expect(isWorkDateString("2026-09-03")).toBe(true);
    expect(isWorkDateString("2026-9-3")).toBe(false);
    expect(isWorkDateString("2026-13-01")).toBe(false);
    expect(isWorkDateString("foo")).toBe(false);
  });
});
