import path from "node:path";

export function dataDir() {
  return process.env.WB_DATA_DIR || path.join(process.cwd(), "data");
}
