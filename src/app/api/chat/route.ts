import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Define interface for chat message
interface ChatMessage {
  role: string;
  parts: string;
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create the system prompt with context
    const systemPrompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.`;

    // Format chat history for Gemini
    const chatHistory: ChatMessage[] = messages
      .filter((message: Message) => message.role === "user")
      .map((message: Message) => ({
        role: message.role,
        parts: message.content,
      }));

    // Generate response
    const result = await model.generateContent([
      systemPrompt,
      ...chatHistory.map((msg: ChatMessage) => msg.parts),
      lastMessage.content,
    ]);

    const response = result.response;
    const aiResponse = response.text();
    // console.log('response=',response)
    console.log('airesponse=',response.candidates)

    // Save the user message to the database
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    // Save the AI response to the database
    await db.insert(_messages).values({
      chatId,
      content: aiResponse,
      role: "system",
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
