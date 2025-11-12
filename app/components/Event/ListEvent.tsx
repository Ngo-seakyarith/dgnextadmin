import React, { useEffect, useState } from 'react';
import { getDocs, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import Modal from '@/app/components/ui/Modals';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import successAnimation from '@/app/assets/animations/success.json'; // Path to success Lottie animation
import errorAnimation from '@/app/assets/animations/failed.json'; // Path to error Lottie animation
import { Pencil, Trash2 } from 'lucide-react';
import deleteAnimation from '@/app/assets/animations/trash.json'; // Update with the correct path to your Lottie JSON file
import dynamic from 'next/dynamic';
import Image from 'next/image';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });


interface Event {
    id: string;
    title: string;
    categoryId: string;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
}

// Define interface for CustomSwitch props
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


const ListEvent = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [resultModalType, setResultModalType] = useState<'success' | 'error' | null>(null);
    const [resultModalMessage, setResultModalMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(5);
    const totalPages = Math.ceil(events.length / eventsPerPage);
    const [editForm, setEditForm] = useState({
        title: '',
        categoryId: '',
        imageUrl: '',
        isActive: false
    });

    const categories = [
        'All', 'AI', 'Innovation', 'Leadership',
        'Strategy', 'Personal Finance', 'Selling', 'Communication'
    ];

    const fetchEvents = async () => {
        try {
            const eventsSnapshot = await getDocs(collection(db, 'Events'));
            const eventsList = eventsSnapshot.docs.map((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
                return {
                    id: doc.id,
                    title: data.title,
                    categoryId: data.categoryId,
                    imageUrl: data.imageUrl,
                    isActive: data.isActive,
                    createdAt,
                };
            });
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events: ', error);
        }
    };

    const handleDeleteConfirm = (id: string) => {
        setEventToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (eventToDelete) {
            try {
                await deleteDoc(doc(db, 'Events', eventToDelete));
                setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventToDelete));
                setIsDeleteModalOpen(false);
                setResultModalType('success');
                setResultModalMessage('Event deleted successfully!');
                setIsResultModalOpen(true);
            } catch (error) {
                console.error('Error deleting event: ', error);
                setIsDeleteModalOpen(false);
                setResultModalType('error');
                setResultModalMessage('Failed to delete event.');
                setIsResultModalOpen(true);
            } finally {
                setEventToDelete(null);
            }
        }
    };

    const handleEdit = (event: Event) => {
        setSelectedEvent(event);
        setEditForm({
            title: event.title,
            categoryId: event.categoryId,
            imageUrl: event.imageUrl,
            isActive: event.isActive
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (selectedEvent) {
            try {
                const eventRef = doc(db, 'Events', selectedEvent.id);
                await updateDoc(eventRef, {
                    title: editForm.title,
                    categoryId: editForm.categoryId,
                    imageUrl: editForm.imageUrl,
                    isActive: editForm.isActive
                });

                setEvents((prevEvents) =>
                    prevEvents.map((event) =>
                        event.id === selectedEvent.id
                            ? { ...event, ...editForm }
                            : event
                    )
                );
                setIsEditModalOpen(false);
                setResultModalType('success');
                setResultModalMessage('Event updated successfully!');
                setIsResultModalOpen(true);
            } catch (error) {
                console.error('Error updating event: ', error);
                setIsEditModalOpen(false);
                setResultModalType('error');
                setResultModalMessage('Failed to update event.');
                setIsResultModalOpen(true);
            }
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(
                    <Button
                        style={{ paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15, borderRadius: 15 }}
                        key={i}
                        onClick={() => paginate(i)}
                        className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === i ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        size="sm"
                    >
                        {i}
                    </Button>
                );
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

            if (startPage > 1) {
                pageNumbers.push(
                    <Button
                        key={1}
                        onClick={() => paginate(1)}
                        className={`mx-1 ${currentPage === 1 ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}
                        size="sm"
                    >
                        1
                    </Button>
                );
                if (startPage > 2) pageNumbers.push(<span key="dots1" className="mx-2">...</span>);
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                    <Button
                        key={i}
                        onClick={() => paginate(i)}
                        className={`mx-1 ${currentPage === i ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}
                        size="sm"
                    >
                        {i}
                    </Button>
                );
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pageNumbers.push(<span key="dots2" className="mx-2">...</span>);
                pageNumbers.push(
                    <Button
                        key={totalPages}
                        onClick={() => paginate(totalPages)}
                        className={`mx-1 ${currentPage === totalPages ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}
                        size="sm"
                    >
                        {totalPages}
                    </Button>
                );
            }
        }
        return pageNumbers;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
            timeZone: 'Asia/Singapore',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="w-full p-10">
            <div className='p-10' style={{
                boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                paddingTop: 20
            }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Title:</TableHead>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category:</TableHead>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Image:</TableHead>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Status:</TableHead>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Created At:</TableHead>
                            <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Actions:</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentEvents.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell style={{ fontWeight: 400, fontSize: 14, color: "#6e737c" }}>{event.title}</TableCell>
                                <TableCell style={{ fontWeight: 700, fontSize: 14, color: "#6e737c", textTransform: "uppercase" }}>{event.categoryId}</TableCell>
                                <TableCell>
                                    <div className="relative h-16 w-16" style={{ justifyContent: "center", alignItems: "center" }}>
                                        {event.imageUrl ? (
                                            <Image
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="rounded-md object-cover h-full w-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                                <span className="text-gray-500 text-xs">No Image</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex">
                                        <Badge style={{ borderRadius: 10, paddingTop: 5, paddingBottom: 5, paddingRight: 10, paddingLeft: 10, fontSize: 14 }}
                                            className={`${event.isActive ? 'bg-green-500 text-white' : 'bg-red-100 text-red-800'}`}
                                        >
                                            {event.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell style={{ fontWeight: 400, fontSize: 14, color: "#6e737c" }}>
                                    {formatDate(event.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2" >
                                        <Button
                                            className="flex items-center gap-2 transition-all duration-200 hover:scale-105 font-barlow text-slate-800 border-slate-800"
                                            onClick={() => handleEdit(event)}
                                            style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15, backgroundColor: "#BBF7D0", color: "#15803D" }}
                                        >
                                            <Pencil className="h-5 w-5 mr-2" style={{ color: "#15803D" }} />
                                            Edit
                                        </Button>
                                        <Button
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-800 text-white transition-all duration-200 hover:scale-105 font-barlow"
                                            onClick={() => handleDeleteConfirm(event.id)}
                                            style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15 }}
                                        >
                                            <Trash2 className="h-5 w-5 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex justify-center items-center mt-6 gap-2">
                    <Button style={{ paddingBottom: 8, paddingTop: 8, paddingLeft: 15, paddingRight: 15, borderRadius: 15 }} onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">Previous</Button>
                    <div className="flex">{renderPageNumbers()}</div>
                    <Button style={{ paddingBottom: 8, paddingTop: 8, paddingLeft: 15, paddingRight: 15, borderRadius: 15 }} onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">Next</Button>
                </div>
            </div>



            {/* Edit Modal */}
            {isEditModalOpen && selectedEvent && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <div className="p-1 space-y-4">
                        <h2 className="mb-0" style={{ textAlign: "center", color: "#2c3e50", fontSize: 20, fontWeight: 700 }}>Edit Event</h2>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Title:</Label>
                            <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full"
                                placeholder="Type title"
                                style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryId" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category:</Label>
                            <Select
                                value={editForm.categoryId}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, categoryId: value }))}
                            >
                                <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category}
                                            value={category}
                                            className=" hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}
                                        >
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Image URL:</Label>
                            <Input
                                id="imageUrl"
                                value={editForm.imageUrl}
                                onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                className="w-full"
                                style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}
                            />
                            {editForm.imageUrl && (
                                <div className="mt-2">
                                    <Image
                                        src={editForm.imageUrl}
                                        alt="Image Preview"
                                        className="w-full h-auto"
                                        style={{borderRadius: 15}}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Label htmlFor="status" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Active Status:</Label>
                            <CustomSwitch
                                isActive={editForm.isActive}
                                onToggle={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                            />
                        </div>

                        <div className="flex space-x-2 pt-4" style={{ justifyContent: "center", borderRadius: 15 }}>
                            <Button onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 text-black hover:bg-gray-300 transition duration-300" style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate} className="bg-[#2c3e50] text-white hover:bg-[#4980b8]" style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>
                                Update
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Result Modal for Update/Delete Success or Failure */}
            {isResultModalOpen && (
                <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)}>
                    <div className="text-center">
                        <div className="flex justify-center items-center">
                            <Lottie
                                animationData={resultModalType === 'success' ? successAnimation : errorAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: 150, height: 150 }}
                            />
                        </div>
                        <h2 className="text-xl font-semibold mt-4">
                            {resultModalType === 'success' ? 'Success!' : 'Error'}
                        </h2>
                        <p className="mt-2">{resultModalMessage}</p>
                        <div className="mt-4">
                            <Button
                                onClick={() => setIsResultModalOpen(false)}
                                className={`w-full text-white ${resultModalType === 'success' ? 'bg-[#2c3e50]' : 'bg-red-600'} hover:${resultModalType === 'success' ? 'bg-[#4980b8]' : 'bg-red-800'} transition duration-300`}
                                style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}
                            >
                                Okay
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                    <div className="text-center p-0">
                        <div
                            className="mb-4"
                            style={{
                                display: "flex",
                                justifyContent: "center",  // Horizontally center
                                alignItems: "center",      // Vertically center
                                height: "100%",             // Ensure the container has height to center

                            }}
                        >
                            <Lottie
                                animationData={deleteAnimation}
                                loop
                                style={{
                                    width: 200,
                                    height: 200,
                                    marginTop: -30,
                                    marginBottom: -50
                                }}
                            />
                        </div>
                        <h2 className="mb-0" style={{ fontWeight: 800, fontSize: 16, color: "#2c3e50", textAlign: "center" }}>Are you sure?</h2>
                        <p style={{ fontWeight: 400, fontSize: 14, color: "#6e737c" }}>You want to delete this event.</p>
                        <div className="flex space-x-4 justify-center" style={{ marginTop: 20, marginBottom: 10 }}>
                            <Button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="bg-gray-200 text-black hover:bg-gray-300 transition duration-300"
                                style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-105"
                                style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400, color: "#fff" }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ListEvent;