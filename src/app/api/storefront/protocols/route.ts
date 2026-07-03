import { NextResponse } from "next/server";
import { authenticateStorefront } from "@/lib/storefront/auth";
import { getPublishedProtocols } from "@/lib/storefront/read";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await authenticateStorefront(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getPublishedProtocols());
}
