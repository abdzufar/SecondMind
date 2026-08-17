import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Mindmap from "@/models/Mindmap";
import { getGeneratePrompt } from "@/lib/aiPrompt";
import { validateEdges } from "@/lib/validateEdges";

export const maxDuration = 60; // Avoid Vercel timeout limits

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession();
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await req.formData();
		const topic = formData.get("topic") as string;
		const timeframe = formData.get("timeframe") as string;
		const language = formData.get("language") as string;
		const verbosity = formData.get("verbosity") as string;

		if (!topic || !timeframe || !language) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const genAI = new GoogleGenerativeAI(
			process.env.GEMINI_API_KEY || "fake-api-key",
		);
		const model = genAI.getGenerativeModel({ model: "gemini-3.7-flash" });

		const prompt = getGeneratePrompt(topic, timeframe, language, verbosity);

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();

		// Strip markdown code blocks if Gemini returns them
		const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
		const parsedData = JSON.parse(cleanJson);

		const validNodes = parsedData.nodes || [];
		const validEdges = validateEdges(validNodes, parsedData.edges || []);

		// Connect to DB and Auto-Save
		await dbConnect();

		const newMindmap = new Mindmap({
			userId: session.user.id, // NextAuth ID injected via mock
			title: parsedData.title || `Learning ${topic}`,
			topic,
			timeframe,
			language,
			feasibilityWarning: parsedData.feasibilityWarning || null,
			nodes: validNodes,
			edges: validEdges,
		});

		await newMindmap.save();

		// Return the exact saved mongoose document, which includes the new _id
		return NextResponse.json(newMindmap, { status: 200 });
	} catch (error: unknown) {
		console.error("[GENERATE_ERROR]:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
