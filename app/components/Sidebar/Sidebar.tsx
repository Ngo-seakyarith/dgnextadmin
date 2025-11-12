"use client";

import React, { useState } from "react";
import {
    BookOpen, Calendar, Users, Settings, Bell,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";

const sidebarItems = [
    {
        id: "courses",
        icon: BookOpen,
        label: "Courses",
        subItems: [
            { id: "add-course", label: "Add Course" },
            { id: "categories", label: "Categories" },
            { id: "payment", label: "Payment" },
        ],
    },
    {
        id: "students",
        icon: Users,
        label: "Students",
        subItems: [
            { id: "manage-student", label: "Manage Student" },
            { id: "student-enroll-recorded", label: "Student Enroll Recorded" },
        ],
    },
    {
        id: "events",
        icon: Calendar,
        label: "Events",
        subItems: [
            { id: "display-event-insight", label: "Display Event Insight" },
            { id: "add-event", label: "Add Event" },
        ],
    },
    {
        id: "notifications",
        icon: Bell,
        label: "Manage Notifications",
        subItems: [
            { id: "display-notification-insight", label: "Display Notification Insight" },
            { id: "add-push-notification", label: "Add Push Notification" },
        ],
    },
    {
        id: "settings",
        icon: Settings,
        label: "Settings",
        subItems: [{ id: "logout", label: "Logout" }],
    },
];

const Sidebar = ({ activeSection, setActiveSection }: { activeSection: string; setActiveSection: (section: string) => void }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    const toggleMenu = (id: string) => {
        setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className={`shadow-lg transition-all duration-300 bg-white ${isCollapsed ? "w-25" : "w-64"} h-screen flex flex-col`}>
            {/* Header with Toggle Button */}
            <div className="flex items-center justify-between p-3 border-b">
                
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-lg " style={{borderWidth:1, borderColor: "#b6b6b6"}}>
                    {isCollapsed ? <ChevronRight size={30} color="#2c3e50"/> : <ChevronLeft size={30} color="#2c3e50"/>}
                </button>
                {!isCollapsed && (
                    <h1 className="text-xl font-bold" style={{justifyContent: 'flex-center', color: "#2c3e50"}}>Menu</h1>
                )}
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto">
                {sidebarItems.map((item) => (
                    <div key={item.id}>
                        <div
                            className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                                activeSection === item.id ? "#fff" : "hover:bg-gray-100"
                            }`}
                            onClick={() => toggleMenu(item.id)}
                        >
                            <div className="flex items-center">
                                <item.icon size={20} />
                                {!isCollapsed && <span className="ml-3">{item.label}</span>}
                            </div>
                            {!isCollapsed && (
                                <button>
                                    {openMenus[item.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            )}
                        </div>

                        {/* Sub-items (Expandable) */}
                        {!isCollapsed && openMenus[item.id] && (
                            <div className="ml-6">
                                {item.subItems.map((subItem) => (
                                    <div
                                        key={subItem.id}
                                        className={`p-2 cursor-pointer transition-all ${
                                            activeSection === subItem.id ? "bg-white" : "hover:bg-gray-100"
                                        }`}
                                        onClick={() => setActiveSection(subItem.id)}
                                    >
                                        {subItem.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
