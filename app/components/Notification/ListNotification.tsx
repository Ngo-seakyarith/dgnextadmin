import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { collection, query, orderBy, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Button } from '@/app/components/ui/button'; // Assuming you have a Button component
import Image from 'next/image';

interface Notification {
  id: string;
  title: string;
  text: string;
  thumbnailUrl: string;
  createdAt: Timestamp;
  isNew: boolean;
}

const ListNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Last 7 days' | 'Last 1 month'>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notificationsPerPage] = useState(10);

  const filterOptions = ['All', 'Last 7 days', 'Last 1 month'];

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
      // Always show first page
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

      // Add dots if needed
      if (currentPage > 3) {
        pageNumbers.push(
          <span key="dots1" className="mx-2 text-gray-500">...</span>
        );
      }

      // Show current page and neighbors
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

      // Add dots if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push(
          <span key="dots2" className="mx-2 text-gray-500">...</span>
        );
      }

      // Always show last page
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

  useEffect(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    if (filterType === 'Last 7 days') {
      q = query(q, where('createdAt', '>=', sevenDaysAgo));
    } else if (filterType === 'Last 1 month') {
      q = query(q, where('createdAt', '>=', oneMonthAgo));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationList: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationList.push({
          id: doc.id,
          title: data.title,
          text: data.text,
          thumbnailUrl: data.thumbnailUrl,
          createdAt: data.createdAt,
          isNew: data.isNew,
        });
      });

      // Update notifications and calculate total pages
      const totalNotifications = notificationList.length;
      setTotalPages(Math.ceil(totalNotifications / notificationsPerPage));

      // Slice notifications for current page
      const currentNotifications = notificationList.slice(
        (currentPage - 1) * notificationsPerPage,
        currentPage * notificationsPerPage
      );

      setNotifications(currentNotifications);
    });

    return () => unsubscribe();
  }, [filterType, currentPage, notificationsPerPage]);

  const handleImageError = (notificationId: string) => {
    setImageError(prev => ({
      ...prev,
      [notificationId]: true
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-10" style={{
      boxShadow: "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
      borderRadius: 15,
      paddingTop: 40
    }}>
      <div className="relative mb-4" >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-between w-48 px-4 py-2 bg-white border"
          style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontSize: 15, fontWeight: 400 }}
        >
          <span>{filterType}</span>
          {isDropdownOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 w-48 mt-1 bg-white border" style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
            {filterOptions.map((option) => (
              <button
                key={option}
                style={{ borderRadius: 15 }}
                className="w-full px-4 py-2 text-left hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]"
                onClick={() => {
                  setFilterType(option as typeof filterType);
                  setIsDropdownOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center mb-2 px-4 py-2 bg-gray-100" style={{ borderRadius: 15 }}>
        <div className="w-12"></div>
        <div className="flex items-center space-x-0 flex-1 font-medium">
          <span style={{ fontWeight: 600, fontSize: 16, color: "#2c3e50" }}>Message</span>
        </div>
        <div className="w-32 text-right " style={{ fontWeight: 600, fontSize: 16, color: "#2c3e50" }}>Date</div>
      </div>

      <div className="space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center px-3 py-1 bg-white border hover:bg-gray-50"
              style={{ borderRadius: 15 }}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {!imageError[notification.id] && notification.thumbnailUrl ? (
                  <Image
                    src={notification.thumbnailUrl}
                    alt="Notification thumbnail"
                    width={40}
                    height={40}
                    className="object-cover rounded-[10px]"
                    onError={() => handleImageError(notification.id)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">N/A</span>
                  </div>
                )}
              </div>

              <div className="flex-1 ml-2">
                <h3 className="font-medium">{notification.title}</h3>
                <p className="text-sm text-gray-600">{notification.text}</p>
              </div>
              <div className="w-32 text-right text-sm text-gray-500 mr-3">
                {formatDate(notification.createdAt)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No notifications available.</p>
        )}
      </div>

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
    </div>
  );
};

export default ListNotification;
