import React from "react";
import { Bell, User, Settings } from "lucide-react";
import Image from "next/image";
import Dglogo from "@/assets/png/dglogo.png";  // Assuming you have a logo image for the header

const Header = () => {
    return (
        <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center space-x-4">
                <Image src={Dglogo} alt="Logo" width={40} height={40} />
                <h1 className="text-xl font-bold">Dashboard</h1>
            </div>

            {/* Right Section - Notifications, Profile, and Settings */}
            <div className="flex items-center space-x-6">
                {/* Notifications Icon */}
                <div className="relative">
                    <Bell size={20} />
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        3
                    </div>
                </div>
                
                {/* Profile Icon */}
                <div className="relative">
                    <User size={20} />
                </div>

                {/* Settings Icon */}
                <div className="relative">
                    <Settings size={20} />
                </div>
            </div>
        </div>
    );
};

export default Header;
