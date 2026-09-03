/**
 * CSV の文字コード判定（UTF-8 / Shift_JIS）とパース。
 * Excel が出力する Shift_JIS の CSV をそのまま取り込めるようにする。
 * papaparse・encoding-japanese はブラウザでも動くため server-only にはしない。
 */
import Encoding from "encoding-japanese";
import Papa from "papaparse";

import { rowsFromMatrix, type RawImportRow } from "./members-import";

/** バイト列を文字コード自動判定でデコードして文字列にする。 */
export function decodeCsvBytes(bytes: Uint8Array): {
  text: string;
  encoding: string;
} {
  const detected = Encoding.detect(bytes);
  const from = (detected || "UTF8") as Parameters<
    typeof Encoding.convert
  >[1]["from"];
  let text = Encoding.convert(bytes, {
    to: "UNICODE",
    from,
    type: "string",
  }) as string;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM を除去
  return { text, encoding: detected || "UTF8" };
}

/** CSV バイト列を二次元配列にする。 */
export function parseCsvToMatrix(bytes: Uint8Array): string[][] {
  const { text } = decodeCsvBytes(bytes);
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  return (parsed.data as string[][]).map((row) =>
    row.map((cell) => String(cell ?? "")),
  );
}

/** CSV バイト列から取り込み対象行を抽出する。 */
export function csvRowsFromBytes(bytes: Uint8Array): RawImportRow[] {
  return rowsFromMatrix(parseCsvToMatrix(bytes));
}
