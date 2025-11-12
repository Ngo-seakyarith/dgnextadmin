import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Search, Filter, Settings, Edit2, Trash2, PlusCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/app/lib/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Switch } from '@radix-ui/react-switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import Modal from '../ui/Modals';
import dynamic from 'next/dynamic';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import successAnimation from '@/app/assets/animations/success.json';
import failureAnimation from '@/app/assets/animations/failed.json';
import trashAnimation from "@/app/assets/animations/trash.json"
import ModalEdit from '../ui/ModalEdit';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

/* ---------- TYPE DEFINITIONS ---------- */
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Module {
  title: string;
  lessons: { title: string; videoUrl: string; description: string }[];
  quiz: { questions: Question[] };
  isExpanded: boolean;
}

interface CourseData {
  id?: string;
  courseTitle: string;
  description: { headline: string; text?: string; point?: string[] }[];
  duration: string;
  instructor: string;
  level: string;
  language: string;
  learningPoints: { title: string; details: string }[];
  modules: { [key: string]: Module };
  profileImg: string;
  thumbnail: string;
  price: string;
  total_students: number;
  isActive: boolean;
  finalExam: { questions: Question[] };
  keyTopics: string[];
  categories: string;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface Category {
  label: string;
  value: string;
}

interface CustomSwitchProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
}

interface QuizFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSave: (questions: Question[]) => void;
  title: string;
}


/* ---------- HELPER COMPONENTS ---------- */
const CustomSwitch: React.FC<CustomSwitchProps> = ({ isActive, onToggle }) => (
  <Switch
    checked={isActive}
    onCheckedChange={onToggle}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isActive ? "bg-green-500" : "bg-gray-400"}`}
  >
    <span
      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 ${isActive ? "translate-x-6" : "translate-x-0"}`}
    />
  </Switch>
);

