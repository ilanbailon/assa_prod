"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Icon from "./Icon";

interface TopBarProps {
  onMenuToggle: () => void;
  onAddClick: () => void;
  searchQuery: string;
  isSidebarCollapsed?: boolean;
  showAddButton?: boolean;
}

export default function TopBar({
  onMenuToggle,
  onAddClick,
  searchQuery,
  isSidebarCollapsed = false,
  showAddButton = true,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search state with prop when it changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced URL update
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (localSearch !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (localSearch.trim()) {
          params.set("search", localSearch.trim());
        } else {
          params.delete("search");
        }
        params.delete("page"); // Reset page to 1 on new search
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [localSearch, searchQuery, router, pathname, searchParams]);

  const handleClear = () => {
    setLocalSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className={`flex justify-between items-center h-12 ml-0 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} px-4 md:px-6 sticky top-0 z-40 bg-white border-b border-slate-200 transition-all duration-300`}>
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1 rounded hover:bg-slate-100 active:scale-95 transition-all outline-none cursor-pointer text-slate-700"
          title="Menú lateral"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <Icon name="lan" className="h-4.5 w-4.5 text-mosque hidden sm:inline" />
          <h2 className="font-sf-pro text-xs md:text-sm font-bold text-slate-800">
            Proyecto ASSA &mdash; Producción
          </h2>
        </div>
      </div>

      {/* Right side: Search, Button, Notifications, Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Buscar requerimientos..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1 pl-8 rounded text-xs text-slate-800 focus:ring-1 focus:ring-mosque/40 outline-none w-48 md:w-56 transition-all placeholder:text-slate-400 font-semibold"
          />
          <Icon
            name="search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5"
          />
          {localSearch && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer outline-none"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Button */}
        {showAddButton && (
          <button
            onClick={onAddClick}
            className="bg-mosque text-clear-day px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded hover:bg-mosque/90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer outline-none"
            title="Nuevo Requerimiento"
          >
            <Icon name="add" className="h-4 w-4 text-clear-day" />
            <span className="hidden sm:inline">Nuevo Requerimiento</span>
            <span className="inline sm:hidden">Nuevo</span>
          </button>
        )}
      </div>
    </header>
  );
}


