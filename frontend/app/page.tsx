"use client";

import Chat from "@/components/chat/chat";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex h-screen flex-col items-center justify-between px-3 sm:px-24">
      <Button
        variant="outline"
        className="absolute top-4 left-4 flex items-center px-3 py-1"
        asChild
      >
        <SignOutButton> Logout </SignOutButton>
      </Button>

      <div className="w-full max-w-[900px] flex flex-col gap-2">
        <Image
          src={"/avatars/me.png"}
          alt="Avatar Logo"
          width={200}
          height={200}
          className="mx-auto w-[80px] h-[80px] sm:w-[200px] sm:h-[200px]"
          priority={true}
        />
        <p className="text-[16px] text-center font-medium">
          Hi, you're chatting with AI Connor! I answer professional questions
          about Connor Haines.
        </p>
        <div className="flex justify-center gap-2 mt-2">
          <a
            href="https://linkedin.com/in/connorhaines"
            target="_blank"
            className="items-center"
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-6" />
          </a>
          <a
            href="https://github.com/coding-connor"
            target="_blank"
            className="items-center"
          >
            <FontAwesomeIcon icon={faGithub} className="h-6" />
          </a>
          <a
            href="https://calendly.com/connor-haines"
            target="_blank"
            className="items-center"
          >
            <FontAwesomeIcon icon={faCalendar} className="h-6" />
          </a>
        </div>
        <Chat />
      </div>
    </main>
  );
}
