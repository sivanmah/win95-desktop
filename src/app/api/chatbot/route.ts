import { NextResponse } from "next/server";
import OpenAI from "openai";

// Built on first request, not at import. The constructor throws when the key is
// missing, and `next build` imports every route module -- so doing this at module
// scope fails the whole build on any machine without OPENAI_API_KEY set.
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function POST(request: Request) {
  const { messages } = await request.json();

  try {
    const chatCompletion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    return NextResponse.json({ reply: chatCompletion.choices[0].message });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(error.status, error.message, error.code, error.type);
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    } else {
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}
