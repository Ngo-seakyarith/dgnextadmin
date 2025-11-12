import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/app/lib/config/firebase";
import { DropdownMenuItem } from "./dropdown-menu";

// ✅ Add type for props
interface ProfileModalProps {
  adminId: string;
}

interface AdminData {
  username?: string;
  email?: string;
  role?: string;
  imgProfile?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ adminId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    imgProfile: "",
  });

  const fetchAdminInfo = async () => {
    const adminDocRef = doc(db, "adminInfo", adminId);
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
      const data = adminDocSnap.data() as AdminData;
      setFormData({
        username: data.username ?? "",
        email: data.email ?? "",
        role: data.role ?? "",
        imgProfile: data.imgProfile ?? "",
      });
    }
  };

  const handleSave = async () => {
    const adminDocRef = doc(db, "adminInfo", adminId);
    try {
      const docSnap = await getDoc(adminDocRef);
      if (docSnap.exists()) {
        await updateDoc(adminDocRef, formData);
      } else {
        await setDoc(adminDocRef, formData);
      }
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onClick={fetchAdminInfo}>Profile</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Profile Image URL"
            value={formData.imgProfile}
            onChange={(e) => setFormData({ ...formData, imgProfile: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;