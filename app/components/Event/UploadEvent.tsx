import React, { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import { db } from '@/app/lib/config/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Replace addDoc with setDoc
import Image from 'next/image';
import Modal from '@/app/components/ui/Modals'; // Assuming you have a Modal component
import successAnimation from '@/app/assets/animations/success.json'; // Path to success Lottie animation
import errorAnimation from '@/app/assets/animations/failed.json'; // Path to error Lottie animation
import dynamic from 'next/dynamic';
import Imagegallerylogo from "@/app/assets/png/image-gallery.png"

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// add this right above the component or in a separate file
interface CustomSwitchProps {
  isActive: boolean;
  onToggle: () => void;
}

const CustomSwitch = ({ isActive, onToggle }: CustomSwitchProps) => (
  <div
    className={`relative w-12 h-6 rounded-full transition-all duration-300 
      ${isActive ? "bg-green-500" : "bg-gray-400"}`}
    onClick={onToggle}
  >
    <span
      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
      ${isActive ? "translate-x-6" : "translate-x-0"}`}
    />
  </div>
);

const UploadEvent = () => {
    const [formData, setFormData] = useState({
        title: '',
        categoryId: 'All',
        imageUrl: '', // Image URL as a string
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error' | null>(null);
    const [modalMessage, setModalMessage] = useState('');

    const categories = [
        'All', 'AI', 'Innovation', 'Leadership',
        'Strategy', 'Personal Finance', 'Selling', 'Communication'
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Validation: Check for empty required fields
        if (!formData.title || !formData.categoryId) {
            setModalType('error');
            setModalMessage('Title and Category are required fields.');
            setModalOpen(true);
            setLoading(false);
            return;
        }

        try {
            const eventData = {
                title: formData.title,
                categoryId: formData.categoryId,
                imageUrl: formData.imageUrl || '', // Optional field
                isActive: formData.isActive,
                createdAt: serverTimestamp(),
            };

            // Use title as the document ID
            const eventRef = doc(collection(db, 'Events'), formData.title);
            await setDoc(eventRef, eventData);

            console.log('✅ Event uploaded:', eventData);

            // Reset Form
            setFormData({ title: '', categoryId: 'All', imageUrl: '', isActive: true });
            setModalType('success');
            setModalMessage('Event uploaded successfully!');
            setModalOpen(true);
        } catch (error) {
            console.error('❌ Error uploading event:', error);
            setModalType('error');
            setModalMessage('Failed to upload event. Please try again.');
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
        setModalMessage('');
    };

    return (
        <div className="flex gap-6 p-10">
            <Card className="p-6 w-1/2" style={{
                borderColor: "#fff", boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                paddingTop: 20,
            }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Title:</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Type event title"
                            className="w-full"
                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category:</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                            <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category}
                                        value={category}
                                        className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]"
                                        style={{ borderRadius: 13 }}
                                    >
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Image URL:</Label>
                        <Input
                            id="imageUrl"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="Enter image URL"
                            className="w-full"
                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                        />
                    </div>

                    <div className="flex items-center">
                        <Label htmlFor="isActive" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Event Active:</Label>
                        <div style={{ paddingLeft: 10 }}>
                            <CustomSwitch
                                isActive={formData.isActive}
                                onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#2c3e50] hover:bg-[#34495e] text-white"
                        disabled={loading}
                        style={{ borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                    >
                        {loading ? "Uploading..." : "Upload Event"}
                    </Button>
                </form>
            </Card>

            <Card className="p-6 w-1/2" style={{
                borderColor: "#fff", boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                paddingTop: 20,
            }}>
                <h2 className=" mb-4 text-center" style={{ fontSize: 16, fontWeight: 800, color: "#2c3e50" }}>Preview</h2>
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Title:</h3>
                        <p style={{ fontWeight: 400, fontSize: 15, color: "#6e737c" }}>{formData.title || 'Display Events title'}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category:</h3>
                        <p style={{ fontWeight: 400, fontSize: 15, color: "#6e737c" }}>{formData.categoryId || 'Display categories'}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Status:</h3>
                        <p style={{ fontWeight: 400, fontSize: 15, color: "#6e737c" }}>{formData.isActive ? 'Active' : 'Inactive'}</p>
                    </div>

                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Image:</h3>
                        {formData.imageUrl ? (
                            <Image src={formData.imageUrl} alt="Event Preview" className="mt-2 max-w-full h-48 object-cover" style={{ borderRadius: 15 }} />
                        ) : (
                            <div
                                className="mt-2 max-w-full h-48 bg-gray-200 flex items-center justify-center"
                                style={{
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: 15
                                }}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <Image
                                        src={Imagegallerylogo}
                                        width={30}
                                        height={30}
                                        alt="Money received icon"
                                    />
                                    <span className="text-[#2c3e50] text-xl" style={{ fontSize: 14, paddingTop: 5, fontWeight: 400, color: "#2c3e50" }}>No Image</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Modal for Success or Error */}
            <Modal isOpen={modalOpen} onClose={closeModal}>
                <div className="text-center">
                    <div className="flex justify-center items-center">
                        <Lottie
                            animationData={modalType === 'success' ? successAnimation : errorAnimation}
                            loop={true}
                            autoplay={true}
                            style={{ width: 150, height: 150 }}
                        />
                    </div>
                    <h2 className="text-xl font-semibold mt-4">
                        {modalType === 'success' ? 'Success!' : 'Error'}
                    </h2>
                    <p className="mt-2">{modalMessage}</p>
                    <div className="mt-4">
                        <Button
                            onClick={closeModal}
                            className={`w-full text-white ${modalType === 'success' ? 'bg-[#2c3e50]' : 'bg-red-600'} hover:${modalType === 'success' ? 'bg-[#34495e]' : 'bg-red-800'} transition duration-300 ease-in-out transform hover:shadow-lg`}
                            style={{ borderRadius: 10 }}
                        >
                            Okay
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UploadEvent;