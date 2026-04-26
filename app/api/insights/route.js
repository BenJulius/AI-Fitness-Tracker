import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { workouts } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Check your .env.local key" }, { status: 500 });
    }

    if (!workouts || workouts.length === 0) {
      return NextResponse.json({ 
        choices: [{ message: { content: "Log some sets first so I can analyze your volume!" } }] 
      });
    }

    // Format data for the prompt
    const history = workouts.map(w => `${w.exercise}: ${w.weight}lbs x ${w.reps}`).join(", ");

    const prompt = `You are a world-class powerlifting coach. Analyze this workout: ${history}. Provide 3 short, brutal, actionable tips. Max 50 words. No markdown, no bolding, just plain text.`;

    // 2026 Stable Endpoint for Gemini 3 Flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GOOGLE_API_ERROR:", JSON.stringify(data));
      throw new Error(data.error?.message || "API Rejected Request");
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Panda is recharging. Try again.";

    return NextResponse.json({
      choices: [{ message: { content: aiText } }]
    });

  } catch (error) {
    console.error("FINAL_DEBUG:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}