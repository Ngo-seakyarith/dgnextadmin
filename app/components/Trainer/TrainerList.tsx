"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  BookOpen,
  Users,
  Calendar,
  Plus,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  specializations: string[];
  experience: string;
  location: string;
  profileImage: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  certifications: string[];
  languages: string[];
  hourlyRate: string;
  availability: string;
  joinedDate: string;
  status: 'active' | 'inactive' | 'pending';
}

interface AlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'danger' | 'warning';
}

interface TrainerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
}

const Alert: React.FC<AlertProps> = ({ type, message, isVisible, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg border flex items-center space-x-3 shadow-lg ${colors[type]}`}
        >
          {icons[type]}
          <span className="font-medium">{message}</span>
          <button onClick={onClose} className="ml-4 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, type }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
              {type === 'danger' ? (
                <Trash2 className="h-8 w-8 text-red-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">{title}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{message}</p>
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors ${type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const TrainerDetailModal: React.FC<TrainerDetailModalProps> = ({ isOpen, onClose, trainer }) => {
  if (!trainer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20">
                    {trainer.profileImage ? (
                      <Image src={trainer.profileImage} alt={`${trainer.firstName} ${trainer.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{trainer.firstName} {trainer.lastName}</h2>
                    <p className="text-blue-100">{trainer.specializations.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                      <Mail className="w-5 h-5" />
                      <span>{trainer.email}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                      <Phone className="w-5 h-5" />
                      <span>{trainer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-5 h-5" />
                      <span>{trainer.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{trainer.rating}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Students</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{trainer.totalStudents}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Courses</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{trainer.totalCourses}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Experience</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">{trainer.experience}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Biography</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{trainer.bio}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {trainer.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {trainer.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Professional Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Hourly Rate:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{trainer.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Availability:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{trainer.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trainer.status === 'active' ? 'bg-green-100 text-green-800' :
                          trainer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ListTrainer: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string, isVisible: boolean }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  const itemsPerPage = 10;

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message, isVisible: true });
    setTimeout(() => setAlert(prev => ({ ...prev, isVisible: false })), 5000);
  };

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTrainers: Trainer[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '+1 (555) 123-4567',
          bio: 'Experienced web development instructor with 8+ years in the industry. Passionate about teaching modern JavaScript frameworks and best practices.',
          specializations: ['JavaScript', 'React', 'Node.js', 'Web Development'],
          experience: '6-10',
          location: 'San Francisco, CA',
          profileImage: '',
          rating: 4.8,
          totalStudents: 1250,
          totalCourses: 12,
          socialLinks: {
            linkedin: 'https://linkedin.com/in/johnsmith',
            website: 'https://johnsmith.dev'
          },
          certifications: ['AWS Certified Developer', 'React Certified Developer'],
          languages: ['English', 'Spanish'],
          hourlyRate: '$85/hour',
          availability: 'Full-time',
          joinedDate: '2023-01-15',
          status: 'active'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1 (555) 987-6543',
          bio: 'Data Science expert with PhD in Statistics. Specializes in machine learning and AI applications in business contexts.',
          specializations: ['Data Science', 'Machine Learning', 'Python', 'Statistics'],
          experience: '10+',
          location: 'New York, NY',
          profileImage: '',
          rating: 4.9,
          totalStudents: 890,
          totalCourses: 8,
          socialLinks: {
            linkedin: 'https://linkedin.com/in/sarahjohnson'
          },
          certifications: ['Google Cloud ML Engineer', 'TensorFlow Developer'],
          languages: ['English', 'French'],
          hourlyRate: '$120/hour',
          availability: 'Part-time',
          joinedDate: '2023-03-22',
          status: 'active'
        },
        {
          id: '3',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@example.com',
          phone: '+1 (555) 456-7890',
          bio: 'Mobile app development specialist with expertise in both iOS and Android platforms. Former senior developer at major tech companies.',
          specializations: ['iOS Development', 'Android', 'Swift', 'Kotlin'],
          experience: '6-10',
          location: 'Seattle, WA',
          profileImage: '',
          rating: 4.7,
          totalStudents: 650,
          totalCourses: 6,
          socialLinks: {
            linkedin: 'https://linkedin.com/in/michaelchen',
            website: 'https://mchen.dev'
          },
          certifications: ['Apple Certified iOS Developer', 'Google Android Developer'],
          languages: ['English', 'Mandarin'],
          hourlyRate: '$95/hour',
          availability: 'Freelance',
          joinedDate: '2023-02-10',
          status: 'pending'
        }
      ];

      setTrainers(mockTrainers);
      setLoading(false);
    };

    fetchTrainers();
  }, []);

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch =
      trainer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || trainer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrainers = filteredTrainers.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTrainers(prev => prev.filter(trainer => trainer.id !== id));
      showAlert('success', 'Trainer deleted successfully');
      setShowDeleteModal(false);
      setTrainerToDelete(null);
    } catch {
      showAlert('error', 'Failed to delete trainer');
    }
  };

  const handleView = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading trainers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <Alert {...alert} onClose={() => setAlert(prev => ({ ...prev, isVisible: false }))} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Trainers</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your training team</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive" | "pending")}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Trainers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {paginatedTrainers.map((trainer) => (
            <motion.div
              key={trainer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trainer.status)}`}>
                    {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{trainer.hourlyRate}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(trainer)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center text-sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setTrainerToDelete(trainer.id);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {paginatedTrainers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No trainers found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first trainer.'
              }
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Trainer
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTrainers.length)} of {filteredTrainers.length} trainers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TrainerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        trainer={selectedTrainer}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTrainerToDelete(null);
        }}
        onConfirm={() => trainerToDelete && handleDelete(trainerToDelete)}
        title="Delete Trainer"
        message="Are you sure you want to delete this trainer? This action cannot be undone."
        type="danger"
      />
    </div>
  );
};

export default ListTrainer;
