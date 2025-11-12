"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Users,
  Calendar,
  Settings,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  HelpCircle,
  DollarSign,
  Megaphone,
  Pen,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/config/firebase";
import { doc, getDoc, updateDoc, DocumentData } from "@firebase/firestore";
import Link from "next/link";

// Assuming these components are in the specified paths
import UploadCourseForm from "../Course/Uploadcourse";
import DashboardOverview from "./DashboardOverview";
import UploadCategories from "../Categories/UploadCategories";
import CourseList from "../Course/CourseList";
import AddPushNotification from "../Notification/AddPushNotification";
import ListNotification from "../Notification/ListNotification";
import SignOutModal from "@/app/components/ui/signoutmodal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import UploadEvent from "../Event/UploadEvent";
import ListEvent from "../Event/ListEvent";
import ListStudent from "../Student/ListStudent";
import ListStudentEnroll from "../Student/ListStudentEnroll";
import CreateBlogPost from "../BlogPost/UploadBlogPost";
import BlogPostsList from "../BlogPost/ListBlogPost";
import Image from "next/image";
import UploadTrainer from "../Trainer/UploadTrainer";
import ListTrainer from "../Trainer/TrainerList";
import DGLOGO from "@/app/assets/png/LOGO-DG-Next-havebackground.png"

// Helper Icons for AlertModal
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg   " fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg   " fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Animation variants for submenus
const submenuVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
};

// Data Interfaces
interface AdminData {
  username: string;
  email: string;
  role: string;
  profileImage: string;
}

interface ProfileAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminData: AdminData | null;
  onSave: (data: AdminData) => Promise<void>;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  isSuccess: boolean;
}

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subItems?: { id: string; label: string }[];
}

