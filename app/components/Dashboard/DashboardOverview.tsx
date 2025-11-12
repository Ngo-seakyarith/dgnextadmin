import React, { useEffect, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { collection, getDocs } from '@firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { Button } from '../ui/button';

// Import images statically
import moneyReceived from '@/app/assets/png/money-received.png';
import students from '@/app/assets/png/students.png';
import digitalLibrary from '@/app/assets/png/digital-library.png';
import quiz from '@/app/assets/png/quiz.png';
import certificate from '@/app/assets/png/certificate.png';
import healthy from '@/app/assets/png/healthy.png';
import processingTime from '@/app/assets/png/processing-time.png';
import survey from '@/app/assets/png/survey.png';
import enroll from '@/app/assets/png/enroll.png';

// Define interfaces
interface Enrollment {
  username: string;
  courseTitle: string;
  instructor: string;
  price: number | string;
  enrolledAt: string;
}

interface FirestoreEnrollment {
  courseTitle: string;
  instructor: string;
  price: number | string;
  enrolledAt: string;
}

const DashboardOverview = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificateCount, setCertificateCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const userProgressRef = collection(db, 'userProgress');
        const userProgressSnapshot = await getDocs(userProgressRef);
        let totalCertificates = 0;

        for (const userDoc of userProgressSnapshot.docs) {
          const certificateRef = collection(userDoc.ref, 'certificate');
          const certificateSnapshot = await getDocs(certificateRef);
          totalCertificates += certificateSnapshot.size;
        }

        setCertificateCount(totalCertificates);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      }
    };

    fetchCertificates();
  }, []);

  useEffect(() => {
    const fetchTotalStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        let total = 0;
        querySnapshot.forEach((doc) => {
          total += doc.data().total_students || 0;
        });
        setTotalStudents(total);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchTotalStudents();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        setCoursesCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesRef);
        let totalQuizzes = 0;

        for (const doc of courseSnapshot.docs) {
          const quizesRef = collection(doc.ref, 'quizes');
          const quizSnapshot = await getDocs(quizesRef);
          totalQuizzes += quizSnapshot.size;
        }

        setQuizCount(totalQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    };

    fetchQuizzes();
  }, []);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const enrollmentData: Enrollment[] = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data() as { username?: string; enrollment?: FirestoreEnrollment[] };
          if (userData.enrollment && Array.isArray(userData.enrollment)) {
            userData.enrollment.forEach((enrollment) => {
              const enrolledAtInCambodia = DateTime.fromISO(enrollment.enrolledAt)
                .setZone('Asia/Phnom_Penh')
                .toFormat('yyyy-MM-dd HH:mm:ss');

              enrollmentData.push({
                username: userData.username || 'Unknown',
                courseTitle: enrollment.courseTitle || 'Unknown',
                instructor: enrollment.instructor || 'Unknown',
                price: enrollment.price || 0,
                enrolledAt: enrolledAtInCambodia,
              });
            });
          }
        });

        setEnrollments(enrollmentData);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      }
    };

    fetchEnrollments();
  }, []);

  // Calculate the total pages
  const totalPages = Math.ceil(enrollments.length / itemsPerPage);

  // Get the current page's transactions
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = enrollments.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Render page numbers
  const renderPageNumbers = (): React.JSX.Element[] => {
    const pageNumbers: React.JSX.Element[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => paginate(i)}
            style={{paddingTop: 8, paddingBottom: 8, paddingRight: 15, paddingLeft: 15, borderRadius: 15}}
            className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 
              ${currentPage === i 
                ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            size="sm"
          >
            {i}
          </Button>
        );
      }
    } else {
      pageNumbers.push(
        <Button
          key={1}
          onClick={() => paginate(1)}
          style={{paddingTop: 10, paddingBottom: 10, paddingRight: 20, paddingLeft: 20, borderRadius: 10}}
          className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105
            ${currentPage === 1 
              ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          size="sm"
        >
          1
        </Button>
      );

      if (currentPage > 3) {
        pageNumbers.push(<span key="dots1" className="mx-2 transition-opacity duration-300">...</span>);
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
        pageNumbers.push(<span key="dots2" className="mx-2 transition-opacity duration-300">...</span>);
      }

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

  // Placeholder data for BarChart
  const chartData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 200 },
    { name: 'Mar', value: 150 },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Number */}
        <div
          className="bg-white p-6"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <h1 style={{ paddingBottom: 15, textAlign: 'center', color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
            TOTAL NUMBER
          </h1>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={moneyReceived} width={50} height={50} alt="Money received icon" />
              <h3 style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Transactions</h3>
              <p className=" mt-1" style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>$12,426</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={students} width={50} height={50} alt="Students icon" />
              <h3 style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Students</h3>
              <p className=" mt-1" style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>{totalStudents}</p>
            </div>
          </div>
        </div>

        {/* Content Number */}
        <div
          className="bg-white p-6 rounded-xl"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <h1 style={{ paddingBottom: 15, textAlign: 'center', color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
            CONTENT NUMBER
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={digitalLibrary} width={50} height={50} alt="Digital library icon" />
              <span style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Courses</span>
              <span style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>{coursesCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={quiz} width={50} height={50} alt="Quiz icon" />
              <span style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Quizzes</span>
              <span style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>{quizCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={certificate} width={50} height={50} alt="Certificate icon" />
              <span style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Certificates</span>
              <span style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>{certificateCount}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-xl"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <h1 style={{ paddingBottom: 15, textAlign: 'center', color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
            ENROLLMENTS
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Image src={enroll} width={50} height={50} alt="Enroll icon" />
              <span style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>Enrolled</span>
              <span style={{color: '#2c3e50', fontSize: 16, fontWeight: 700}}>{enrollments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completed */}
        <div
          className="bg-white p-6 rounded-xl"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Image src={healthy} width={25} height={25} alt="Healthy icon" />
              <h3 className="text-gray-700 font-medium" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
                COMPLETED:
              </h3>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>486</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} >
                <Bar dataKey="value" fill="#53B458" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* In Progress */}
        <div
          className="bg-white p-6 rounded-xl"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Image src={processingTime} width={25} height={25} alt="Processing time icon" />
              <h3 className="text-gray-700 font-medium" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
                IN PROGRESS:
              </h3>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>284</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value" fill="#FFDF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Not Started */}
        <div
          className="bg-white p-6 rounded-xl"
          style={{
            boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
            borderRadius: 15,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Image src={survey} width={35} height={35} alt="Survey icon" />
              <h3 className="text-gray-700 font-medium" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>
                NOT STARTED:
              </h3>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#2c3e50', fontSize: 16, fontWeight: 700 }}>168</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value" fill="#FB4455" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4 */}
      <div
        className="bg-white p-6 rounded-xl"
        style={{
          boxShadow: '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
          borderRadius: 15,
        }}
      >
        <div className="p-6">
          <h3
            className="text-gray-700 font-medium mb-4"
            style={{ textAlign: 'center', color: '#2c3e50', fontSize: 16, fontWeight: 700, marginTop: -10 }}
          >
            LATEST TRANSACTIONS
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-[#2c3e50]" style={{ fontSize: 15, fontWeight: 600 }}>
                    Student Name:
                  </th>
                  <th className="px-6 py-3 text-left text-[#2c3e50]" style={{ fontSize: 15, fontWeight: 600 }}>
                    Course Title:
                  </th>
                  <th className="px-6 py-3 text-left text-[#2c3e50]" style={{ fontSize: 15, fontWeight: 600 }}>
                    Instructor:
                  </th>
                  <th className="px-6 py-3 text-left text-[#2c3e50]" style={{ fontSize: 15, fontWeight: 600 }}>
                    Price:
                  </th>
                  <th className="px-6 py-3 text-left text-[#2c3e50]" style={{ fontSize: 15, fontWeight: 600 }}>
                    Created At:
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap" style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{transaction.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{transaction.courseTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{transaction.instructor}</td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{transaction.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{fontWeight: 400, fontSize: 14, color: "#6e737c"}}>{transaction.enrolledAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center mt-6 gap-2">
            <Button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{paddingTop: 8, paddingBottom: 8, paddingRight: 15, paddingLeft: 15, borderRadius: 15}}
              className="transition-all duration-300 ease-in-out transform hover:scale-110 
                bg-gray-200 hover:bg-gray-300 text-gray-700 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                font-barlow text-sm font-medium"
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">{renderPageNumbers()}</div>
            <Button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{paddingTop: 8, paddingBottom: 8, paddingRight: 15, paddingLeft: 15, borderRadius: 15}}
              className="transition-all duration-300 ease-in-out transform hover:scale-110 
                bg-gray-200 hover:bg-gray-300 text-gray-700 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                font-barlow text-sm font-medium"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;