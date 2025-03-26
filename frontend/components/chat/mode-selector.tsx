"use client";

import {
  faComments,
  faMagnifyingGlass,
  faMagnifyingGlassDollar,
  faChevronDown,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatMode {
  name: string;
  path: string;
  icon: typeof faMagnifyingGlass;
  isNew?: boolean;
  description?: string;
}

const CHAT_MODES: ChatMode[] = [
  {
    name: "Chat",
    path: "/",
    icon: faComments,
    description: "Chat with AI Connor about his professional experience",
  },
  {
    name: "Deep Research",
    path: "/deep-research",
    icon: faMagnifyingGlass,
    isNew: true,
    description: "Use AI to research and analyze any topic in depth",
  },
  {
    name: "Uniswap Research",
    path: "/uniswap-research",
    icon: faMagnifyingGlassDollar,
    isNew: true,
    description: "Deep dive into Uniswap protocol and ecosystem",
  },
];

interface ModeSelectorProps {
  onNewChat: () => void;
}

export function ModeSelector({ onNewChat }: ModeSelectorProps) {
  const pathname = usePathname();
  const currentMode =
    CHAT_MODES.find((mode) => mode.path === pathname) ?? CHAT_MODES[0];
  const otherModes = CHAT_MODES.filter((mode) => mode.path !== pathname);
  const [open, setOpen] = useState(false);

  const handleNewChat = () => {
    onNewChat();
    setOpen(false);
  };

  return (
    <div className="flex items-center">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {/* Mobile: Icon only */}
            <FontAwesomeIcon icon={currentMode.icon} className="h-4 w-4" />
            {/* Desktop: Show name and chevron */}
            <span className="hidden sm:inline max-w-[100px] truncate">
              {currentMode.name}
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="hidden sm:inline h-3 w-3 opacity-50"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {/* New Chat option at the top */}
          <DropdownMenuItem
            onClick={handleNewChat}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlusCircle} className="h-4 w-4" />
            <span>New Session</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Other chat modes */}
          {otherModes.map((mode) => (
            <DropdownMenuItem
              key={mode.path}
              asChild
              className="cursor-pointer"
            >
              <Link
                href={mode.path}
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
                title={mode.description}
              >
                <FontAwesomeIcon icon={mode.icon} className="h-4 w-4" />
                <span>{mode.name}</span>
                {mode.isNew && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">
                    NEW
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
