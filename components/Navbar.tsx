"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onNewProject?: () => void;
}

export default function Navbar({ onNewProject }: NavbarProps) {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isProjects = pathname.startsWith("/projects");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white shadow-lg">
            P
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent">
              ProjectPilot AI
            </h1>
            <p className="text-xs text-gray-500">
              Intelligent Project Management
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isDashboard
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isProjects
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Projects
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden xl:flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <input
              type="text"
              placeholder="Search projects..."
              disabled
              className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Button */}
          {onNewProject && (
            <button
              onClick={onNewProject}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              + New Project
            </button>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-semibold text-white">
                D
              </div>

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>

            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800">
                Demo User
              </p>
              <p className="text-xs text-gray-500">
                AI Workspace
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}