import { NextResponse } from "next/server";
import OpenAI from "openai";

// Overridable so swapping models is an env edit rather than a code change --
// useful when a project key has access to one model but not another.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

// Built on first request, not at import. The constructor throws when the key is
// missing, and `next build` imports every route module -- so doing this at module
// scope fails the whole build on any machine without OPENAI_API_KEY set.
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function POST(request: Request) {
  let messages: unknown;
  try {
    ({ messages } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: "`messages` must be an array" },
      { status: 400 },
    );
  }

  try {
    const chatCompletion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages,
    });

    // The SDK types content as `string | null` -- a refusal or a tool call has no
    // text. Resolve it here rather than sending the raw message, which the client
    // types as a plain string and would render as an empty "Bot:" line.
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: `${MODEL} returned an empty reply` },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply: { role: "assistant", content } });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(error.status, error.message, error.code, error.type);
      // `status` is undefined on connection, timeout and abort errors, and
      // NextResponse reads undefined as 200 -- which tells the client the failure
      // was a reply, so it stores nothing and crashes on the next render.
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    } else {
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 },
      );
    }
  }
}
