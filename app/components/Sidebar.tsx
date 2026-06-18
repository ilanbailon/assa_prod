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
    { id: "personal", label: "Personal Activo", icon: "group" },
    { id: "requirements", label: "Requerimientos", icon: "assignment_ind" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[45] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 h-screen fixed left-0 top-0 bg-nordic border-r border-nordic/20 flex flex-col py-6 z-50 text-clear-day transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 mb-10 flex items-center justify-between">
          <div>
            <h1 className="font-sf-pro text-2xl font-bold tracking-tight text-hint-of-green">
              Control ASSA
            </h1>
            <p className="text-xs text-clear-day/75 mt-0.5">
              Gestión de Personal
            </p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden text-clear-day/80 hover:text-hint-of-green transition-colors outline-none cursor-pointer"
          >
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center px-6 py-3.5 font-sf-pro text-sm font-semibold transition-all duration-200 outline-none text-left cursor-pointer ${
                  isActive
                    ? "bg-hint-of-green text-nordic border-r-4 border-mosque font-bold shadow-md shadow-nordic/20"
                    : "text-clear-day/80 hover:bg-mosque/20 hover:text-hint-of-green"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                    isActive ? "scale-110 text-nordic" : "text-clear-day/70"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-6 space-y-1 border-t border-clear-day/10 pt-6">
          <a
            className="flex items-center py-2.5 font-sf-pro text-sm font-semibold text-clear-day/70 hover:text-hint-of-green transition-colors"
            href="#"
          >
            <Icon name="settings" className="mr-3 h-5 w-5 text-clear-day/70" />
            <span>Configuración</span>
          </a>
          <a
            className="flex items-center py-2.5 font-sf-pro text-sm font-semibold text-clear-day/70 hover:text-hint-of-green transition-colors"
            href="#"
          >
            <Icon name="help" className="mr-3 h-5 w-5 text-clear-day/70" />
            <span>Ayuda y Soporte</span>
          </a>
        </div>
      </aside>
    </>
  );
}
