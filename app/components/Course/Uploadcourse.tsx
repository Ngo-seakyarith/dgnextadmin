import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { PlusCircle, Trash2, Edit2, PencilLineIcon, X, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
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

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

/* ---------- TYPE DEFINITIONS ---------- */
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface FirebaseError {
  message: string;
  code?: string;
}

interface Module {
  title: string;
  lessons: { title: string; videoUrl: string; description: string }[];
  quiz: { questions: Question[] };
  isExpanded: boolean;
}

interface CourseData {
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
  isActive: boolean;
  finalExam: { questions: Question[] };
  keyTopics: string[]; // ✅ Add this
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

interface Category {
  label: string;
  value: string;
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

/* ---------- NEW QUIZ MODAL WITH PROGRESS ---------- */
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
          <PencilLineIcon size={18} />
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
const UploadCourseForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileImgFile, setProfileImgFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [profileImgPreview, setProfileImgPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [courseData, setCourseData] = useState<CourseData>({
    courseTitle: '',
    description: [{ headline: '', text: undefined, point: undefined }],
    duration: '',
    instructor: '',
    level: '',
    language: '',
    learningPoints: [{ title: '', details: '' }],
    modules: {},
    profileImg: '',
    thumbnail: '',
    price: 'Free',
    isActive: true,
    finalExam: {
      questions: Array(10).fill(null).map(() => ({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
      })),
    },
    keyTopics: [], // ✅ Add this
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isFinalExamModalOpen, setIsFinalExamModalOpen] = useState(false);
  const [currentModuleKey, setCurrentModuleKey] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleToggleActive = (checked: boolean) => {
    setCourseData((prevState) => ({
      ...prevState,
      isActive: checked,
    }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData: Category[] = querySnapshot.docs.map((doc) => ({
          label: doc.data().name as string,
          value: doc.data().name as string,
        }));
        setCategories(categoriesData);
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        console.error('Error fetching categories:', firebaseError.message);
        setIsAlertModalOpen(true);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourseData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
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

  useEffect(() => {
    return () => {
      if (profileImgPreview) URL.revokeObjectURL(profileImgPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [profileImgPreview, thumbnailPreview]);

  const clearImage = (field: 'profileImg' | 'thumbnail') => {
    if (field === 'profileImg') {
      setProfileImgFile(null);
      setProfileImgPreview(null);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleDescriptionChange = (index: number, field: 'headline' | 'text' | 'point', value: string) => {
    setCourseData((prevState) => {
      const updatedDescriptions = [...prevState.description];
      if (field === 'point') {
        const points = value
          .split('•')
          .map((item) => item.trim())
          .filter((item) => item !== '');
        updatedDescriptions[index] = { ...updatedDescriptions[index], point: points };
      } else {
        updatedDescriptions[index] = { ...updatedDescriptions[index], [field]: value };
      }
      return { ...prevState, description: updatedDescriptions };
    });
  };

  const addDescription = () => {
    setCourseData((prevState) => ({
      ...prevState,
      description: [...prevState.description, { headline: '', text: undefined, point: undefined }],
    }));
  };

  const removeDescription = (index: number) => {
    setCourseData((prevState) => ({
      ...prevState,
      description: prevState.description.filter((_, i) => i !== index),
    }));
  };

  const handleLearningPointChange = (
    index: number,
    value: { title?: string; details?: string }
  ) => {
    setCourseData((prevState) => {
      const updatedPoints = [...prevState.learningPoints];
      updatedPoints[index] = { ...updatedPoints[index], ...value };
      return { ...prevState, learningPoints: updatedPoints };
    });
  };

  const addLearningPoint = () => {
    setCourseData((prevState) => ({
      ...prevState,
      learningPoints: [...prevState.learningPoints, { title: '', details: '' }],
    }));
  };

  const removeLearningPoint = (index: number) => {
    setCourseData((prevState) => ({
      ...prevState,
      learningPoints: prevState.learningPoints.filter((_, i) => i !== index),
    }));
  };

  const handleModuleChange = (moduleKey: string, value: string) => {
    setCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState.modules,
        [moduleKey]: {
          ...prevState.modules[moduleKey],
          title: value,
          lessons: prevState.modules[moduleKey]?.lessons || [],
          quiz: prevState.modules[moduleKey]?.quiz || {
            questions: Array(5).fill(null).map(() => ({
              question: '',
              options: ['', '', '', ''],
              correctAnswer: '',
            })),
          },
          isExpanded: prevState.modules[moduleKey]?.isExpanded ?? true,
        },
      },
    }));
  };

  const handleLessonChange = (
    moduleKey: string,
    lessonIndex: number,
    field: string,
    value: string
  ) => {
    setCourseData((prevState) => {
      const updatedModules = { ...prevState.modules };
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
      };
    });
  };

  const handleQuizSave = (moduleKey: string, updatedQuestions: Question[]) => {
    setCourseData((prevState) => {
      const updatedModules = { ...prevState.modules };
      updatedModules[moduleKey].quiz = { questions: updatedQuestions };
      return { ...prevState, modules: updatedModules };
    });
  };

  const handleFinalExamSave = (updatedQuestions: Question[]) => {
    setCourseData((prevState) => ({
      ...prevState,
      finalExam: { questions: updatedQuestions },
    }));
  };

  const addModule = () => {
    const moduleKey = `module${Object.keys(courseData.modules).length + 1}`;
    setCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState.modules,
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
    }));
  };

  const removeModule = (moduleKey: string) => {
    setCourseData((prevState) => {
      const updatedModules = { ...prevState.modules };
      delete updatedModules[moduleKey];
      return {
        ...prevState,
        modules: updatedModules,
      };
    });
  };

  const addLesson = useCallback((moduleKey: string) => {
    setCourseData((prevState) => {
      const updatedModules = { ...prevState.modules };
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
      };
    });
  }, []);

  const removeLesson = (moduleKey: string, lessonIndex: number) => {
    setCourseData((prevState) => {
      const updatedModules = { ...prevState.modules };
      updatedModules[moduleKey].lessons = updatedModules[moduleKey].lessons.filter(
        (_, index) => index !== lessonIndex
      );
      return {
        ...prevState,
        modules: updatedModules,
      };
    });
  };

  const toggleModuleExpanded = (moduleKey: string) => {
    setCourseData((prevState) => ({
      ...prevState,
      modules: {
        ...prevState.modules,
        [moduleKey]: {
          ...prevState.modules[moduleKey],
          isExpanded: !prevState.modules[moduleKey].isExpanded,
        },
      },
    }));
  };

  const isQuizAdded = (module: Module) => {
    return module.quiz?.questions?.some(
      (q) => q.question.trim() !== '' || q.options.some((opt) => opt.trim() !== '') || q.correctAnswer.trim() !== ''
    );
  };

  const isFinalExamAdded = () => {
    return courseData.finalExam?.questions?.some(
      (q) => q.question.trim() !== '' || q.options.some((opt) => opt.trim() !== '') || q.correctAnswer.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = {
      courseTitle: courseData.courseTitle,
      description: courseData.description,
      instructor: courseData.instructor,
      level: courseData.level,
      language: courseData.language,
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
      setIsAlertModalOpen(true);
      return;
    }

    if (categories.length === 0) {
      setIsAlertModalOpen(true);
      return;
    }

    if (!isFree && (isNaN(Number(courseData.price)) || Number(courseData.price) <= 0)) {
      setIsAlertModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      let profileImgUrl = courseData.profileImg;
      let thumbnailUrl = courseData.thumbnail;
      // still sanitize the title for storage paths
      const sanitizedCourseTitle = courseData.courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (profileImgFile) {
        profileImgUrl = await uploadFile(
          profileImgFile,
          `courses/${sanitizedCourseTitle}/profileImg`
        );
      }
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(
          thumbnailFile,
          `courses/${sanitizedCourseTitle}/thumbnail`
        );
      }

      const coursePayload = {
        ...courseData,
        profileImg: profileImgUrl,
        thumbnail: thumbnailUrl,
        categories: selectedCategory,
        price: isFree ? 'Free' : courseData.price,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        enrollmentCount: 0,
      };

      // NEW: auto-id document
      await addDoc(collection(db, 'courses'), JSON.parse(JSON.stringify(coursePayload)));

      // reset form …
      setCourseData({
        courseTitle: '',
        description: [{ headline: '', text: undefined, point: undefined }],
        duration: '',
        instructor: '',
        level: '',
        language: '',
        learningPoints: [{ title: '', details: '' }],
        modules: {},
        profileImg: '',
        thumbnail: '',
        price: 'Free',
        isActive: true,
        finalExam: {
          questions: Array(10).fill(null).map(() => ({
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
          })),
        },
        keyTopics: [],
      });
      setSelectedCategory('');
      setIsFree(true);
      setProfileImgFile(null);
      setThumbnailFile(null);
      setProfileImgPreview(null);
      setThumbnailPreview(null);

      setIsModalOpen(true);
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      console.error('Error uploading course:', firebaseError.message);
      setIsAlertModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-10">
      <Card
        style={{
          boxShadow:
            "0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)",
          borderRadius: 15,
          borderColor: "#fff",
          backgroundColor: "#fff",
          padding: 10,
        }}
      >
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                  Course Title:
                </Label>
                <Input
                  id="courseTitle"
                  name="courseTitle"
                  value={courseData.courseTitle}
                  onChange={handleChange}
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
                  onValueChange={handleCategoryChange}
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
                  value={courseData.instructor}
                  onChange={handleChange}
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
                  value={courseData.level}
                  onValueChange={(value: string) => setCourseData((prev) => ({ ...prev, level: value }))}
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
                  value={courseData.language}
                  onValueChange={(value: string) => setCourseData((prev) => ({ ...prev, language: value }))}
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
                  value={courseData.duration}
                  onChange={handleChange}
                  placeholder="Type duration"
                  className="w-full"
                  style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                />
              </div>

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
                {thumbnailFile && (
                  <p className="text-sm text-gray-600">Selected: {thumbnailFile.name}</p>
                )}
                {thumbnailPreview && (
                  <div className="mt-2 flex flex-col items-start gap-3">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      style={{ borderRadius: 15 }}
                      className="w-72 h-42 object-cover"
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
                {profileImgFile && (
                  <p className="text-sm text-gray-600">Selected: {profileImgFile.name}</p>
                )}
                {profileImgPreview && (
                  <div className="mt-2 flex flex-col items-start gap-3">
                    <Image
                      src={profileImgPreview}
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

              <div className="space-y-2">
                <Label htmlFor="isActive" className="block mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                  Course Status:
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{courseData.isActive ? 'Active' : 'Inactive'}</span>
                  <CustomSwitch isActive={courseData.isActive} onToggle={handleToggleActive} />
                </div>
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
                        setCourseData((prev) => ({ ...prev, price: 'Free' }));
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
                        setCourseData((prev) => ({ ...prev, price: '' }));
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
                    value={courseData.price}
                    onChange={handleChange}
                    className="w-full pl-6"
                    style={{ borderRadius: 15, backgroundColor: "#fff", color: "#2c3e50", fontWeight: 400, fontSize: 15 }}
                    required={!isFree}
                    placeholder="Enter price"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                What You Will Learn:
              </Label>
              {courseData.learningPoints.map((point, index) => (
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

            {/* ---------- KEY TOPICS ---------- */}
            <div className="space-y-2">
              <Label style={{ fontSize: 15, fontWeight: 600, color: '#2c3e50' }}>
                Key Topics:
              </Label>

              {/* one textarea per topic */}
              <div className="flex flex-col gap-3">
                {courseData.keyTopics.map((topic, idx) => (
                  <Textarea
                    key={idx}
                    rows={2}
                    value={topic}
                    onChange={(e) => {
                      const copy = [...courseData.keyTopics];
                      copy[idx] = e.target.value;
                      setCourseData({ ...courseData, keyTopics: copy });
                    }}
                    placeholder={`Topic ${idx + 1}`}
                    style={{ borderRadius: 15 }}
                  />
                ))}
              </div>

              {/* buttons row under the label */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setCourseData({ ...courseData, keyTopics: [...courseData.keyTopics, ''] })
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

                {courseData.keyTopics.length > 0 && (
                  <Button
                    type="button"
                    onClick={() =>
                      setCourseData({
                        ...courseData,
                        keyTopics: courseData.keyTopics.slice(0, -1),
                      })
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

            <div className="space-y-2">
              <Label style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                Course Description – {4000 - courseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0)}/4000 characters left
              </Label>

              {courseData.description.map((block, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <Input
                    value={block.headline || ''}
                    maxLength={120}
                    onChange={(e) => {
                      const used = courseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) - (block.headline?.length || 0) + e.target.value.length;
                      if (used > 4000) return;
                      handleDescriptionChange(idx, 'headline', e.target.value);
                    }}
                    placeholder="Headline"
                    style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
                  />

                  {block.text !== undefined && (
                    <Textarea
                      value={block.text}
                      rows={6}
                      onChange={(e) => {
                        const used = courseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) - (block.text?.length || 0) + e.target.value.length;
                        if (used > 4000) return;
                        handleDescriptionChange(idx, 'text', e.target.value);
                      }}
                      placeholder="Detail text"
                      style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
                    />
                  )}

                  {block.point !== undefined && (
                    <Textarea
                      value={block.point.join(' • ')}
                      rows={4}
                      onChange={(e) => {
                        const used = courseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) - (block.point ? block.point.join('').length : 0) + e.target.value.replace(/•/g, '').length;
                        if (used > 4000) return;
                        handleDescriptionChange(idx, 'point', e.target.value);
                      }}
                      placeholder="Text point (e.g., • Point 1 • Point 2)"
                      style={{ borderRadius: 15, backgroundColor: '#fff', color: '#2c3e50', fontWeight: 400, fontSize: 15, marginTop: 10 }}
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
                    if (courseData.description.reduce((a, b) => a + (b.headline?.length || 0) + (b.text?.length || 0) + (b.point ? b.point.join('').length : 0), 0) >= 4000) return;
                    addDescription();
                  }}
                  style={{ backgroundColor: '#E7E5E4', borderRadius: 15, padding: '10px 20px', fontSize: 15, fontWeight: 400 }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Headline
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(courseData.modules).map(([moduleKey, module]) => (
                <Card key={moduleKey} className="p-4" style={{ borderRadius: 15 }}>
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
                            <Card key={lessonIndex} className="p-4" style={{ borderRadius: 15 }}>
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

            <div className="space-y-4">
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

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isLoading}
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
                {isLoading ? 'Uploading...' : 'Upload Course'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <QuizFormModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        questions={currentModuleKey ? courseData.modules[currentModuleKey]?.quiz.questions || [] : []}
        onSave={(questions) => handleQuizSave(currentModuleKey!, questions)}
        title={`Module ${currentModuleKey?.replace('module', '')} Quiz`}
      />

      <QuizFormModal
        isOpen={isFinalExamModalOpen}
        onClose={() => setIsFinalExamModalOpen(false)}
        questions={courseData.finalExam.questions}
        onSave={handleFinalExamSave}
        title="Final Exam"
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center">
          <Lottie animationData={successAnimation} loop={false} style={{ width: 150, height: 150, margin: '0 auto' }} />
          <h2 className=" mt-4" style={{ fontWeight: 800, fontSize: 16, color: "#2c3e50" }}>Course Uploaded Successfully!</h2>
          <p style={{ fontWeight: 400, fontSize: 14, color: "#6e737c" }}>Your course has been uploaded successfully. You can now manage it from the admin panel.</p>
          <div className="mt-4">
            <Button onClick={() => setIsModalOpen(false)} className="w-full bg-[#22C55E] text-white" style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)}>
        <div className="text-center">
          <Lottie animationData={failureAnimation} loop style={{ width: 150, height: 150, margin: '0 auto' }} />
          <h2 className=" mt-4" style={{ fontWeight: 800, fontSize: 16, color: "#2c3e50" }}>Upload Failed!</h2>
          <p style={{ fontWeight: 400, fontSize: 14, color: "#6e737c" }}>Please fill in all required fields, ensure a valid price is entered, or check for errors. Ensure categories are available in the admin panel.</p>
          <div className="mt-4">
            <Button onClick={() => setIsAlertModalOpen(false)} className="w-full bg-red-600 text-white" style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>
              Okay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UploadCourseForm;