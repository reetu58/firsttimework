import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate brief endpoint
app.post("/api/generate-brief", async (req, res) => {
  try {
    const { topics } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({ error: "Topics are required" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error:
          "API key not configured on server. Contact the administrator.",
      });
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = `You are a senior fraud model governance expert and educator at a large US bank with deep expertise in:
- Model risk management (MRM) and regulatory compliance
- Fraud detection model oversight and validation
- SR 11-7, SR 21-8, BSA/AML, and FinCEN regulations
- AI/ML governance in financial services
- Emerging fraud threats and real-time payment systems
- Model performance monitoring and governance frameworks

Your role is to create engaging, educational daily briefings for fraud governance professionals. Each section should be technically sound, practical, and actionable for mid-level practitioners.`;

    const userPrompt = `Generate a comprehensive FMG Daily Brief for ${today}.

Focus on these 2-3 topics today:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return ONLY a valid JSON object (no markdown, no code blocks, pure JSON) with this exact structure:
{
  "theme": "A compelling 2-3 word focus theme for today",
  "concept": "300-word deep explanation of a core concept from today's topics, written for mid-level professionals. Include: definition, why it matters, how it applies at large banks.",
  "regulatory": "200-word spotlight on one regulatory requirement or recent development (reference real regulations like SR 11-7, SR 21-8, OCC guidance, etc.)",
  "threat": "200-word brief on one emerging or evolving fraud typology that governance teams must understand",
  "tip": "150-word actionable governance tip applicable to model documentation, validation, or oversight work",
  "quiz": [
    {
      "question": "Multiple choice question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "B",
      "explanation": "Explanation of why B is correct and why others are wrong"
    },
    {
      "question": "Question 2?",
      "options": ["A", "B", "C", "D"],
      "answer": "C",
      "explanation": "Explanation"
    },
    {
      "question": "Question 3?",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "Explanation"
    }
  ],
  "glossary": [
    {"term": "Term 1", "definition": "Definition"},
    {"term": "Term 2", "definition": "Definition"},
    {"term": "Term 3", "definition": "Definition"},
    {"term": "Term 4", "definition": "Definition"},
    {"term": "Term 5", "definition": "Definition"}
  ],
  "resources": [
    {"title": "Resource title", "description": "Brief description of relevance"},
    {"title": "Resource title", "description": "Brief description"},
    {"title": "Resource title", "description": "Brief description"}
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0].text;

    // Parse JSON
    let brief;
    try {
      brief = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        brief = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse API response as JSON");
      }
    }

    res.json(brief);
  } catch (error) {
    console.error("Error generating brief:", error);
    res.status(500).json({
      error: error.message || "Failed to generate brief",
    });
  }
});

// Catch-all for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`FMG Daily Brief server running on port ${port}`);
});
