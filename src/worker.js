export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    // === helloGPT ===
    if (pathname === "/helloGPT") {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Say hi" }],
        }),
      });
      const data = await openaiRes.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    //=== hello Gemini ====
    if (pathname === "/helloGemini") {
      const geminiRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Say hi",
                  },
                ],
              },
            ],
          }),
        }
      );
    
      const data = await geminiRes.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }


    // === generate-itinerary ===
    if (pathname === "/generate-itinerary" && request.method === "POST") {
      try {
        const { destination, durationDays } = await request.json();
        if (!destination || !durationDays) {
          return new Response("Missing fields", { status: 400 });
        }

        const jobId = crypto.randomUUID();

        // 1) CREATE document initially
        await createDoc(env, jobId, {
          status: "processing",
          destination,
          durationDays,
          createdAt: new Date(),
          completedAt: null,
          itinerary: [],
          error: null,
        });

        // 2) In background, generate and PATCH
        ctx.waitUntil(generateAndPatch(env, jobId, destination, durationDays));

        return new Response(JSON.stringify({ jobId }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function generateAndPatch(env, jobId, destination, durationDays) {
  try {
    const systemPrompt = `
You are a travel itinerary planner.

Given a destination and number of days, generate a detailed day-by-day travel itinerary as a JSON object with the following structure:

{
  "status": "completed",
  "destination": "Paris, France",
  "durationDays": 3,
  "createdAt": "<timestamp>",
  "completedAt": "<timestamp>",
  "itinerary": [
    {
      "day": 1,
      "theme": "Theme of the day",
      "activities": [
        {
          "time": "Morning | Afternoon | Evening",
          "description": "Description of the activity",
          "location": "Location name"
        }
      ]
    }
  ],
  "error": null
}

Return **only** valid JSON. Do not include any commentary or markdown.
    `.trim();

    const userPrompt = `Destination: ${destination}\nDuration: ${durationDays} days`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: userPrompt }] }
          ]
        }),
      }
    );

    const result = await geminiResponse.json();
    const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = raw.replace(/^```(?:json)?\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await patchDoc(env, jobId, {
      status: "completed",
      completedAt: new Date(),
      itinerary: parsed.itinerary,
      error: null,
    });
  } catch (err) {
    console.error("Gemini generation error:", err);
    await patchDoc(env, jobId, {
      status: "failed",
      completedAt: new Date(),
      error: err.message,
    });
  }
}


// Create document via POST
async function createDoc(env, jobId, data) {
  const project = env.FIREBASE_PROJECT_ID;
  const token   = env.FIREBASE_ACCESS_TOKEN;
  const url =
    `https://firestore.googleapis.com/v1/projects/${project}` +
    `/databases/(default)/documents/itineraries?documentId=${jobId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ fields: serializeFields(data) }),
  });
  if (!res.ok) console.error("❌ createDoc failed:", await res.text());
}

// Update existing document via PATCH
async function patchDoc(env, jobId, data) {
  const project = env.FIREBASE_PROJECT_ID;
  const token   = env.FIREBASE_ACCESS_TOKEN;
  const url =
    `https://firestore.googleapis.com/v1/projects/${project}` +
    `/databases/(default)/documents/itineraries/${jobId}`;

  const res = await fetch(`${url}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ fields: serializeFields(data) }),
  });
  if (!res.ok) console.error("❌ patchDoc failed:", await res.text());
}

// Serialize top-level fields correctly
function serializeFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}


function toFirestoreValue(val) {
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() }; 
  } else if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  } else if (val !== null && typeof val === "object") {
    const m = {};
    for (const [k, v] of Object.entries(val)) {
      m[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields: m } };
  } else if (typeof val === "string") {
    return { stringValue: val };
  } else if (typeof val === "number") {
    return { integerValue: val.toString() };
  } else if (typeof val === "boolean") {
    return { booleanValue: val };
  } else {
    return { nullValue: null };
  }
}
