export async function POST(request) {
  const { messages, context } = await request.json()
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_KEY) {
    return Response.json({ reply: "API Key fehlt! Geh in Vercel Settings und fuege ANTHROPIC_API_KEY hinzu." })
  }

  const MODELS = ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-sonnet-20240229"]
  const systemPrompt = `Du bist Alpha – der Kumpel der alles ueber den Laden weiss. ALFACARS Berlin, Reifen & Felgen. Rede locker, direkt, wie ein echter Berliner Kollege. Keine Listen, keine Bullet Points. Normale Saetze. Duze den Chef. Kurz und knackig. Denk proaktiv mit.\n\nDATEN:\n${context || "Keine Daten"}`

  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages || [{ role: "user", content: "Hallo" }]
        })
      })
      const data = await res.json()
      if (data.content && data.content[0] && data.content[0].text) {
        return Response.json({ reply: data.content[0].text })
      }
      if (data.error) {
        console.error("Model " + model + " error:", JSON.stringify(data.error))
        continue
      }
    } catch (e) {
      console.error("Model " + model + " failed:", e.message)
      continue
    }
  }
  return Response.json({ reply: "Alpha konnte nicht antworten. Pruefe den API Key in Vercel Settings." })
}