// MODAL COMPONENTS
const ProfileAdminModal = ({ isOpen, onClose, adminData, onSave }: ProfileAdminModalProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<AdminData>({
    username: adminData?.username || "",
    email: adminData?.email || "",
    role: adminData?.role || "admin",
    profileImage: adminData?.profileImage || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  useEffect(() => {
    if (adminData) {
      setFormData({
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        profileImage: adminData.profileImage,
      });
    }
  }, [adminData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#fff] dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <h2 className=" text-center mb-6 text-gray-800 dark:text-white" style={{ fontSize: 20, fontWeight: 700 }}>Admin Profile</h2>
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Username:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    style={{fontSize: 15}}
                    className="
                  w-full h-[40px] px-4
                  bg-white dark:bg-slate-800
                  border border-slate-300 dark:border-slate-600
                  rounded-[15px]
                  text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200 ease-in-out
                "
                  />
                ) : (
                  <p className="
                w-full min-h-[40px] px-4 py-2.5
                bg-slate-100 dark:bg-slate-800
                text-slate-900 dark:text-slate-100
                rounded-[15px]
              ">
                    {formData.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email:
                </label>
                <p className="
                  w-full min-h-[40px] px-4 py-2.5
                  bg-slate-100 dark:bg-slate-800
                  text-slate-900 dark:text-slate-100
                  rounded-[15px]
                ">
                  {formData.email}
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Role:
                </label>
                <p className="
                w-full min-h-[40px] px-4 py-2.5
                bg-slate-100 dark:bg-slate-800
                text-slate-900 dark:text-slate-100
                rounded-[15px]
              ">
                  {formData.role}
                </p>
              </div>
            </div>
            <div className="flex justify-center items-center space-x-4 mt-8">
              {isEditing ? (
                <>
                  <button
                    onClick={() => { setIsEditing(false); onClose(); }}
                    style={{borderRadius: 15, fontWeight: 400, fontSize: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40}}
                    className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{borderRadius: 15, fontWeight: 400, fontSize: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40}}
                    className="px-6 py-2 bg-[#F47834] text-white hover:bg-[#F0B13B] transition"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    style={{borderRadius: 15, fontWeight: 400, fontSize: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40}}
                    className="px-6 py-2 bg-gray-800 text-white hover:bg-gray-900 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{borderRadius: 15, fontWeight: 400, fontSize: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40}}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AlertModal = ({ isOpen, onClose, message, isSuccess }: AlertModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center"
          >
            <div className={`mx-auto flex items-center justify-center h-16 w-16 ${isSuccess ? 'bg-green-100' : 'bg-red-100'} mb-5`}>
              {isSuccess ? (
                <CheckIcon className="h-8 w-8 text-green-600" />
              ) : (
                <XIcon className="h-8 w-8 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{isSuccess ? "Success!" : "Operation Failed"}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// CORE UI COMPONENTS (HEADER & SIDEBAR)
const Header = ({ toggleSidebar, isCollapsed, onSignOut }: { toggleSidebar: () => void; isCollapsed: boolean; onSignOut: () => void }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const adminDocRef = doc(db, "adminInfo", auth.currentUser.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          setAdminData(adminDocSnap.data() as AdminData);
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      }
    };
    fetchAdminProfile();
  }, []);

  const saveAdminProfile = async (data: AdminData) => {
    if (!auth.currentUser) return;
    try {
      const adminDocRef = doc(db, "adminInfo", auth.currentUser.uid);
      await updateDoc(adminDocRef, data as Partial<AdminData> & DocumentData);
      setAdminData(data);
      setAlertMessage("Profile updated successfully!");
      setIsSuccess(true);
    } catch (error) {
      console.error("Error updating admin profile:", error);
      setAlertMessage("Failed to update profile.");
      setIsSuccess(false);
    }
    setIsAlertModalOpen(true);
    setIsProfileModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await onSignOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
      setIsSignOutModalOpen(false);
    }
  };

  return (
    <header style={{paddingLeft: 20, paddingRight: 20}} className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 text-black dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden">
          {isCollapsed ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            style={{fontSize: 15, borderRadius: 15}}
            className="pl-10 pr-4 py-2 w-72 bg-gray-100 dark:bg-gray-800 border-transparent focus:outline-none focus:ring-2 focus:ring-[#2c3e50] transition"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4 sm:space-x-6">
        <button className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors relative">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <span className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" style={{marginTop: -33, fontSize: 14, color: "#fff", textAlign: "center", alignItems: "center"}}>0</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none rounded-full">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {adminData?.profileImage ? (
                  <Image src={adminData.profileImage} alt="Admin" width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                )}
              </div>
              <div className="hidden md:block">
                <p className="font-semibold text-sm">{adminData?.username || "Admin"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{adminData?.role || "Administrator"}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-2" style={{borderRadius: 15}}>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#F87E38] hover:text-[#fff]" onClick={() => setIsProfileModalOpen(true)} style={{paddingLeft: 15, paddingRight: 15, borderRadius: 12}}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#F87E38] hover:text-[#fff]" style={{paddingLeft: 15, paddingRight: 15, borderRadius: 12}}>
              <Settings className="mr-2 h-4 w-4"/>
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="cursor-pointer text-[#FB4455] focus:text-[#FB4455] hover:bg-[#FB4455] hover:text-[#fff]" onClick={() => setIsSignOutModalOpen(true)} style={{paddingLeft: 15, paddingRight: 15, borderRadius: 12}}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileAdminModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        adminData={adminData}
        onSave={saveAdminProfile}
      />
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        message={alertMessage}
        isSuccess={isSuccess}
      />
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </header>
  );
};

const Sidebar = ({ activeSection, setActiveSection, isCollapsed }: { activeSection: string, setActiveSection: React.Dispatch<React.SetStateAction<string>>, isCollapsed: boolean, toggleSidebar: () => void }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({ "dashboard": true, "courses": true });
  const currentYear = new Date().getFullYear();

  const menuItems: MenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", subItems: [{ id: "overview", label: "Overview" }] },
    { id: "courses", icon: BookOpen, label: "Courses", subItems: [{ id: "course-list", label: "Course List" }, { id: "add-course", label: "Upload Course" }, { id: "add-course-categories", label: "Upload Course Categories" },] },
    { id: "trainers", icon: UserRound, label: "Trainers", subItems: [{ id: "list-trainers", label: "List Trainers" }, { id: "add-trainer", label: "Add Trainer" }] },
    { id: "certificates", icon: FileText, label: "Certificates", subItems: [{ id: "list-certificates", label: "List Certificates" }] },
    { id: "students", icon: Users, label: "Students", subItems: [{ id: "list-student", label: "List Students" }, { id: "student-enroll-recorded", label: "Enrollments" }] },
    { id: "blogposts", icon: Pen, label: "Blog Posts", subItems: [{ id: "add-blogpost", label: "Upload Post" }, { id: "list-blogpost", label: "List Posts" }] },
    { id: "events", icon: Calendar, label: "Events", subItems: [{ id: "list-events", label: "List Events" }, { id: "add-event", label: "Add Event" }] },
    { id: "notifications", icon: Bell, label: "Notifications", subItems: [{ id: "list-notification", label: "List Notifications" }, { id: "add-push-notification", label: "Add Push Notification" }] },
    { id: "marketing", icon: Megaphone, label: "Marketing", subItems: [{ id: "discounts", label: "Discounts" }] },
    { id: "payment", icon: DollarSign, label: "Payments", subItems: [{ id: "course-sales", label: "Course Sales" }] },
    { id: "support", icon: HelpCircle, label: "Support", subItems: [{ id: "support-tickets", label: "Tickets" }] },
  ];

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className={`h-full bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      <div className="flex items-center justify-between dark:border-gray-800 px-4 bg-[#2c3e50] " style={{ paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderColor: "#34495e" }}>
        <Link href="/" passHref>
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <Image src={DGLOGO} width={40} height={40} alt="DGLOGO" style={{ borderRadius: 5 }} />
            {!isCollapsed && <span className=" text-[#2c3e50] dark:text-[#fff]" style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Admin Dashboard</span>}
          </div>
        </Link>
      </div>
      
      {/* Navigation Menu - Scrollable */}
      <nav className="flex-1 py-0 overflow-y-auto" style={{backgroundColor: "#2c3e50"}}>
        {menuItems.map((item) => (
          <div key={item.id} className="px-3">
            <button
              onClick={() => (item.subItems ? toggleExpand(item.id) : setActiveSection(item.id))}
              style={{ fontSize: 14, fontWeight: 600, borderRadius: 15, color: "#fff" }}
              className={`w-full flex items-center justify-between px-4 py-2 my-1 transition-all duration-200 
                    ${activeSection.startsWith(item.id.split('-')[0]) ? "bg-[#F87E38] shadow-lg" : "text-[#2c3e50] dark:text-gray-400 hover:bg-[#F87E38] dark:hover:bg-gray-800"}
                    ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="flex items-center space-x-3" >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && item.subItems && (
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedItems[item.id] ? "rotate-180" : ""}`} />
              )}
            </button>
            <AnimatePresence>
              {!isCollapsed && expandedItems[item.id] && (
                <motion.div
                  variants={submenuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="pl-8 py-1 space-y-1"
                >
                  {item.subItems?.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveSection(subItem.id)}
                      style={{ fontSize: 12, fontWeight: 400, color: "#bdbddb" }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md transition-all duration-200 relative 
                            ${activeSection === subItem.id
                          ? "text-[#F87E38]"
                          : "text-[gray-500] dark:text-gray-400 hover:text-[#F87E38] dark:hover:text-[#F87E38]"
                        }`}
                    >
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-[#F87E38] rounded-r-full opacity-0 transition-opacity" style={{ opacity: activeSection === subItem.id ? 1 : 0 }} />
                      {subItem.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      {!isCollapsed && (
        <div className="px-4 py-4 bg-[#2c3e50] border-t border-[#34495e]">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-300" style={{fontWeight: 400, fontSize: 12}}>Terms & Conditions</p>
            <p className="text-xs text-gray-300" style={{fontWeight: 400, fontSize: 12}}>Version 1.0.0</p>
            <p className="text-xs text-gray-300" style={{fontWeight: 400, fontSize: 12}}>© {currentYear} All Rights Reserved by DGNext</p>
          </div>
        </div>
      )}
    </aside>
  );
};

// Placeholder Content Sections
const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm">
    {children}
  </div>
);
const DashboardOverviews = () => <SectionWrapper><DashboardOverview /></SectionWrapper>;
const AddCategories = () => <SectionWrapper><UploadCategories /></SectionWrapper>;
const AddPushNotifications = () => <SectionWrapper><AddPushNotification /></SectionWrapper>;
const CourseLists = () => <SectionWrapper><CourseList /></SectionWrapper>;
const ListNotifications = () => <SectionWrapper><ListNotification /></SectionWrapper>;
const StudentSection = () => <SectionWrapper><h2 className="text-xl font-bold">Student Management</h2></SectionWrapper>;
const EventSection = () => <SectionWrapper><h2 className="text-xl font-bold">Events</h2></SectionWrapper>;
const SettingsSection = () => <SectionWrapper><h2 className="text-xl font-bold">Settings</h2></SectionWrapper>;

// MAIN ADMIN DASHBOARD COMPONENT
interface AdminDashboardProps {
  onSignOut: () => void;
}

const AdminDashboard = ({ onSignOut }: AdminDashboardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <DashboardOverviews />;
      case "add-course": return <SectionWrapper><UploadCourseForm /></SectionWrapper>;
      case "course-list": return <CourseLists />;
      case "add-course-categories": return <AddCategories />;
      case "add-trainer": return <SectionWrapper><UploadTrainer /></SectionWrapper>;
      case "list-trainers": return <SectionWrapper><ListTrainer /></SectionWrapper>;
      case "students": return <StudentSection />;
      case "list-student": return <SectionWrapper><ListStudent /></SectionWrapper>;
      case "student-enroll-recorded": return <SectionWrapper><ListStudentEnroll /></SectionWrapper>;
      case "add-blogpost": return <SectionWrapper><CreateBlogPost /></SectionWrapper>;
      case "list-blogpost": return <SectionWrapper><BlogPostsList /></SectionWrapper>;
      case "events": return <EventSection />;
      case "add-event": return <SectionWrapper><UploadEvent /></SectionWrapper>;
      case "list-events": return <SectionWrapper><ListEvent /></SectionWrapper>;
      case "notifications": return <ListNotifications />;
      case "add-push-notification": return <AddPushNotifications />;
      case "list-notification": return <ListNotifications />;
      case "settings": return <SettingsSection />;
      default: return <DashboardOverviews />;
    }
  };

  const getPageTitle = (section: string) => {
    return section.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    // The font is inherited from the Tailwind config, no need to specify it here.
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto transform ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} onSignOut={onSignOut} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
          <div className="container mx-auto">
            <div className="mb-8">
              <h1 style={{ fontSize: 25, fontWeight: 800, color: "#2c3e50" }}>
                {getPageTitle(activeSection)}
              </h1>
              <p style={{ fontSize: 16, fontWeight: 400, color: "#bdbdbd" }} className="hover:text-">
                Welcome to your admin dashboard.
              </p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;