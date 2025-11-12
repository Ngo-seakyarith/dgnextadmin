// import React, { useEffect, useState } from 'react';
// import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/config/firebase';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { PencilIcon, TrashIcon } from 'lucide-react';
// import EditQuiz from '@/components/Quiz/EditQuiz';
// import { Timestamp } from 'firebase/firestore';

// interface Quiz {
//   id: string;
//   courseTitle: string;
//   question: string;
//   correctAnswer: string;
//   isActive: boolean;
//   timeUpdated: Timestamp;
//   createdAt: Timestamp;
// }

// const ListOfQuiz = () => {
//   const [quizzes, setQuizzes] = useState<Quiz[]>([]);
//   const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
//   const [showEditForm, setShowEditForm] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const quizzesPerPage = 5;

//   const totalPages = Math.ceil(quizzes.length / quizzesPerPage);

//   const truncateString = (str: string, length: number) => {
//     return str.length > length ? str.substring(0, length) + '...' : str;
//   };

//   useEffect(() => {
//     const fetchQuizzes = async () => {
//       try {
//         const coursesSnapshot = await getDocs(collection(db, 'courses'));
//         const allQuizzes: Quiz[] = [];

//         for (const courseDoc of coursesSnapshot.docs) {
//           const courseData = courseDoc.data();
//           const courseTitle = courseData?.courseTitle || 'Untitled Course';
//           const quizesSnapshot = await getDocs(collection(courseDoc.ref, 'quizes'));

//           quizesSnapshot.forEach(quizDoc => {
//             const quizData = quizDoc.data();
//             allQuizzes.push({
//               id: quizDoc.id,
//               courseTitle,
//               question: quizData.question || 'No question provided',
//               correctAnswer: quizData.correctAnswer || 'A',
//               isActive: quizData.isActive || false,
//               timeUpdated: quizData.timeUpdated || Timestamp.now(),
//               createdAt: quizData.createdAt || Timestamp.now(),
//             });
//           });
//         }

//         allQuizzes.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
//         setQuizzes(allQuizzes);
//       } catch (error) {
//         console.error('Error fetching quizzes:', error);
//       }
//     };

//     fetchQuizzes();
//   }, []);

//   const handleEdit = (quiz: Quiz) => {
//     setSelectedQuiz(quiz);
//     setShowEditForm(true);
//   };

//   const handleDelete = async (quizId: string) => {
//     try {
//       const courseDocSnapshot = await getDocs(collection(db, 'courses'));
//       let courseId = '';

//       for (const courseDoc of courseDocSnapshot.docs) {
//         const quizesSnapshot = await getDocs(collection(courseDoc.ref, 'quizes'));
//         const quizDoc = quizesSnapshot.docs.find(doc => doc.id === quizId);
//         if (quizDoc) {
//           courseId = courseDoc.id;
//           break;
//         }
//       }

//       if (courseId) {
//         const quizDocRef = doc(db, 'courses', courseId, 'quizes', quizId);
//         await deleteDoc(quizDocRef);
//         setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
//       } else {
//         console.error('Quiz not found in any course.');
//       }
//     } catch (error) {
//       console.error('Error deleting quiz:', error);
//     }
//   };

//   const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

//   const renderPageNumbers = () => {
//     const pageNumbers = [];
//     if (totalPages <= 7) {
//       for (let i = 1; i <= totalPages; i++) {
//         pageNumbers.push(
//           <Button
//             key={i}
//             onClick={() => paginate(i)}
//             className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110 
//                 ${currentPage === i
//                 ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
//                 : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
//             size="sm"
//           >
//             {i}
//           </Button>
//         );
//       }
//     } else {
//       // Always show first page
//       pageNumbers.push(
//         <Button
//           key={1}
//           onClick={() => paginate(1)}
//           className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110
//               ${currentPage === 1
//               ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
//               : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
//           size="sm"
//         >
//           1
//         </Button>
//       );

