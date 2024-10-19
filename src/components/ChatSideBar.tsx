import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSideBar = ({ chats, chatId }: Props) => {
  return (
    <div className="soff flex h-screen w-full flex-col bg-gray-900 p-4 text-gray-200">
      <Link href="/">
        <Button className="w-full border border-dashed border-white">
          <PlusCircle className="mr-2 h-4 w-4">New Chat</PlusCircle>
        </Button>
      </Link>

      <div className="mt-4 flex-1 gap-2 overflow-y-auto pb-20">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div
              className={cn("flex items-center rounded-lg p-3 text-slate-300", {
                "bg-blue-600 text-white": chat.id === chatId,
                "hover:text-white": chat.id !== chatId,
              })}
            >
              <MessageCircle className="mr-2" />
              <p className="w-full overflow-hidden truncate text-ellipsis whitespace-nowrap text-sm">
                {chat.pdfName}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/">Home</Link>
          <Link href="/">Source</Link>
        </div>
      </div>
    </div>
  );
};

export default ChatSideBar;
