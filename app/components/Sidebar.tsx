"use client";

import React from "react";
import Icon from "./Icon";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "personal", label: "Personal", icon: "group" },
    { id: "materials", label: "Requerimiento de Materiales", icon: "widgets" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-nordic/40 backdrop-blur-xs z-[45] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 h-screen fixed left-0 top-0 bg-nordic border-r border-nordic/20 flex flex-col py-4 z-50 text-clear-day transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-sf-pro text-xl font-bold tracking-tight text-hint-of-green">
              Control ASSA
            </h1>
            <p className="text-[10px] text-clear-day/70 mt-0.5 font-semibold">
              Gestión de Personal & Producción
            </p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden text-clear-day/80 hover:text-hint-of-green transition-colors outline-none cursor-pointer"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center px-5 py-2.5 font-sf-pro text-xs font-semibold transition-all outline-none text-left cursor-pointer ${
                  isActive
                    ? "bg-mosque text-clear-day font-bold border-l-4 border-hint-of-green"
                    : "text-clear-day/80 hover:bg-mosque/30 hover:text-hint-of-green"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`mr-2.5 h-4.5 w-4.5 ${
                    isActive ? "text-hint-of-green" : "text-clear-day/60"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
