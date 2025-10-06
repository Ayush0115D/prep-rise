import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("session", "", { maxAge: 0 });
  return response;
}

export async function GET() {
  return NextResponse.json({ message: "Logout works!" });
}