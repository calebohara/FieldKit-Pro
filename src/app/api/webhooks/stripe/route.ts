// Stripe webhook handler — placeholder for future integration (v1.1)
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Stripe webhook not yet configured" },
    { status: 501 }
  );
}
