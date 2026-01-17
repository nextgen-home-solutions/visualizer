import { NextResponse } from "next/server";
import catalog from "../../../data/products.json";

export async function GET() {
  return NextResponse.json(catalog, { status: 200 });
}
