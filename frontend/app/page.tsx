import Chat from "@/components/chat/chat";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-between px-4 sm:px-24">
      <div className="w-full max-w-[900px] flex flex-col gap-2">
        <Image
          src="/avatars/me.png"
          alt="Avatar Logo"
          width={200}
          height={200}
          className="mx-auto"
          priority={true}
        />
        <p className="text-[16px] text-center font-medium">
          Hi, you are chatting with the AI Representative for Connor Haines!
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
        </div>
        <div className="flex justify-center w-full">
          <Chat />
        </div>
      </div>
    </main>
  );
}
