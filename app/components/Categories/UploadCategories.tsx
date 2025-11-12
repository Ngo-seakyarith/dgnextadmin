import React, { useState } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import Modal from '@/app/components/ui/Modals';
import successAnimation from '@/app/assets/animations/success.json';
import { PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Category {
    id: string;
    name: string;
    thumbnail: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const UploadCategories = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        thumbnail: '',
        isActive: true
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCategoryData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleToggleActive = () => {
        setCategoryData((prevState) => ({
            ...prevState,
            isActive: !prevState.isActive
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const categoryId = categoryData.name;
            const categoryPayload: Category = {
                id: categoryId,
                ...categoryData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const categoryRef = doc(collection(db, 'categories'), categoryId);
            await setDoc(categoryRef, categoryPayload);

            setCategoryData({
                name: '',
                thumbnail: '',
                isActive: true
            });

            setIsModalOpen(true);
        } catch (error) {
            console.error('Error uploading category:', error);
            alert('Failed to upload category. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto p-10" style={{justifyContent: "center", alignItems: "center"}}>
            <Card style={{
                width: 500, justifyContent: "center", alignItems: "center", boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                borderColor: "#fff",
                padding: 10
            }}>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2 pt-4">
                                <Label htmlFor="name" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category Name:</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={categoryData.name}
                                    onChange={handleChange}
                                    className="w-full"
                                    placeholder="Enter category name"
                                    required
                                    style={{borderRadius: 15}}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Active Status:</Label>
                                <Switch
                                    id="isActive"
                                    checked={categoryData.isActive}
                                    onCheckedChange={handleToggleActive}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 
                                    ${categoryData.isActive ? "bg-green-500" : "bg-gray-400"}`}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
                                    ${categoryData.isActive ? "translate-x-6" : "translate-x-0"}`}
                                    />
                                </Switch>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full text-zinc-100"
                            style={{ backgroundColor: "#2c3e50", borderRadius: 15, paddingTop: 10, paddingBottom: 10 }}
                            disabled={isLoading}
                        >
                            <PlusCircle className="mr-2 h-5 w-5" />{isLoading ? 'Adding Category...' : 'Add Category'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="text-center">
                    <div className="flex justify-center items-center">
                        <Lottie
                            animationData={successAnimation}
                            loop={true}
                            autoplay={true}
                            style={{ width: 150, height: 150 }}
                        />
                    </div>

                    <h2 className="text-xl font-semibold">Upload successfully!</h2>
                    <p className="mt-2">Category has been added.</p>

                    <div className="mt-4">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full text-white bg-[#2c3e50] hover:bg-[#416b96] active:scale-95 p-3 rounded-lg transition duration-300 ease-in-out transform hover:shadow-lg"
                        >
                            Okay
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UploadCategories;