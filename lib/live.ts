import { connection } from "next/server";

export async function liveRequest() {
  await connection();
}
