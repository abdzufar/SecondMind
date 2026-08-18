import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Mindmap from "@/models/Mindmap";
import Message from "@/models/Message";
import { ChatSchema } from "@/lib/validations";
import { getChatSystemPrompt } from "@/lib/aiPrompt";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const parsed = ChatSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0].message },
				{ status: 400 },
			);
		}

		const { mindmapId, message, nodeId } = parsed.data;

		await dbConnect();

		// 1. Verify ownership of the mindmap
		const mindmap = await Mindmap.findOne({
			_id: mindmapId,
			userId: session.user.id,
		});

		if (!mindmap) {
			return NextResponse.json(
				{ error: "Mindmap not found or unauthorized" },
				{ status: 404 },
			);
		}

		// 2. Find the target node context if provided
		let targetNode = null;
		if (nodeId) {
			targetNode = mindmap.nodes.find((n: any) => n.id === nodeId);
		}

		// 3. Save the incoming user message
		await Message.create({
			mindmapId,
			role: "user",
			content: message,
			...(nodeId ? { nodeId } : {}),
		});

		// 4. Fetch the last 6 messages (3 pairs) for short-term memory
		const history = await Message.find({ mindmapId })
			.sort({ createdAt: -1 })
			.limit(6);

		// Reverse it so it's in chronological order for the AI
		history.reverse();

		// 5. Format history for Gemini
		// Exclude the message we just saved because we will pass it as the new prompt
		const previousMessages = history.slice(0, -1); 
		const geminiHistory = previousMessages.map((msg) => ({
			role: msg.role === "assistant" ? "model" : "user",
			parts: [{ text: msg.content }],
		}));

		// 6. Initialize Gemini Model with System Instruction
		const genAI = new GoogleGenerativeAI(
			process.env.GEMINI_API_KEY || "fake-api-key",
		);
		const systemInstruction = getChatSystemPrompt(
			mindmap.topic,
			mindmap.nodes,
			targetNode,
		);

		const model = genAI.getGenerativeModel({
			model: "gemini-3.5-flash-lite",
			systemInstruction,
		});

		// 7. Start Chat and Send Message
		const chat = model.startChat({
			history: geminiHistory,
		});

		const result = await chat.sendMessage(message);
		const responseText = result.response.text();

		// 8. Save AI Response
		await Message.create({
			mindmapId,
			role: "assistant",
			content: responseText,
			...(nodeId ? { nodeId } : {}),
		});

		// Return a single JSON block as requested by the frontend partner
		return NextResponse.json(
			{
				message: responseText,
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		console.error("[CHAT_ERROR]:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
