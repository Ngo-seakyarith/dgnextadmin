"use client";

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Card, CardContent } from '@/app/components/ui/card';
import { Pencil, Trash2, User } from 'lucide-react';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/app/components/ui/button';
import { auth, db } from '@/app/lib/config/firebase';
import { deleteUser } from '@firebase/auth';
import Image from 'next/image';

interface Student {
  id: string;
  userImg?: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  degree?: string;
  career?: string;
  currentJob?: string;
}

const ListStudent = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5);

  const fetchStudents = async () => {
    try {
      const db = getFirestore();
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList: Student[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Student));
      setStudents(usersList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('Error: No user ID provided');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', id));
      const user = auth.currentUser;
      if (user && user.uid === id) {
        await deleteUser(user);
      }
      fetchStudents();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEdit = async (id: string) => {
    const newUsername = prompt('Enter new username:');
    if (newUsername) {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', id), { username: newUsername });
      fetchStudents();
    }
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers: React.ReactNode[] = [];
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
      pageNumbers.push(
        <Button
          key={1}
          onClick={() => paginate(1)}
          className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110 ${currentPage === 1 ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
          size="sm"
        >
          1
        </Button>
      );
      if (currentPage > 3) {
        pageNumbers.push(<span key="dots1" className="mx-2 text-gray-500">...</span>);
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => paginate(i)}
            className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === i ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
            size="sm"
          >
            {i}
          </Button>
        );
      }
      if (currentPage < totalPages - 2) {
        pageNumbers.push(<span key="dots2" className="mx-2 text-gray-500">...</span>);
      }
      pageNumbers.push(
        <Button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === totalPages ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
          size="sm"
        >
          {totalPages}
        </Button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="w-full p-10">
      <Card
        className="w-full p-10 rounded-xl"
        style={{
          boxShadow:
            '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
          borderRadius: 15,
          paddingTop: 20,
          borderColor: '#fff',
        }}
      >
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Profile:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Username:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Phone Number:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Email:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Degree:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Career:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Current Job:</TableHead>
                <TableHead style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>Action:</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="relative h-10 w-10">
                      {student.userImg && student.userImg.startsWith('http') ? (
                        <Image
                          src={student.userImg}
                          alt={student.username || 'User'}
                          className=" object-cover"
                          width={40}
                          height={40}
                          style={{borderRadius: 10, width: 45, height: 45}}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.username || 'N/A'}</TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.phoneNumber || 'N/A'}</TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.email || 'N/A'}</TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.degree || 'N/A'}</TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.career || 'N/A'}</TableCell>
                  <TableCell style={{ fontWeight: 400, fontSize: 14, color: '#6e737c' }}>{student.currentJob || 'N/A'}</TableCell>
                  <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: '#2c3e50' }}>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(student.id)}
                        style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15, backgroundColor: '#BBF7D0', color: '#15803D' }}
                        className="flex items-center gap-2 transition-all duration-200 hover:scale-105 font-barlow text-slate-800 border-slate-800"
                      >
                        <Pencil className="h-5 w-5 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(student.id)}
                        style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15 }}
                        className="flex items-center bg-red-600 hover:bg-red-800 text-white transition-all duration-200 hover:scale-105 font-barlow"
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
            <Button
              style={{ paddingBottom: 8, paddingTop: 8, paddingLeft: 15, paddingRight: 15, borderRadius: 15 }}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              size="sm"
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">{renderPageNumbers()}</div>
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

export default ListStudent;