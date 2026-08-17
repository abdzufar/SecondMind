import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getElaboratePrompt } from "@/lib/aiPrompt";
import { validateEdges } from "@/lib/validateEdges";
import { ElaborateMindmapSchema } from "@/lib/validations";

export const maxDuration = 60; // Avoid Vercel timeout limits

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const parsed = ElaborateMindmapSchema.safeParse(body);
		
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}
		
		const { concept, action, language, nodeId } = parsed.data;

		const genAI = new GoogleGenerativeAI(
			process.env.GEMINI_API_KEY || "fake-api-key",
		);
		const model = genAI.getGenerativeModel({ model: "gemini-3.7-flash" });

		const prompt = getElaboratePrompt(concept, action, language, nodeId);

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();

		// Strip markdown code blocks if Gemini returns them
		const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
		const parsedData = JSON.parse(cleanJson);

		const newNodes = parsedData.newNodes || [];
		const newEdges = parsedData.newEdges || [];

		// We need to validate that the new edges only point to the new branches or the source node
		// To do this simply, we pretend the source node exists in the valid pool
		const pool = [{ id: nodeId }, ...newNodes];
		const validEdges = validateEdges(pool, newEdges);

		// Return the branches to the frontend (frontend will handle saving the map)
		return NextResponse.json(
			{
				newNodes,
				newEdges: validEdges,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		console.error("[ELABORATE_ERROR]:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
