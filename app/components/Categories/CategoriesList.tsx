import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { Pencil, Trash2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date | Timestamp | string;
  updatedAt: Date | Timestamp | string;
}

interface CategoriesListProps {
  categories?: Category[];
  isLoading: boolean;
}

const CategoriesList: React.FC<CategoriesListProps> = ({ categories = [], isLoading }) => {
  console.log('Received Categories in CategoriesList:', categories); // Debug log
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      alert('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    try {
      const categoryRef = doc(db, 'categories', editingCategory.id);
      await updateDoc(categoryRef, {
        name: editingCategory.name,
        isActive: editingCategory.isActive,
        updatedAt: new Date(),
      });

      setEditingCategory(null);
      alert('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = categories.length > 0 ? categories.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => paginate(i)}
            className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110 
              ${currentPage === i 
                ? 'bg-[#2c3e50] hover:bg-[#2c3e50] text-white shadow-lg' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'}`}
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

  const formatDate = (date: Date | Timestamp | string) => {
    let d: Date;
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else {
      d = date;
    }
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Singapore',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48">Loading...</div>;
  }

  if (!categories || categories.length === 0) {
    return <div className="text-gray-500 p-4">No categories found.</div>;
  }

  return (
    <div className="w-full p-10 rounded-xl" style={{
      boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
      borderRadius: 15,
      paddingTop: 20
    }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50"}}>Category Name:</TableHead>
            <TableHead style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50"}}>Status:</TableHead>
            <TableHead style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50"}}>Created At:</TableHead>
            <TableHead style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50"}}>Updated At:</TableHead>
            <TableHead style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50"}}>Actions:</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((category) => (
            <TableRow key={category.id} className="transition-colors hover:bg-gray-50">
              <TableCell style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50"}}>
                {editingCategory?.id === category.id ? (
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                ) : (
                  category.name
                )}
              </TableCell>
              <TableCell>
                {editingCategory?.id === category.id ? (
                  <Switch
                    checked={editingCategory.isActive}
                    onCheckedChange={() =>
                      setEditingCategory({ ...editingCategory, isActive: !editingCategory.isActive })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                      ${editingCategory.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition 
                        ${editingCategory.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </Switch>
                ) : (
                  <Badge className={category.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"} style={{borderRadius: 10}}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </TableCell>
              <TableCell style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50"}}>
                {formatDate(category.createdAt)}
              </TableCell>
              <TableCell style={{fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50"}}>
                {formatDate(category.updatedAt)}
              </TableCell>
              <TableCell className="space-x-2">
                {editingCategory?.id === category.id ? (
                  <>
                    <Button onClick={handleSaveEdit} className="bg-[#2c3e50] text-white hover:bg-[#1e2a37] transition-colors duration-300 hover:scale-105" style={{fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300}}>Save</Button>
                    <Button onClick={() => setEditingCategory(null)} className="bg-gray-400 text-white hover:bg-gray-500 transition-colors duration-300 hover:scale-105" style={{fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300}}>Cancel</Button>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(category)}
                      style={{fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderColor: "#2c3e50", borderRadius: 10}}
                      className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      style={{fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderRadius: 10}}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-800 text-white transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 gap-2">
        <Button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="transition-all duration-300 ease-in-out transform hover:scale-110 
            bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            font-barlow text-sm font-medium"
          size="sm"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {renderPageNumbers()}
        </div>

        <Button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="transition-all duration-300 ease-in-out transform hover:scale-110 
            bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            font-barlow text-sm font-medium"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default CategoriesList;