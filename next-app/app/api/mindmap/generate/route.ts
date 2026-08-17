import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Mindmap from "@/models/Mindmap";
import { getGeneratePrompt } from "@/lib/aiPrompt";
import { validateEdges } from "@/lib/validateEdges";
// @ts-expect-error - pdf-parse has no default export in types
import pdfParse from "pdf-parse";

export const maxDuration = 60; // Avoid Vercel timeout limits

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await req.formData();
		const topic = formData.get("topic") as string;
		const timeframe = formData.get("timeframe") as string;
		const language = formData.get("language") as string;
		const verbosity = formData.get("verbosity") as string;
		const file = formData.get("file") as File | null;

		if (!topic || !timeframe || !language) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		let fileContext = "";
		if (file) {
			try {
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				
				if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
					const pdfData = await pdfParse(buffer);
					fileContext = pdfData.text;
				} else {
					fileContext = buffer.toString('utf-8');
				}
			} catch (e) {
				console.error("[FILE_PARSE_ERROR]:", e);
			}
		}

		const genAI = new GoogleGenerativeAI(
			process.env.GEMINI_API_KEY || "fake-api-key",
		);
		const model = genAI.getGenerativeModel({ model: "gemini-3.7-flash" });

		const prompt = getGeneratePrompt(topic, timeframe, language, verbosity, fileContext);

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
