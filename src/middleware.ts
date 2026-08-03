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

  const existingName = req.cookies.get("display-name");
  const displayName = existingName?.value || randomName;

  // Has to go on the *request* headers. Setting it on the response instead means
  // headers() in page.tsx never sees it, and every visitor renders as "Anonymous".
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("display-name", displayName);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (!existingName) {
    res.cookies.set("display-name", randomName, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}

export const config = {
  matcher: "/",
};
