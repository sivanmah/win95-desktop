import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export function middleware(req: NextRequest) {
  const randomName = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "",
    style: "capital",
  });

  const res = NextResponse.next();

  const existingCookie = req.cookies.get("display-name");

  if (!existingCookie) {
    res.cookies.set("display-name", randomName, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const displayName = existingCookie?.value || randomName;
  res.headers.set("display-name", displayName);

  return res;
}

export const config = {
  matcher: "/",
};