const QuizFormModal: React.FC<QuizFormModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSave,
  title,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tempQuestions, setTempQuestions] = useState<Question[]>(questions);

  useEffect(() => {
    setTempQuestions(questions);
    setCurrentStep(0);
  }, [questions]);

  const totalSteps = tempQuestions.length;
  const progress = totalSteps ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const handleChange = (
    field: keyof Omit<Question, 'options'> | 'option',
    value: string,
    optionIndex?: number
  ) => {
    setTempQuestions((prev) => {
      const updated = [...prev];
      if (!updated[currentStep]) return prev;

      if (field === 'option' && optionIndex !== undefined) {
        updated[currentStep].options[optionIndex] = value;
      } else if (field === 'question' || field === 'correctAnswer') {
        updated[currentStep][field] = value;
      }
      return updated;
    });
  };

  const next = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };
  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const save = () => {
    onSave(tempQuestions);
    onClose();
  };

  if (!tempQuestions[currentStep]) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 px-4">
        <h3 className="flex items-center gap-2 font-bold text-lg">
          <Edit2 size={18} />
          {title}
        </h3>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <Label>Question</Label>
          <Input
            value={tempQuestions[currentStep]?.question || ''}
            onChange={(e) => handleChange('question', e.target.value)}
            placeholder="Type question"
            className="mt-1"
            style={{ borderRadius: 15 }}
          />
        </div>

        {['A', 'B', 'C', 'D'].map((opt, i) => (
          <div key={i}>
            <Label>Option {opt}</Label>
            <Input
              value={tempQuestions[currentStep]?.options[i] || ''}
              onChange={(e) => handleChange('option', e.target.value, i)}
              placeholder={`Option ${opt}`}
              className="mt-1"
              style={{ borderRadius: 15 }}
            />
          </div>
        ))}

        <div>
          <Label>Correct Answer</Label>
          <Select
            value={tempQuestions[currentStep]?.correctAnswer || ''}
            onValueChange={(v) => handleChange('correctAnswer', v)}
          >
            <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 5 }}>
              <SelectValue placeholder="Select correct answer" />
            </SelectTrigger>
            <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
              {['A', 'B', 'C', 'D'].map((v) => (
                <SelectItem key={v} value={v} className="hover:bg-[#F97E38] hover:text-[#fff]" style={{ borderRadius: 13 }}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between mt-4">
          <Button
            type="button"
            onClick={prev}
            disabled={currentStep === 0}
            className="bg-gray-500 text-white"
            style={{ borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={currentStep === totalSteps - 1 ? save : next}
            className="bg-[#F97E38] text-white"
            style={{ borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
          >
            {currentStep === totalSteps - 1 ? 'Save' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ---------- MAIN COMPONENT ---------- */
const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    courseTitle: true,
    students: true,
    price: true,
    status: true,
    dateCreated: true,
    category: true,
  });
  const [editCourseData, setEditCourseData] = useState<CourseData | null>(null);
  const [profileImgFile, setProfileImgFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [profileImgPreview, setProfileImgPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isFinalExamModalOpen, setIsFinalExamModalOpen] = useState(false);
  const [currentModuleKey, setCurrentModuleKey] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 5;

  /* ---------- pagination helpers ---------- */
  const indexOfLast = currentPage * coursesPerPage;
  const indexOfFirst = indexOfLast - coursesPerPage;
  const paginatedCourses = filteredCourses.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers: React.ReactNode[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => paginate(i)}
            size="sm"
            style={{ padding: '8px 15px', borderRadius: 15 }}
            className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === i
              ? 'bg-[#2c3e50] text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
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
          size="sm"
          className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-110 ${currentPage === 1
            ? 'bg-[#2c3e50] text-white shadow-lg'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'
            }`}
        >
          1
        </Button>
      );
      if (currentPage > 3)
        pageNumbers.push(
          <span key="dots1" className="mx-2 text-gray-500">
            ...
          </span>
        );
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => paginate(i)}
            size="sm"
            className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === i
              ? 'bg-[#2c3e50] text-white shadow-lg'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'
              }`}
          >
            {i}
          </Button>
        );
      }
      if (currentPage < totalPages - 2)
        pageNumbers.push(
          <span key="dots2" className="mx-2 text-gray-500">
            ...
          </span>
        );
      pageNumbers.push(
        <Button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          size="sm"
          className={`mx-1 transition-all duration-300 ease-in-out transform hover:scale-105 ${currentPage === totalPages
            ? 'bg-[#2c3e50] text-white shadow-lg'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md'
            }`}
        >
          {totalPages}
        </Button>
      );
    }
    return pageNumbers;
  };

  // Fetch courses and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          learningPoints: doc.data().learningPoints || [],
          keyTopics: doc.data().keyTopics || [],
          description: Array.isArray(doc.data().description)
            ? doc.data().description
            : [{ headline: '', text: '', point: [] }],
          modules: doc.data().modules || {},
          finalExam: doc.data().finalExam || { questions: [] },
        })) as CourseData[];
        setCourses(coursesData);
        setFilteredCourses(coursesData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          label: doc.data().name as string,
          value: doc.data().name as string,
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to fetch courses data');
        setIsErrorModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search courses
  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.categories.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.categories === selectedCategory);
    }

    if (selectedPaymentType && selectedPaymentType !== 'all') {
      if (selectedPaymentType === 'free') {
        filtered = filtered.filter(course => course.price === 'Free');
      } else if (selectedPaymentType === 'paid') {
        filtered = filtered.filter(course => course.price !== 'Free');
      }
    }

    if (selectedVisibility && selectedVisibility !== 'all') {
      if (selectedVisibility === 'active') {
        filtered = filtered.filter(course => course.isActive);
      } else if (selectedVisibility === 'inactive') {
        filtered = filtered.filter(course => !course.isActive);
      }
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedCategory, selectedPaymentType, selectedVisibility]);

  const handleEdit = (course: CourseData) => {
    console.log('Course description:', course.description, 'Type:', typeof course.description, 'Is array:', Array.isArray(course.description));
    setEditCourseData({
      ...course,
      learningPoints: course.learningPoints || [],
      keyTopics: course.keyTopics || [],
      description: Array.isArray(course.description)
        ? course.description
        : [{ headline: '', text: '', point: [] }],
      modules: course.modules || {},
      finalExam: course.finalExam || { questions: [] },
    });
    setSelectedCategory(course.categories || '');
    setIsFree(course.price === 'Free');
    setProfileImgPreview(course.profileImg || null);
    setThumbnailPreview(course.thumbnail || null);
    setIsEditModalOpen(true);
  };

  const handleDelete = (course: CourseData) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete?.id) return;

    try {
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setIsSuccessModalOpen(true);
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      setErrorMessage('Failed to delete course');
      setIsErrorModalOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImg' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (e.g., PNG, JPEG).');
        return;
      }
      if (field === 'profileImg') {
        setProfileImgFile(file);
        setProfileImgPreview(URL.createObjectURL(file));
      } else {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
      }
    }
  };

  const clearImage = (field: 'profileImg' | 'thumbnail') => {
    if (field === 'profileImg') {
      setProfileImgFile(null);
      setProfileImgPreview(null);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const handleToggleActive = (checked: boolean) => {
    if (editCourseData) {
      setEditCourseData({ ...editCourseData, isActive: checked });
    }
  };

  const handleDescriptionChange = (index: number, field: 'headline' | 'text' | 'point', value: string) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedDescriptions = [...(prevState?.description || [])];
      if (field === 'point') {
        const points = value
          .split('•')
          .map((item) => item.trim())
          .filter((item) => item !== '');
        updatedDescriptions[index] = { ...updatedDescriptions[index], point: points };
      } else {
        updatedDescriptions[index] = { ...updatedDescriptions[index], [field]: value };
      }
      return { ...prevState, description: updatedDescriptions } as CourseData;
    });
  };

  const addDescription = () => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      description: [...(prevState?.description || []), { headline: '', text: undefined, point: undefined }],
    } as CourseData));
  };

  const removeDescription = (index: number) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      description: (prevState?.description || []).filter((_, i) => i !== index),
    } as CourseData));
  };

  const handleLearningPointChange = (
    index: number,
    value: { title?: string; details?: string }
  ) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedPoints = [...(prevState?.learningPoints || [])];
      updatedPoints[index] = { ...updatedPoints[index], ...value };
      return { ...prevState, learningPoints: updatedPoints } as CourseData;
    });
  };

  const addLearningPoint = () => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      learningPoints: [...(prevState?.learningPoints || []), { title: '', details: '' }],
    } as CourseData));
  };

  const removeLearningPoint = (index: number) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      learningPoints: (prevState?.learningPoints || []).filter((_, i) => i !== index),
    } as CourseData));
  };

  const handleModuleChange = (moduleKey: string, value: string) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState?.modules,
        [moduleKey]: {
          ...prevState?.modules[moduleKey],
          title: value,
          lessons: prevState?.modules[moduleKey]?.lessons || [],
          quiz: prevState?.modules[moduleKey]?.quiz || {
            questions: Array(5).fill(null).map(() => ({
              question: '',
              options: ['', '', '', ''],
              correctAnswer: '',
            })),
          },
          isExpanded: prevState?.modules[moduleKey]?.isExpanded ?? true,
        },
      },
    } as CourseData));
  };

  const handleLessonChange = (
    moduleKey: string,
    lessonIndex: number,
    field: string,
    value: string
  ) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedModules = { ...prevState?.modules };
      if (!updatedModules[moduleKey].lessons) {
        updatedModules[moduleKey].lessons = [];
      }
      if (!updatedModules[moduleKey].lessons[lessonIndex]) {
        updatedModules[moduleKey].lessons[lessonIndex] = {
          title: '',
          videoUrl: '',
          description: '',
        };
      }
      updatedModules[moduleKey].lessons[lessonIndex] = {
        ...updatedModules[moduleKey].lessons[lessonIndex],
        [field]: value,
      };
      return {
        ...prevState,
        modules: updatedModules,
      } as CourseData;
    });
  };

  const addModule = () => {
    if (!editCourseData) return;
    const moduleKey = `module${Object.keys(editCourseData.modules || {}).length + 1}`;
    setEditCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState?.modules,
        [moduleKey]: {
          title: '',
          lessons: [],
          quiz: {
            questions: Array(5).fill(null).map(() => ({
              question: '',
              options: ['', '', '', ''],
              correctAnswer: '',
            })),
          },
          isExpanded: true,
        },
      },
    } as CourseData));
  };

  const removeModule = (moduleKey: string) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedModules = { ...prevState?.modules };
      delete updatedModules[moduleKey];
      return {
        ...prevState,
        modules: updatedModules,
      } as CourseData;
    });
  };

  const addLesson = useCallback((moduleKey: string) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedModules = { ...prevState?.modules };
      const currentLessons = updatedModules[moduleKey].lessons || [];
      const newLesson = { title: '', videoUrl: '', description: '' };
      if (
        currentLessons.length > 0 &&
        JSON.stringify(currentLessons[currentLessons.length - 1]) === JSON.stringify(newLesson)
      ) {
        return prevState;
      }
      updatedModules[moduleKey].lessons = [...currentLessons, newLesson];
      return {
        ...prevState,
        modules: updatedModules,
      } as CourseData;
    });
  }, [editCourseData]); // Add editCourseData to dependency array

  const removeLesson = (moduleKey: string, lessonIndex: number) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => {
      const updatedModules = { ...prevState?.modules };
      updatedModules[moduleKey].lessons = updatedModules[moduleKey].lessons.filter(
        (_, index) => index !== lessonIndex
      );
      return {
        ...prevState,
        modules: updatedModules,
      } as CourseData;
    });
  };

  const toggleModuleExpanded = (moduleKey: string) => {
    if (!editCourseData) return;
    setEditCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState?.modules,
        [moduleKey]: {
          ...prevState?.modules[moduleKey],
          isExpanded: !prevState?.modules[moduleKey].isExpanded,
        },
      },
    } as CourseData));
  };

  const isQuizAdded = (module: Module) => {
    return module.quiz?.questions?.some(
      (q) => q.question.trim() !== '' || q.options.some((opt) => opt.trim() !== '') || q.correctAnswer.trim() !== ''
    );
  };

  const isFinalExamAdded = () => {
    return editCourseData?.finalExam?.questions?.some(
      (q) => q.question.trim() !== '' || q.options.some((opt) => opt.trim() !== '') || q.correctAnswer.trim() !== ''
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseData?.id) return;

    const requiredFields = {
      courseTitle: editCourseData.courseTitle,
      description: editCourseData.description,
      instructor: editCourseData.instructor,
      level: editCourseData.level,
      language: editCourseData.language,
      categories: selectedCategory,
    };

    const isEmpty = Object.values(requiredFields).some(
      (value) =>
        !value ||
        (Array.isArray(value) &&
          value.some(
            (desc) =>
              !desc.headline ||
              desc.headline.trim() === '' ||
              (desc.text && desc.text.trim() === '') ||
              (desc.point && desc.point.length > 0 && desc.point.every((p) => p.trim() === ''))
          ))
    );

    if (isEmpty) {
      setErrorMessage('Please fill in all required fields.');
      setIsErrorModalOpen(true);
      return;
    }

    if (categories.length === 0) {
      setErrorMessage('No categories available. Please add categories in the admin panel.');
      setIsErrorModalOpen(true);
      return;
    }

    if (!isFree && (isNaN(Number(editCourseData.price)) || Number(editCourseData.price) <= 0)) {
      setErrorMessage('Please enter a valid price.');
      setIsErrorModalOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      let profileImgUrl = editCourseData.profileImg;
      let thumbnailUrl = editCourseData.thumbnail;

      if (profileImgFile) {
        const sanitizedTitle = editCourseData.courseTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const storageRef = ref(storage, `courses/${sanitizedTitle}/profileImg`);
        await uploadBytes(storageRef, profileImgFile);
        profileImgUrl = await getDownloadURL(storageRef);
      }

      if (thumbnailFile) {
        const sanitizedTitle = editCourseData.courseTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const storageRef = ref(storage, `courses/${sanitizedTitle}/thumbnail`);
        await uploadBytes(storageRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      const updatedCourse = {
        ...editCourseData,
        profileImg: profileImgUrl,
        thumbnail: thumbnailUrl,
        categories: selectedCategory,
        price: isFree ? 'Free' : editCourseData.price,
        updatedAt: new Date().toISOString(),
        // Ensure keyTopics is an array
        keyTopics: editCourseData.keyTopics || [],
      };

      const stripUndefined = (obj: Record<string, unknown>) => JSON.parse(JSON.stringify(obj));
      await updateDoc(doc(db, 'courses', editCourseData.id), stripUndefined(updatedCourse));

      setCourses(prev => prev.map(c => c.id === editCourseData.id ? updatedCourse : c));
      setIsEditModalOpen(false);
      setIsSuccessModalOpen(true);

      setEditCourseData(null);
      setProfileImgFile(null);
      setThumbnailFile(null);
      setProfileImgPreview(null);
      setThumbnailPreview(null);
      setSelectedCategory('');
    } catch (error) {
      console.error('Error updating course:', error);
      setErrorMessage('Failed to update course');
      setIsErrorModalOpen(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPaymentType('all');
    setSelectedVisibility('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97E38] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2c3e50]"></h1>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {filteredCourses.length} / {courses.length} courses
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card style={{ borderRadius: 15, padding: 16 }}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ borderRadius: 15 }}
            />
          </div>
          <Button
            onClick={() => setIsFilterOpen(true)}
            style={{ borderRadius: 15, padding: '10px 20px', border: "1px solid #E5E7EB", fontWeight: 400, fontSize: 15, color: "#2c3e50" }}
          >
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </Button>
          <Button
            onClick={() => setIsColumnsOpen(true)}
            style={{ borderRadius: 15, padding: '10px 20px', border: "1px solid #E5E7EB", fontWeight: 400, fontSize: 15, color: "#2c3e50" }}
          >
            <Settings className="h-5 w-5 mr-2" />
            Columns
          </Button>
        </div>
      </Card>

      {/* Courses Table */}
      <Card style={{ borderRadius: 15 }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className=" border-b">
                <tr>
                  {visibleColumns.courseTitle && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Course Title:</th>
                  )}
                  {visibleColumns.students && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Students:</th>
                  )}
                  {visibleColumns.price && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Price:</th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Status:</th>
                  )}
                  {visibleColumns.dateCreated && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Date created:</th>
                  )}
                  {visibleColumns.category && (
                    <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Category:</th>
                  )}
                  <th className="px-6 py-4 text-left" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Actions:</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course, index) => (
                  <tr key={course.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {visibleColumns.courseTitle && (
                      <td className="px-6 py-0">
                        <div className="flex items-center gap-3">
                          {course.profileImg && (
                            <Image
                              src={course.profileImg}
                              alt={course.courseTitle}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#6e737c" }}>{course.courseTitle}</div>
                            <div style={{ fontSize: 14, fontWeight: 400, color: "#6e737c" }}>{course.instructor}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.students && (
                      <td className="px-6 py-4 text-sm text-gray-900">{course.enrollmentCount || 0}</td>
                    )}
                    {visibleColumns.price && (
                      <td className="px-6 py-4" style={{ fontSize: 14, fontWeight: 700, color: "#6e737c" }}>
                        {course.price === 'Free' ? 'Free' : `$${course.price}`}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-0">
                        <span style={{ borderRadius: 10, paddingTop: 5, paddingBottom: 5, paddingRight: 10, paddingLeft: 10, fontSize: 14 }} className={`inline-flex px-2 py-1 ${course.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.dateCreated && (
                      <td className="px-6 py-4" style={{ fontSize: 14, fontWeight: 400, color: "#6e737c" }}>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-6 py-4" style={{ fontSize: 14, fontWeight: 700, color: "#6e737c" }}>{course.categories}</td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(course)}
                          size="sm"
                          className="bg-green-100 hover:bg-green-200 text-green-800"
                          style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15, backgroundColor: "#BBF7D0", color: "#15803D" }}
                        >
                          <Edit2 className="h-5 w-5 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(course)}
                          size="sm"
                          className="flex items-center bg-red-600 hover:bg-red-800 text-white transition-all duration-200 hover:scale-105 font-barlow"
                          style={{ borderRadius: 15, paddingBottom: 8, paddingTop: 8, paddingRight: 15, paddingLeft: 15 }}
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found</p>
            </div>
          )}

          {/* ---------- Pagination ---------- */}
          {filteredCourses.length > coursesPerPage && (
            <div className="flex justify-center items-center mt-6 gap-2 pb-4">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                style={{ padding: '8px 15px', borderRadius: 15 }}
                className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {renderPageNumbers()}
              </div>

              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
                style={{ padding: '8px 15px', borderRadius: 15 }}
                className="transition-all duration-300 ease-in-out transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Modal */}
      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <div className="space-y-1 px-4">
          <div className="flex justify-between items-center">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2c3e50" }}>Filter</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontSize: 15, fontWeight: 400, marginTop: 5 }}>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                  <SelectItem value="all" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>All categories</SelectItem>
                  {(categories || []).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Type</Label>
              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontSize: 15, fontWeight: 400, marginTop: 5 }}>
                  <SelectValue placeholder="All payment types" />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                  <SelectItem value="all" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>All payment types</SelectItem>
                  <SelectItem value="free" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Free</SelectItem>
                  <SelectItem value="paid" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontSize: 15, fontWeight: 400, marginTop: 5 }}>
                  <SelectValue placeholder="All visibility" />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                  <SelectItem value="all" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>All visibility</SelectItem>
                  <SelectItem value="active" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Active</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <Button onClick={clearFilters} style={{ borderRadius: 15, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, fontSize: 15, fontWeight: 400, backgroundColor: "#E7E5E4" }}>
              Clear
            </Button>
            <Button onClick={() => setIsFilterOpen(false)} style={{ borderRadius: 15, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, fontSize: 15, fontWeight: 400, backgroundColor: "#2c3e50", color: "#fff" }}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* Column Customization Modal */}
      <Modal isOpen={isColumnsOpen} onClose={() => setIsColumnsOpen(false)}>
        <div className="space-y-1 px-4">
          <div className="flex justify-between items-center">
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#2c3e50" }}>
              Customize columns
            </h3>
          </div>

          <p className="text-sm text-gray-600" style={{ marginBottom: 10 }}>
            Select which columns to display in the table
          </p>

          <div className="space-y-3">
            {Object.entries(visibleColumns).map(([key, visible]) => (
              <label
                style={{ borderRadius: 15 }}
                key={key}
                className="flex items-center justify-between p-3 border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50"
              >
                <span className="capitalize text-gray-700" style={{ fontSize: 15, fontWeight: 400, color: "#2c3e50" }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>

                <div className="relative">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisibleColumns(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 ${visible ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${visible ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                  </div>
                </div>
              </label>
            ))}
          </div>

        </div>
      </Modal>

      {/* Edit Course Modal */}
      <ModalEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Course"
      >
        {editCourseData && (
          <div >
            <Card
              style={{
                boxShadow:
                  "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
                borderRadius: 15,
                borderColor: "#fff",
                backgroundColor: "#fff",
                padding: 0,
              }}
              className="w-full"
            >
              <CardContent className="w-full">
                <form onSubmit={handleEditSubmit} className="space-y-6 pt-5 w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Course Title:
                      </Label>
                      <Input
                        id="courseTitle"
                        name="courseTitle"
                        value={editCourseData.courseTitle}
                        onChange={(e) => setEditCourseData({ ...editCourseData, courseTitle: e.target.value })}
                        className="w-full"
                        placeholder="Type course title"
                        style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Category:
                      </Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                        disabled={categories.length === 0}
                      >
                        <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                          <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value} className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {categories.length === 0 && (
                        <p className="text-red-600 text-sm">No categories available. Please add categories in the admin panel.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructor" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Instructor:
                      </Label>
                      <Input
                        id="instructor"
                        name="instructor"
                        value={editCourseData.instructor}
                        onChange={(e) => setEditCourseData({ ...editCourseData, instructor: e.target.value })}
                        className="w-full"
                        placeholder="Type instructor"
                        style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Level:
                      </Label>
                      <Select
                        value={editCourseData.level}
                        onValueChange={(value) => setEditCourseData({ ...editCourseData, level: value })}
                      >
                        <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                          <SelectItem value="Beginner" className="hover:bg-[#F97E38] hover:text-[#fff]" style={{ borderRadius: 13 }}>Beginner</SelectItem>
                          <SelectItem value="Intermediate" className="hover:bg-[#F97E38] hover:text-[#fff]" style={{ borderRadius: 13 }}>Intermediate</SelectItem>
                          <SelectItem value="Advanced" className="hover:bg-[#F97E38] hover:text-[#fff]" style={{ borderRadius: 13 }}>Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Course Language:
                      </Label>
                      <Select
                        value={editCourseData.language}
                        onValueChange={(value) => setEditCourseData({ ...editCourseData, language: value })}
                      >
                        <SelectTrigger style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontSize: 15, fontWeight: 400 }}>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50" }}>
                          <SelectItem value="English" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>English</SelectItem>
                          <SelectItem value="Khmer" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Khmer</SelectItem>
                          <SelectItem value="French" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>French</SelectItem>
                          <SelectItem value="German" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>German</SelectItem>
                          <SelectItem value="Chinese" className="hover:bg-[#F97E38] hover:rounded-lg hover:text-[#fff]" style={{ borderRadius: 13 }}>Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Duration (hours):
                      </Label>
                      <Input
                        id="duration"
                        name="duration"
                        type="number"
                        min="0"
                        step="0.5"
                        value={editCourseData.duration}
                        onChange={(e) => setEditCourseData({ ...editCourseData, duration: e.target.value })}
                        placeholder="Type duration"
                        className="w-full"
                        style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Course Thumbnail:
                      </Label>
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'thumbnail')}
                        className="w-full"
                        style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                      />
                      {(thumbnailPreview || editCourseData.thumbnail) && (
                        <div className="mt-2 flex flex-col items-start gap-3">
                          <Image
                            src={thumbnailPreview || editCourseData.thumbnail}
                            alt="Thumbnail preview"
                            style={{ borderRadius: 15 }}
                            className="w-full max-w-72 h-42 object-cover"
                            width={288}
                            height={168}
                            priority
                          />
                          <Button
                            type="button"
                            onClick={() => clearImage('thumbnail')}
                            className="bg-red-600 text-white"
                            style={{
                              paddingTop: 8,
                              paddingBottom: 8,
                              paddingLeft: 16,
                              paddingRight: 16,
                              borderRadius: 15,
                              fontSize: 15,
                              fontWeight: 400,
                              width: 'fit-content',
                            }}
                          >
                            <X className="h-5 w-5 mr-2" />
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profileImg" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Profile Image:
                      </Label>
                      <Input
                        id="profileImg"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'profileImg')}
                        className="w-full"
                        style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                      />
                      {(profileImgPreview || editCourseData.profileImg) && (
                        <div className="mt-2 flex flex-col items-start gap-3">
                          <Image
                            src={profileImgPreview || editCourseData.profileImg}
                            alt="Profile image preview"
                            style={{ borderRadius: 15 }}
                            className="w-32 h-32 object-cover"
                            width={128}
                            height={128}
                            priority
                          />
                          <Button
                            type="button"
                            onClick={() => clearImage('profileImg')}
                            className="bg-red-600 text-white"
                            style={{
                              paddingTop: 8,
                              paddingBottom: 8,
                              paddingLeft: 16,
                              paddingRight: 16,
                              borderRadius: 15,
                              fontSize: 15,
                              fontWeight: 400,
                              width: 'fit-content',
                            }}
                          >
                            <X className="h-5 w-5 mr-2" />
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="isActive" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Course Status:
                      </Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{editCourseData.isActive ? 'Active' : 'Inactive'}</span>
                        <CustomSwitch isActive={editCourseData.isActive} onToggle={handleToggleActive} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Price (USD):
                      </Label>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="priceOption"
                              value="free"
                              style={{ borderRadius: 15 }}
                              checked={isFree}
                              onChange={() => {
                                setIsFree(true);
                                setEditCourseData({ ...editCourseData, price: 'Free' });
                              }}
                              className="hidden"
                            />
                            <div
                              className={`w-5 h-5 mr-2 rounded-full border-2 ${isFree ? 'bg-green-500' : 'border-gray-300'} flex items-center justify-center`}
                            >
                              {isFree && <div className="w-3 h-3 bg-white rounded-full" />}
                            </div>
                            Free
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="priceOption"
                              value="custom"
                              checked={!isFree}
                              style={{ borderRadius: 15 }}
                              onChange={() => {
                                setIsFree(false);
                                setEditCourseData({ ...editCourseData, price: '' });
                              }}
                              className="hidden"
                            />
                            <div
                              className={`w-5 h-5 mr-2 rounded-full border-2 ${!isFree ? 'bg-green-500' : 'border-gray-300'} flex items-center justify-center`}
                            >
                              {!isFree && <div className="w-3 h-3 bg-white rounded-full" />}
                            </div>
                            Price
                          </label>
                        </div>
                      </div>

                      {isFree ? (
                        <div className="text-gray-600" style={{ borderWidth: 1, paddingTop: 7, paddingBottom: 7, borderRadius: 15, paddingLeft: 10 }}>
                          Free
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-2">$</span>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editCourseData.price}
                            onChange={(e) => setEditCourseData({ ...editCourseData, price: e.target.value })}
                            className="w-full pl-6"
                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                            required={!isFree}
                            placeholder="Enter price"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                      What You Will Learn:
                    </Label>
                    {(editCourseData.learningPoints || []).map((point, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        <div>
                          <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                            Title:
                          </Label>
                          <Input
                            value={point.title || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleLearningPointChange(index, { title: e.target.value })
                            }
                            placeholder={`Learning point ${index + 1} title`}
                            className="w-full"
                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                          />
                        </div>
                        <div>
                          <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                            Details:
                          </Label>
                          <Textarea
                            value={point.details || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              handleLearningPointChange(index, { details: e.target.value })
                            }
                            placeholder={`Details for learning point ${index + 1}`}
                            className="w-full h-24"
                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => removeLearningPoint(index)}
                          style={{ backgroundColor: "#EF4444", color: "#fff", borderRadius: 15, paddingBottom: 10, paddingTop: 10, fontSize: 15, fontWeight: 400 }}
                        >
                          <Trash2 className="mr-2 h-5 w-5" /> Delete
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addLearningPoint}
                      style={{ backgroundColor: "#E7E5E4", borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                    >
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add more point
                    </Button>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>
                      Key Topics:
                    </Label>
                    <Textarea
                      rows={4}
                      value={(editCourseData?.keyTopics || []).join('\n')}
                      onChange={(e) => {
                        const topics = e.target.value
                          .split('\n')
                          .map((topic) => topic.trim())
                          .filter((topic) => topic !== '');
                        setEditCourseData({ ...editCourseData, keyTopics: topics } as CourseData);
                      }}
                      placeholder="Enter one topic per line (e.g., Topic 1\nTopic 2)"
                      style={{ borderRadius: 15 }}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          setEditCourseData({
                            ...editCourseData,
                            keyTopics: [...(editCourseData?.keyTopics || []), ''],
                          } as CourseData)
                        }
                        style={{
                          backgroundColor: '#E7E5E4',
                          borderRadius: 15,
                          padding: '10px 20px',
                          fontSize: 15,
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Key Topic
                      </Button>
                      {editCourseData?.keyTopics?.length > 0 && (
                        <Button
                          type="button"
                          onClick={() =>
                            setEditCourseData({
                              ...editCourseData,
                              keyTopics: (editCourseData?.keyTopics || []).slice(0, -1),
                            } as CourseData)
                          }
                          style={{
                            backgroundColor: '#EF4444',
                            color: '#fff',
                            borderRadius: 15,
                            padding: '10px 20px',
                            fontSize: 15,
                          }}
                        >
                          <Trash2 className="h-5 w-5 mr-2" />Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                      Course Description – {4000 - (Array.isArray(editCourseData.description) ? editCourseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) : 0)}/4000 characters left
                    </Label>
                    {(Array.isArray(editCourseData.description) ? editCourseData.description : []).map((block, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <Input
                          value={block.headline || ''}
                          maxLength={120}
                          onChange={(e) => {
                            const used = (Array.isArray(editCourseData.description) ? editCourseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) : 0) - (block.headline?.length || 0) + e.target.value.length;
                            if (used > 4000) return;
                            handleDescriptionChange(idx, 'headline', e.target.value);
                          }}
                          placeholder="Headline"
                          style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
                          className="w-full"
                        />
                        {block.text !== undefined && (
                          <Textarea
                            value={block.text}
                            rows={6}
                            onChange={(e) => {
                              const used = (Array.isArray(editCourseData.description) ? editCourseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) : 0) - (block.text?.length || 0) + e.target.value.length;
                              if (used > 4000) return;
                              handleDescriptionChange(idx, 'text', e.target.value);
                            }}
                            placeholder="Detail text"
                            style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
                            className="w-full"
                          />
                        )}
                        {block.point !== undefined && (
                          <Textarea
                            value={(block.point || []).join(' • ')}
                            rows={4}
                            onChange={(e) => {
                              const used = (Array.isArray(editCourseData.description) ? editCourseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) : 0) - (block.point ? block.point.join('').length : 0) + e.target.value.replace(/•/g, '').length;
                              if (used > 4000) return;
                              handleDescriptionChange(idx, 'point', e.target.value);
                            }}
                            placeholder="Text point (e.g., • Point 1 • Point 2)"
                            style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
                            className="w-full"
                          />
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {block.text === undefined && (
                            <Button
                              type="button"
                              onClick={() => handleDescriptionChange(idx, 'text', '')}
                              style={{ backgroundColor: '#E7E5E4', borderRadius: 15, padding: '10px 20px', fontSize: 15, fontWeight: 400 }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Add Text Detail
                            </Button>
                          )}
                          {block.point === undefined && (
                            <Button
                              type="button"
                              onClick={() => handleDescriptionChange(idx, 'point', '')}
                              style={{ backgroundColor: '#E7E5E4', borderRadius: 15, padding: '10px 20px', fontSize: 15, fontWeight: 400 }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Add Text Point
                            </Button>
                          )}
                          {idx > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => removeDescription(idx)}
                              style={{ backgroundColor: '#EF4444', color: '#fff', borderRadius: 15, paddingBottom: 10, paddingTop: 10 }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        onClick={() => {
                          if ((Array.isArray(editCourseData.description) ? editCourseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) : 0) >= 4000) return;
                          addDescription();
                        }}
                        style={{ backgroundColor: '#E7E5E4', borderRadius: 15, padding: '10px 20px', fontSize: 15, fontWeight: 400 }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Headline
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6 w-full">
                    {Object.entries(editCourseData.modules || {})
                      .sort(([a], [b]) => {
                        const numA = parseInt(a.replace('module', ''), 10);
                        const numB = parseInt(b.replace('module', ''), 10);
                        return numA - numB;
                      })
                      .map(([moduleKey, module]) => (
                        <Card key={moduleKey} className="p-4 w-full" style={{ borderRadius: 15 }}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                Module {moduleKey.replace('module', '')}
                              </h3>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => removeModule(moduleKey)}
                                  style={{ backgroundColor: "#EF4444", color: "#fff", paddingTop: 10, paddingBottom: 10, paddingRight: 10, paddingLeft: 10, borderRadius: 15 }}
                                >
                                  <Trash2 className="mr-2 h-5 w-5" /> Delete
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => toggleModuleExpanded(moduleKey)}
                                  style={{ backgroundColor: "#E7E5E4", paddingTop: 10, paddingBottom: 10, paddingRight: 10, paddingLeft: 10, borderRadius: 15 }}
                                >
                                  {module.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </Button>
                              </div>
                            </div>

                            {module.isExpanded && (
                              <>
                                <div className="space-y-2">
                                  <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                    Module Title:
                                  </Label>
                                  <Input
                                    value={module.title || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      handleModuleChange(moduleKey, e.target.value)
                                    }
                                    className="w-full"
                                    placeholder="Type module title"
                                    style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                                  />
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentModuleKey(moduleKey);
                                    setIsQuizModalOpen(true);
                                  }}
                                  style={{ backgroundColor: "#E7E5E4", borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                                >
                                  {isQuizAdded(module) ? (
                                    <>
                                      <Edit2 className="mr-2 h-4 w-4" />
                                      Edit Quiz
                                    </>
                                  ) : (
                                    <>
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Add Quiz
                                    </>
                                  )}
                                </Button>

                                <div className="space-y-4">
                                  {module.lessons?.map((lesson, lessonIndex) => (
                                    <Card key={lessonIndex} className="p-4 w-full" style={{ borderRadius: 15 }}>
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                            Lesson {lessonIndex + 1}
                                          </h4>
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => removeLesson(moduleKey, lessonIndex)}
                                            style={{ backgroundColor: "#EF4444", color: "#fff", paddingTop: 10, paddingBottom: 10, paddingRight: 10, paddingLeft: 10, borderRadius: 15 }}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                          </Button>
                                        </div>
                                        <div>
                                          <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                            Lesson Title:
                                          </Label>
                                          <Input
                                            value={lesson.title || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                              handleLessonChange(moduleKey, lessonIndex, 'title', e.target.value)
                                            }
                                            className="w-full"
                                            placeholder="Type lesson title"
                                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                                          />
                                        </div>
                                        <div>
                                          <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                            Video URL:
                                          </Label>
                                          <Input
                                            value={lesson.videoUrl || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                              handleLessonChange(moduleKey, lessonIndex, 'videoUrl', e.target.value)
                                            }
                                            className="w-full"
                                            placeholder="Type video URL"
                                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                                          />
                                        </div>
                                        <div>
                                          <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                                            Description:
                                          </Label>
                                          <Textarea
                                            value={lesson.description || ''}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                              handleLessonChange(moduleKey, lessonIndex, 'description', e.target.value)
                                            }
                                            className="w-full"
                                            placeholder="Type description"
                                            style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15, marginTop: 10 }}
                                          />
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addLesson(moduleKey)}
                                    style={{ backgroundColor: "#E7E5E4", borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Lesson
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </Card>
                      ))}
                    <Button
                      type="button"
                      onClick={addModule}
                      className="w-full"
                      style={{ backgroundColor: "#fff", border: "1px solid #2c3e50", borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                    >
                      Add Module
                    </Button>
                  </div>

                  <div className="space-y-4 w-full">
                    <Button
                      type="button"
                      onClick={() => setIsFinalExamModalOpen(true)}
                      className="w-full"
                      style={{ backgroundColor: "#fff", border: "1px solid #2c3e50", borderRadius: 15, paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400 }}
                    >
                      {isFinalExamAdded() ? (
                        <>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Final Exam
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Final Exam
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full"
                      style={{
                        backgroundColor: isClicked ? "#1a242f" : isHovered ? "#34495e" : "#2c3e50",
                        color: "#fff",
                        paddingBottom: 10, paddingTop: 10, paddingRight: 20, paddingLeft: 20, fontSize: 15, fontWeight: 400, border: "1px solid #2c3e50",
                        borderRadius: "15px",
                        transition: "background-color 0.3s ease, transform 0.1s ease",
                        transform: isClicked ? "scale(0.98)" : "scale(1)",
                      }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      onMouseDown={() => setIsClicked(true)}
                      onMouseUp={() => setIsClicked(false)}
                    >
                      {isUpdating ? 'Updating...' : 'Update Course'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </ModalEdit>


      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="text-center space-y-4 px-4">
          <Lottie animationData={trashAnimation} autoPlay loop style={{ width: 150, height: 150, margin: '0 auto' }} />
          <div>
            <h3 style={{fontSize: 18, fontWeight: 700, color: "#2c3e50"}}>Delete Course</h3>
            <p className="mt-2" style={{fontSize: 16, fontWeight: 400, color: "#9b9b9b"}}>
              Are you sure you want to delete <br/> <span style={{fontSize: 16, fontWeight: 700, color: "#2c3e50"}}>{courseToDelete?.courseTitle || 'this course'}?</span>? <br/> This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-gray-200 text-gray-700"
              style={{ borderRadius: 15, padding: '10px 20px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 text-white"
              style={{ borderRadius: 15, padding: '10px 20px' }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)}>
        <div className="text-center space-y-4 px-4">
          <Lottie animationData={successAnimation} autoPlay loop style={{ width: 150, height: 150, margin: '0 auto' }} />
          <div>
            <h3 style={{fontSize: 18, fontWeight: 700, color: "#2c3e50"}}>Success!</h3>
            <p className="mt-2" style={{fontSize: 16, fontWeight: 400, color: "#9b9b9b"}}>
              Course has been successfully updated.
            </p>
          </div>
          <Button
            onClick={() => setIsSuccessModalOpen(false)}
            className="bg-green-600 text-white"
            style={{ borderRadius: 15, padding: '8px 16px' }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)}>
        <div className="text-center space-y-4 px-4">
          <Lottie animationData={failureAnimation} loop style={{ width: 150, height: 150, margin: '0 auto' }} />
          <div>
            <h3 style={{fontSize: 18, fontWeight: 700, color: "#2c3e50"}}>Error</h3>
            <p className="mt-2" style={{fontSize: 16, fontWeight: 400, color: "#9b9b9b"}}>
              {errorMessage}
            </p>
          </div>
          <Button
            onClick={() => setIsErrorModalOpen(false)}
            className="bg-red-600 text-white"
            style={{ borderRadius: 15, padding: '8px 16px' }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Quiz Modal */}
      <QuizFormModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        questions={currentModuleKey && editCourseData?.modules[currentModuleKey]?.quiz.questions || []}
        onSave={(questions) => {
          if (currentModuleKey && editCourseData) {
            const updatedModules = { ...editCourseData.modules };
            updatedModules[currentModuleKey].quiz = { questions };
            setEditCourseData({ ...editCourseData, modules: updatedModules });
          }
        }}
        title={`Module ${currentModuleKey?.replace('module', '')} Quiz`}
      />

      {/* Final Exam Modal */}
      <QuizFormModal
        isOpen={isFinalExamModalOpen}
        onClose={() => setIsFinalExamModalOpen(false)}
        questions={editCourseData?.finalExam.questions || []}
        onSave={(questions) => {
          if (editCourseData) {
            setEditCourseData({ ...editCourseData, finalExam: { questions } });
          }
        }}
        title="Final Exam"
      />
    </div>
  );
};

export default CourseList;