//       // Add dots if needed
//       if (currentPage > 3) {
//         pageNumbers.push(
//           <span key="dots1" className="mx-2 text-gray-500">...</span>
//         );
//       }

//       // Show current page and neighbors
//       for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
//         pageNumbers.push(
//           <Button
//             key={i}
//             onClick={() => paginate(i)}
//             className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105
//                 ${currentPage === i
//                 ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
//                 : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
//             size="sm"
//           >
//             {i}
//           </Button>
//         );
//       }

//       // Add dots if needed
//       if (currentPage < totalPages - 2) {
//         pageNumbers.push(
//           <span key="dots2" className="mx-2 text-gray-500">...</span>
//         );
//       }

//       // Always show last page
//       pageNumbers.push(
//         <Button
//           key={totalPages}
//           onClick={() => paginate(totalPages)}
//           className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105
//               ${currentPage === totalPages
//               ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg'
//               : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
//           size="sm"
//         >
//           {totalPages}
//         </Button>
//       );
//     }
//     return pageNumbers;
//   };

//   const indexOfLastQuiz = currentPage * quizzesPerPage;
//   const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
//   const currentQuizzes = quizzes.slice(indexOfFirstQuiz, indexOfLastQuiz);

//   return (
//     <div className="w-full p-10" >
//       {!showEditForm ? (
//         <Card style={{
//           boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
//           borderRadius: 15,
//           paddingTop: 20,
//           borderColor: "#fff"
//         }}>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Course Title:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Question:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Correct Answer:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Status:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Time Updated:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Created At:</TableHead>
//                   <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50", textAlign: "center" }}>Actions:</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {currentQuizzes.map((quiz) => (
//                   <TableRow key={quiz.id}>
//                     <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>{quiz.courseTitle}</TableCell>
//                     <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>{truncateString(quiz.question, 30)}</TableCell>
//                     <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>{truncateString(quiz.correctAnswer, 30)}</TableCell>
//                     <TableCell><span
//                       style={{
//                         fontFamily: "'Barlow', sans-serif",
//                         fontSize: 14,
//                         fontWeight: 300,
//                         color: "#2c3e50",
//                         padding: "4px 8px",
//                         borderRadius: "10px",
//                         backgroundColor: quiz.isActive ? "#28a745" : "#9CA3AF", // Green for active, red for inactive
//                         textAlign: "center",
//                       }}
//                     >
//                       {quiz.isActive ? 'Active' : 'Inactive'}
//                     </span></TableCell>
//                     <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>{quiz.timeUpdated.toDate().toLocaleString()}</TableCell>
//                     <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>{quiz.createdAt.toDate().toLocaleDateString()}</TableCell>
//                     <TableCell>
//                       <div className="flex space-x-2" style={{ alignItems: "center", justifyContent: "center" }}>
//                         <Button onClick={() => handleEdit(quiz)}
//                           size="sm" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderColor: "#2c3e50", borderRadius: 10 }}
//                           className="flex items-center gap-2 transition-all duration-300 hover:scale-105"><PencilIcon className="h-4 w-4" /> Edit</Button>
//                         <Button onClick={() => handleDelete(quiz)}
//                           size="sm" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderRadius: 10 }}
//                           className="flex items-center gap-2 bg-red-600 hover:bg-red-800 text-white transition-all duration-300 hover:scale-105"><TrashIcon className="h-4 w-4" /> Delete</Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//             <div className="flex justify-center items-center mt-6 gap-2">
//               <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="transition-all duration-300 ease-in-out transform hover:scale-110 
//             bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md 
//             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
//             font-barlow text-sm font-medium"
//                 size="sm">Previous</Button>
//               {renderPageNumbers()}
//               <Button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="transition-all duration-300 ease-in-out transform hover:scale-110 
//             bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md 
//             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
//             font-barlow text-sm font-medium"
//                 size="sm">Next</Button>
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <EditQuiz quiz={selectedQuiz!} onCancel={() => setShowEditForm(false)} />
//       )}
//     </div>
//   );
// };

// export default ListOfQuiz;


