// components/UploadTrainer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  X,
  Save,
  Eye,
  Award,
  Camera,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { db, storage, auth } from "@/app/lib/config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signInAnonymously, User as FirebaseUser } from "firebase/auth";
import facebookIcon from "@/app/assets/socialpng/facebook.png";
import youtubeIcon from "@/app/assets/socialpng/youtube.png";
import telegramIcon from "@/app/assets/socialpng/telegram.png";
import linkedinIcon from "@/app/assets/socialpng/linkedin.png";
import tiktokIcon from "@/app/assets/socialpng/tiktok.png";
import twitterIcon from "@/app/assets/socialpng/twitter.png";
import gmailIcon from "@/app/assets/socialpng/gmail.png";
import whatsappIcon from "@/app/assets/socialpng/whatsapp.png";
import xIcon from "@/app/assets/socialpng/twitter (1).png";

interface TrainerData {
  id?: string;
  instructor: string;
  email: string;
  phone: string;
  bio: string;
  skills: string[];
  experience: string;
  location: string;
  profile: string;
  cover: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  socialLinks: { platform: string; url: string }[];
  certifications: string[];
  languages: string[];
  hourlyRate: string;
  availability: string;
  date: string;
}

interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, isVisible, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg border flex items-center space-x-3 shadow-lg ${colors[type]}`}
        >
          {icons[type]}
          <span className="font-medium">{message}</span>
          <button onClick={onClose} className="ml-4 hover:opacity-70" aria-label="Close alert">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const socialPlatforms = [
  { name: "Facebook", icon: facebookIcon },
  { name: "Youtube", icon: youtubeIcon },
  { name: "Telegram", icon: telegramIcon },
  { name: "Linkedin", icon: linkedinIcon },
  { name: "Tiktok", icon: tiktokIcon },
  { name: "Twitter", icon: twitterIcon },
  { name: "Email", icon: gmailIcon },
  { name: "WhatsApp", icon: whatsappIcon },
  { name: "X", icon: xIcon },
];

const UploadTrainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
    isVisible: boolean;
  }>({
    type: "info",
    message: "",
    isVisible: false,
  });
  const [formData, setFormData] = useState<TrainerData>({
    instructor: "",
    email: "",
    phone: "",
    bio: "",
    skills: [],
    experience: "",
    location: "",
    profile: "",
    cover: "",
    rating: 0,
    totalStudents: 0,
    totalCourses: 0,
    socialLinks: [],
    certifications: [],
    languages: [],
    hourlyRate: "",
    availability: "Full-time",
    date: new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).replace("GMT", "UTC"),
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            setUser(userCredential.user);
            showAlert("info", "Signed in anonymously to upload trainer data.");
          })
          .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            showAlert("error", `Authentication failed: ${error.message}`);
          });
      }
    });
    return () => unsubscribe();
  }, []);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message, isVisible: true });
    setTimeout(() => setAlert((prev) => ({ ...prev, isVisible: false })), 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      showAlert("error", "You must be signed in to upload images.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      try {
        const storageRef = ref(storage, `trainers/profile/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setImagePreview(downloadURL);
        setFormData((prev) => ({ ...prev, profileImage: downloadURL }));
      } catch (error: unknown) {
        console.error("Error uploading profile image:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        showAlert("error", `Failed to upload profile image: ${errorMessage}`);
      }
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      showAlert("error", "You must be signed in to upload images.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      try {
        const storageRef = ref(storage, `trainers/cover/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setCoverImagePreview(downloadURL);
        setFormData((prev) => ({ ...prev, coverImage: downloadURL }));
      } catch (error: unknown) {
        console.error("Error uploading cover image:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        showAlert("error", `Failed to upload cover image: ${errorMessage}`);
      }
    }
  };

  const addToArray = (
    arrayName: "skills" | "certifications" | "languages",
    value: string
  ) => {
    if (value.trim() && !formData[arrayName].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()],
      }));
      if (arrayName === "skills") setNewSkill("");
      if (arrayName === "certifications") setNewCertification("");
      if (arrayName === "languages") setNewLanguage("");
    }
  };

  const addSocialLink = () => {
    if (newSocialPlatform && newSocialUrl.trim()) {
      const normalizedPlatform = socialPlatforms.find(
        (p) => p.name.toLowerCase() === newSocialPlatform.toLowerCase()
      )?.name;
      if (
        normalizedPlatform &&
        !formData.socialLinks.some((link) => link.platform === normalizedPlatform)
      ) {
        setFormData((prev) => ({
          ...prev,
          socialLinks: [
            ...prev.socialLinks,
            { platform: normalizedPlatform, url: newSocialUrl.trim() },
          ],
        }));
        setNewSocialPlatform("");
        setNewSocialUrl("");
      } else {
        showAlert("error", "A link for this platform already exists or platform is invalid.");
      }
    }
  };

  const removeFromArray = (
    arrayName: "skills" | "certifications" | "languages" | "socialLinks",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.instructor.trim()) {
      showAlert("error", "Instructor name is required");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      showAlert("error", "Valid email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      showAlert("error", "Phone number is required");
      return false;
    }
    if (!formData.bio.trim()) {
      showAlert("error", "Bio is required");
      return false;
    }
    if (formData.skills.length === 0) {
      showAlert("error", "At least one skill is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showAlert("error", "You must be signed in to create a trainer profile.");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const trainerRef = await addDoc(collection(db, "trainers"), {
        ...formData,
        createdAt: new Date(),
        createdBy: user.uid,
      });

      console.log("Trainer added with ID: ", trainerRef.id);
      showAlert("success", "Trainer profile created successfully!");

      setFormData({
        instructor: "",
        email: "",
        phone: "",
        bio: "",
        skills: [],
        experience: "",
        location: "",
        profile: "",
        cover: "",
        rating: 0,
        totalStudents: 0,
        totalCourses: 0,
        socialLinks: [],
        certifications: [],
        languages: [],
        hourlyRate: "",
        availability: "Full-time",
        date: new Date().toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }).replace("GMT", "UTC"),
      });
      setImagePreview("");
      setCoverImagePreview("");
      setNewSkill("");
      setNewCertification("");
      setNewLanguage("");
      setNewSocialPlatform("");
      setNewSocialUrl("");
    } catch (error: unknown) {
      console.error("Error creating trainer profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      showAlert("error", `Failed to create trainer profile: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <Alert {...alert} onClose={() => setAlert((prev) => ({ ...prev, isVisible: false }))} />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Image and Cover Section */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <h3 className=" dark:text-white mb-4 flex items-center" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    <Camera className="w-5 h-5 mr-2" />
                    Profile Photo & Cover
                  </h3>

                  <div className="relative mb-4">
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-colors group">
                      {coverImagePreview ? (
                        <Image
                          src={coverImagePreview}
                          alt="Cover preview"
                          width={300}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-400 transition-colors">
                          <Upload className="w-10 h-10 mb-2" />
                          <p style={{fontSize: 14, fontWeight: 400}}>Upload Cover</p>
                          <p style={{fontSize: 12, fontWeight: 400}}>Any size, image only</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="absolute inset-0 w-full h-full bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                      aria-label="Upload cover image"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                  </div>

                  {coverImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImagePreview("");
                        setFormData((prev) => ({ ...prev, coverImage: "" }));
                      }}
                      className="mb-3 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                      aria-label="Remove cover image"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Cover
                    </button>
                  )}

                  <div className="relative">
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-colors group">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Profile preview"
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-400 transition-colors">
                          <Upload className="w-10 h-10 mb-2" />
                          <p style={{fontSize: 14, fontWeight: 400}}>Upload Photo</p>
                          <p style={{fontSize: 12, fontWeight: 400}}>Any size, image only</p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 w-full h-full bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"
                      aria-label="Upload profile image"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                  </div>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setFormData((prev) => ({ ...prev, profileImage: "" }));
                      }}
                      className="mt-3 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                      aria-label="Remove profile image"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className=" dark:text-white mb-6 flex items-center" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Instructor:
                      </label>
                      <input
                        type="text"
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleInputChange}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="Enter instructor name"
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Email Address:
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                          className="w-full pl-11 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                          placeholder="trainer@example.com"
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2"  style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Phone Number:
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                          className="w-full pl-11 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                          placeholder="+1 (555) 123-4567"
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Location:
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                          className="w-full pl-11 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Date:
                      </label>
                      <input
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="Enter date"
                        readOnly
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Hourly Rate:
                      </label>
                      <input
                        type="text"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="$50/hour"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div>
                  <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Biography:
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
                    placeholder="Tell us about the trainer's background, experience, and teaching philosophy..."
                    aria-required="true"
                  />
                </div>

                {/* Professional Details */}
                <div>
                  <h3 className="text-lg dark:text-white mb-6 flex items-center" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    <Award className="w-5 h-5 mr-2" />
                    Professional Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Years of Experience:
                      </label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      >
                        <option value="" className="hover:bg-[#F97E38] hover:text-[#fff]" style={{borderRadius: 15}}>Select experience</option>
                        <option value="0-1" className="hover:bg-[#F97E38] hover:text-[#fff]">0-1 years</option>
                        <option value="2-5" className="hover:bg-[#F97E38] hover:text-[#fff]">2-5 years</option>
                        <option value="6-10" className="hover:bg-[#F97E38] hover:text-[#fff]">6-10 years</option>
                        <option value="10+" className="hover:bg-[#F97E38] hover:text-[#fff]">10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Availability:
                      </label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Skills:
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="Add skill"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addToArray("skills", newSkill))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addToArray("skills", newSkill)}
                      style={{borderRadius: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                      className="bg-[#2c3e50] text-white hover:bg-[#71869b] transition-colors flex items-center"
                      aria-label="Add skill"
                    >
                      <Plus className="mr-2 w-5 h-5" />
                      <span style={{ fontSize: 15 }}>Add</span>
                      
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        style={{paddingRight: 15, paddingLeft: 15, paddingTop: 5, paddingBottom: 5, fontWeight: 400, fontSize: 14, borderRadius: 10}}
                        className="inline-flex items-center py-1 bg-[#eeeeee] text-[#2c3e50]"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeFromArray("skills", index)}

                          className="ml-2 text-[#2c3e50] hover:text-[#2c3e50]"
                          aria-label="Remove skill"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Certifications:
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="Add certification"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addToArray("certifications", newCertification))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addToArray("certifications", newCertification)}
                      style={{borderRadius: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                      className="px-4 py-2 bg-[#2c3e50] text-white hover:bg-[#71869b] transition-colors flex items-center"
                      aria-label="Add certification"
                    >
                      <Plus className="mr-2 w-5 h-5" />
                      <span style={{ fontSize: 15 }}>Add</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, index) => (
                      <span
                        key={index}
                        style={{paddingRight: 15, paddingLeft: 15, paddingTop: 5, paddingBottom: 5, fontWeight: 400, fontSize: 14, borderRadius: 10}}
                        className="inline-flex items-center px-3 py-1 bg-[#eeeeee] text-[#2c3e50] text-sm rounded-full"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeFromArray("certifications", index)}
                          className="ml-2 text-[#2c3e50] hover:text-[#2c3e50]"
                          aria-label="Remove certification"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block dark:text-gray-300 mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Languages:
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="Add language"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addToArray("languages", newLanguage))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addToArray("languages", newLanguage)}
                      style={{borderRadius: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                      className="px-4 py-2 bg-[#2c3e50] text-white hover:bg-[#71869b] transition-colors flex items-center"
                      aria-label="Add language"
                    >
                      <Plus className="mr-2 w-5 h-5" />
                      <span style={{ fontSize: 15 }}>Add</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-[#eeeeee] text-[#2c3e50] text-sm rounded-full"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeFromArray("languages", index)}
                          className="ml-2 text-[#2c3e50] hover:text-[#2c3e50]"
                          aria-label="Remove language"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg dark:text-white mb-6" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Social Links:
                  </h3>

                  <div className="space-y-4">
                    <div className="flex space-x-2 mb-3">
                      <select
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        aria-label="Select social platform"
                      >
                        <option value="">Select platform</option>
                        {socialPlatforms.map((platform) => (
                          <option key={platform.name} value={platform.name}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        style={{borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#2c3e50"}}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="Enter URL"
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSocialLink())
                        }
                        aria-label="Enter social link URL"
                      />
                      <button
                        type="button"
                        onClick={addSocialLink}
                        style={{borderRadius: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                        className="px-4 py-2 bg-[#2c3e50] text-white hover:bg-[#71869b] transition-colors flex items-center"
                        aria-label="Add social link"
                      >
                        <Plus className="mr-2 w-5 h-5" />
                        <span style={{ fontSize: 15 }}>Add</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.socialLinks.map((link, index) => {
                        const platform = socialPlatforms.find((p) => p.name === link.platform);
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-[#eeeeee] text-[#2c3e50] text-sm rounded-full"
                          >
                            {platform ? (
                              <Image
                                src={platform.icon}
                                alt={`${platform.name} icon`}
                                width={16}
                                height={16}
                                className="mr-2"
                                unoptimized
                              />
                            ) : (
                              <span className="mr-2 text-red-500">[Icon Missing]</span>
                            )}
                            {link.platform}: {link.url}
                            <button
                              type="button"
                              onClick={() => removeFromArray("socialLinks", index)}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                              aria-label="Remove social link"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                style={{borderRadius: 15, paddingTop: 8, paddingBottom: 8, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                aria-label="Preview trainer profile"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview
              </button>

              <button
                type="submit"
                disabled={isLoading || !user}
                style={{borderRadius: 15, paddingTop: 8, paddingBottom: 8, paddingLeft: 15, paddingRight: 15, fontSize: 15, fontWeight: 400 }}
                className="px-4 py-2 bg-gradient-to-r from-[#2c3e50] to-[#2c3e50] text-white focus:ring-2 focus:ring-[#2c3e50] focus:border-[#2c3e50] transition-all transform hover:scale-105 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Create trainer profile"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Create Trainer
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadTrainer;