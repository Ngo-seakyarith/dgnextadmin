// components/BlogList.js
import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Input } from "@/app/components/ui/input";
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import successAnimation from '@/app/assets/animations/success.json';
import failureAnimation from '@/app/assets/animations/failed.json';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface BlogPost {
  id: string;
  featureImage: string;
  title: string;
  author: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define prop interfaces for modal components
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateFailureModalProps extends ModalProps {
  errorMessage: string;
}

interface DeleteConfirmationModalProps extends ModalProps {
  onConfirm: () => void;
}

// Modal Components
const UpdateSuccessModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex justify-center">
          <Lottie animationData={successAnimation} loop={false} style={{ width: 150, height: 150 }} />
        </div>
        <h2 className="text-xl font-semibold text-center text-[#2c3e50] mb-4" style={{ fontFamily: "'Barlow', sans-serif" }}>
          Update Successful!
        </h2>
        <p className="text-center text-gray-600 mb-6" style={{ fontFamily: "'Barlow', sans-serif" }}>
          Your blog post has been updated successfully.
        </p>
        <Button
          onClick={onClose}
          className="w-full bg-[#2c3e50] text-white hover:bg-[#1e2a37] transition-colors duration-300"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

const UpdateFailureModal: React.FC<UpdateFailureModalProps> = ({ isOpen, onClose, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex justify-center">
          <Lottie animationData={failureAnimation} loop={false} style={{ width: 150, height: 150 }} />
        </div>
        <h2 className="text-xl font-semibold text-center text-red-600 mb-4" style={{ fontFamily: "'Barlow', sans-serif" }}>
          Update Failed
        </h2>
        <p className="text-center text-gray-600 mb-6" style={{ fontFamily: "'Barlow', sans-serif" }}>
          {errorMessage}
        </p>
        <Button
          onClick={onClose}
          className="w-full bg-red-600 text-white hover:bg-red-800 transition-colors duration-300"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold text-center text-[#2c3e50] mb-4" style={{ fontFamily: "'Barlow', sans-serif" }}>
          Confirm Deletion
        </h2>
        <p className="text-center text-gray-600 mb-6" style={{ fontFamily: "'Barlow', sans-serif" }}>
          Are you sure you want to delete this blog post? This action cannot be undone.
        </p>
        <div className="flex" style={{ justifyContent: "center" }}>
          <Button
            onClick={onClose}
            className="bg-gray-400 text-white hover:bg-gray-500 transition-colors duration-300 m-1"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-800 transition-colors duration-300 m-1"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string>('');

  useEffect(() => {
    if (!db) {
      setError('Firebase database connection not initialized');
      setLoading(false);
      return;
    }

    const postsRef = collection(db, 'blogPosts');
    const q = query(postsRef);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const postsData: BlogPost[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            const updatedAt = data.updatedAt?.toDate() || new Date();

            return {
              id: doc.id,
              featureImage: data.featureImage || '',
              title: data.title || '',
              author: data.author || '',
              tags: data.tags || [],
              createdAt,
              updatedAt,
            };
          });
          setPosts(postsData);
          setError(null);
        } catch (err) {
          console.error('Error processing posts data:', err);
          setError(`Error processing posts: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setError(`Database error: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string) => {
    setDeletePostId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletePostId) return;

    try {
      await deleteDoc(doc(db, 'blogPosts', deletePostId));
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting post:', error);
      setFailureMessage('Failed to delete post. Please try again.');
      setShowDeleteModal(false);
      setShowFailureModal(true);
    } finally {
      setDeletePostId(null);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const postRef = doc(db, 'blogPosts', editingPost.id);
      await updateDoc(postRef, {
        featureImage: editingPost.featureImage,
        title: editingPost.title,
        author: editingPost.author,
        tags: editingPost.tags,
        updatedAt: new Date(),
      });
      setEditingPost(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating post:', error);
      setFailureMessage('Failed to update post. Please try again.');
      setShowFailureModal(true);
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = posts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(posts.length / itemsPerPage);

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

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Singapore',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="w-full p-10 rounded-xl mt-10" style={{
      boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
      borderRadius: 15,
      paddingTop: 20
    }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Image</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Title</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Author</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Tags</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Created At</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Updated At</TableHead>
            <TableHead style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((post) => (
            <TableRow key={post.id} className="transition-colors hover:bg-gray-50">
              <TableCell>
                {editingPost?.id === post.id ? (
                  <Input
                    value={editingPost.featureImage}
                    onChange={(e) => setEditingPost({ ...editingPost, featureImage: e.target.value })}
                  />
                ) : (
                  post.featureImage && (
                    <div className="relative w-16 h-16">
                      {post.featureImage.startsWith('blob:') ? (
                        <Image
                          src={post.featureImage}
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          className="rounded-md"
                        />
                      ) : (
                        <Image
                          src={post.featureImage}
                          alt={post.title}
                          width={64}
                          height={64}
                          style={{ objectFit: 'cover' }}
                          className="rounded-md"
                        />
                      )}
                    </div>
                  )
                )}
              </TableCell>
              <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>
                {editingPost?.id === post.id ? (
                  <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  />
                ) : (
                  post.title
                )}
              </TableCell>
              <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>
                {editingPost?.id === post.id ? (
                  <Input
                    value={editingPost.author}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  />
                ) : (
                  post.author
                )}
              </TableCell>
              <TableCell>
                {editingPost?.id === post.id ? (
                  <Input
                    value={editingPost.tags.join(', ')}
                    onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(', ') })}
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} className="bg-blue-500 text-white" style={{ borderRadius: 10 }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>
                {formatDate(post.createdAt)}
              </TableCell>
              <TableCell style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>
                {formatDate(post.updatedAt)}
              </TableCell>
              <TableCell className="space-x-2">
                {editingPost?.id === post.id ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      className="bg-[#2c3e50] text-white hover:bg-[#1e2a37] transition-colors duration-300 hover:scale-105"
                      style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300 }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-400 text-white hover:bg-gray-500 transition-colors duration-300 hover:scale-105"
                      style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300 }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(post)}
                      style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderColor: "#2c3e50", borderRadius: 10 }}
                      className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 300, borderRadius: 10 }}
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

      {/* Modals */}
      <UpdateSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
      <UpdateFailureModal 
        isOpen={showFailureModal} 
        onClose={() => setShowFailureModal(false)} 
        errorMessage={failureMessage}
      />
      <DeleteConfirmationModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default BlogList;