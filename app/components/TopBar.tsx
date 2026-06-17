"use client";

import React from "react";
import Icon from "./Icon";

interface TopBarProps {
  onMenuToggle: () => void;
  onAddClick: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function TopBar({
  onMenuToggle,
  onAddClick,
  searchQuery,
  setSearchQuery,
}: TopBarProps) {
  return (
    <header className="flex justify-between items-center h-16 ml-0 md:ml-64 px-4 md:px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-nordic/10 transition-all duration-300">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-nordic hover:bg-clear-day active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Icon name="lan" className="h-5 w-5 text-mosque hidden sm:inline" />
          <h2 className="font-sf-pro text-sm md:text-base font-bold text-nordic">
            Proyecto ASSA &mdash; Producción
          </h2>
        </div>
      </div>

      {/* Right side: Search, Button, Notifications, Avatar */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Search Input (Hidden on extra small screens) */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Buscar requerimientos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-clear-day border border-nordic/10 px-4 py-1.5 pl-10 rounded-lg text-xs md:text-sm text-nordic focus:ring-2 focus:ring-mosque/40 outline-none w-48 md:w-64 transition-all placeholder:text-nordic/40 font-semibold"
          />
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-nordic/50 h-4 w-4"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nordic/50 hover:text-nordic cursor-pointer outline-none"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onAddClick}
          className="bg-mosque text-clear-day px-3 md:px-4 py-2 text-xs md:text-sm font-bold rounded shadow-sm hover:bg-mosque/90 active:scale-95 transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer outline-none"
        >
          <Icon name="add" className="h-4 w-4 text-clear-day" />
          <span>Nuevo Requerimiento</span>
        </button>

        {/* Notifications & Profile (Lined separator) */}
        <div className="flex items-center gap-2 md:gap-4 border-l border-nordic/10 pl-3 md:pl-6">
          <button className="text-nordic/60 hover:text-mosque hover:scale-105 active:scale-95 transition-all relative cursor-pointer outline-none flex items-center justify-center p-1 rounded-full">
            <Icon name="notifications" className="h-6 w-6" />
            {/* Status dot */}
            <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-hint-of-green text-nordic font-bold text-xs flex items-center justify-center border border-mosque/20 shadow-sm select-none">
              PM
            </div>
            <span className="hidden lg:block text-xs font-bold text-nordic">
              Pedro M.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
