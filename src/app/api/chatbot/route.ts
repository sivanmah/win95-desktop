import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  try {
    const chatCompletion = await openai.chat.completions.create({
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
