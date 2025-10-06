"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Hide button on sign-in page
  if (pathname === "/sign-in") return null;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true); // show message
      const response = await fetch("/api/logout", { method: "POST" });
      if (response.ok) {
        router.push("/sign-in");
      } else {
        setIsLoggingOut(false);
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="header">
      <div className="header-right flex items-center gap-2">
        <button
          onClick={handleLogout}
          type="button"
          className="logout-button flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-lg transition"
          disabled={isLoggingOut}
        >
          <LogOut className="logout-icon" />
          <span className="logout-text">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}
