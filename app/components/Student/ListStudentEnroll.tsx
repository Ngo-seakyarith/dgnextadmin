import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Card, CardContent } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import deleteAnimation from '@/app/assets/animations/trash.json'; // Update with the correct path to your Lottie JSON file
import dynamic from 'next/dynamic';


const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Enrollment {
    id: string;
    username: string;
    courseTitle: string;
    instructor: string;
    price: number | string;
    createdAt: Date;
}

const ListStudentEnroll = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const q = query(collection(db, 'users'));
                const querySnapshot = await getDocs(q);

                const enrollmentData: Enrollment[] = [];
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.enrollment && Array.isArray(userData.enrollment)) {
                        userData.enrollment.forEach((enrollment, index) => {
                            enrollmentData.push({
                                id: `${doc.id}-${index}`,
                                username: userData.username || '',
                                courseTitle: enrollment.courseTitle || '',
                                instructor: enrollment.instructor || '',
                                price: enrollment.price || 'Free',
                                createdAt: enrollment.enrolledAt
                                    ? new Date(enrollment.enrolledAt)
                                    : new Date(),
                            });
                        });
                    }
                });

                setEnrollments(enrollmentData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching enrollments:', err);
                setError('Failed to fetch enrollment data');
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const [docId, index] = id.split('-');
            const userDocRef = doc(db, 'users', docId);
            const userDocSnapshot = await getDoc(userDocRef);
            const userData = userDocSnapshot.data();

            if (userData?.enrollment && Array.isArray(userData.enrollment)) {
                const updatedEnrollments = userData.enrollment.filter(
                    (_, idx) => idx !== parseInt(index, 10)
                );

                await updateDoc(userDocRef, { enrollment: updatedEnrollments });

                setEnrollments((prevEnrollments) =>
                    prevEnrollments.filter((enrollment) => enrollment.id !== id)
                );
            }
        } catch (err) {
            console.error('Error deleting enrollment:', err);
            setError('Failed to delete enrollment');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2c3e50]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600 font-barlow text-lg">
                {error}
            </div>
        );
    }

    // Calculate pagination
    const totalPages = Math.ceil(enrollments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEnrollments = enrollments.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const renderPageNumbers = () => {
        const pageNumbers = [];
        if (totalPages <= 7) {
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
            // First page
            pageNumbers.push(
                <Button
                    key={1}
                    onClick={() => paginate(1)}
                    className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110
                      ${currentPage === 1
                            ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
                    size="sm"
                >
                    1
                </Button>
            );

            if (currentPage > 3) {
                pageNumbers.push(
                    <span key="dots1" className="mx-2 text-gray-500">...</span>
                );
            }

            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pageNumbers.push(
                    <Button
                        key={i}
                        onClick={() => paginate(i)}
                        className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105
                          ${currentPage === i
                                ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
                        size="sm"
                    >
                        {i}
                    </Button>
                );
            }

            if (currentPage < totalPages - 2) {
                pageNumbers.push(
                    <span key="dots2" className="mx-2 text-gray-500">...</span>
                );
            }

            // Last page
            pageNumbers.push(
                <Button
                    key={totalPages}
                    onClick={() => paginate(totalPages)}
                    className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105
                      ${currentPage === totalPages
                            ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
                    size="sm"
                >
                    {totalPages}
                </Button>
            );
        }
        return pageNumbers;
    };

    return (
        <div className='w-full p-10'>
            <Card className="w-full p-10 rounded-xl" style={{
                boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                paddingTop: 20,
                borderColor: "#fff"
            }}>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Username:</TableHead>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Course Title:</TableHead>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Instructor:</TableHead>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Price:</TableHead>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Enrollment Date:</TableHead>
                                <TableHead style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Actions:</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentEnrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                    <TableCell style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{enrollment.username}</TableCell>
                                    <TableCell style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{enrollment.courseTitle}</TableCell>
                                    <TableCell style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{enrollment.instructor}</TableCell>
                                    <TableCell style={{fontWeight: 700, fontSize: 14, color: "#6e737c"}}>
                                        {typeof enrollment.price === 'string' && enrollment.price === 'Free'
                                            ? 'Free'
                                            : `$${parseFloat(enrollment.price.toString()).toFixed(2)}`}
                                    </TableCell>
                                    <TableCell style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>
                                        {enrollment.createdAt.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15 }}
                                                    size="sm"
                                                    className="transition-all text-white duration-300 ease-in-out transform hover:scale-105 bg-red-600 hover:bg-red-700"
                                                >
                                                    <Trash2 className="mr-2 h-5 w-5" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent style={{ width: 400, borderRadius: 15 }}>
                                                <AlertDialogHeader>
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

                                                    <AlertDialogTitle style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50", textAlign: "center" }}>You want to delete?</AlertDialogTitle>
                                                    <AlertDialogDescription style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, color: "#6e737c", textAlign: "center" }}>
                                                        This action cannot be undone. <br /> The enrollment will be permanently
                                                        deleted.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter style={{ justifyContent: "center" }}>
                                                    <AlertDialogCancel className='text-[#2c3e50] transition-all duration-300 hover:scale-105' style={{paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(enrollment.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-105"
                                                        style={{paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center mt-6 gap-2">
                        <Button
                            style={{ paddingBottom: 8, paddingTop: 8, paddingLeft: 15, paddingRight: 15, borderRadius: 15 }}
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                            {renderPageNumbers()}
                        </div>
                        <Button
                            style={{ paddingBottom: 8, paddingTop: 8, paddingLeft: 15, paddingRight: 15, borderRadius: 15 }}
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ListStudentEnroll;