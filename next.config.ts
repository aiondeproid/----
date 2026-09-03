import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs は Node ネイティブ寄りの大きな CJS パッケージなのでバンドルせず
  // サーバーの node_modules から require させる（Excel 書き出しの Route Handler で使用）。
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
