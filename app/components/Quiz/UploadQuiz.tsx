import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';

interface Course {
  id: string;
  courseTitle: string;
}

interface QuizStep {
  question: string;
  options: string[];
  correctAnswer: string;
  isActive: boolean;  // Added isActive to track whether the quiz is active
  createdAt: Timestamp;  // Added createdAt timestamp
}

// ✅ Fixed: Add proper types for CustomSwitch props
interface CustomSwitchProps {
  isActive: boolean;
  onToggle: () => void;
}

const CustomSwitch = ({ isActive, onToggle }: CustomSwitchProps) => (
  <div
    onClick={onToggle}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer 
      ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}
  >
    <span
      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
      ${isActive ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </div>
);


const UploadQuiz = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizSteps, setQuizSteps] = useState<QuizStep[]>(Array(10).fill({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    isActive: true,  // Default to active
    createdAt: Timestamp.now(),  // Set initial timestamp to now
  }));

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const filteredCourses = [];

        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          const quizSubcollectionRef = collection(db, 'courses', courseDoc.id, 'quizes');
          const quizzesSnapshot = await getDocs(quizSubcollectionRef);

          // Only add courses that have no quizzes (empty quizzes subcollection)
          if (quizzesSnapshot.empty) {
            filteredCourses.push({
              id: courseDoc.id,
              courseTitle: courseData.courseTitle,
            });
          }
        }

        setCourses(filteredCourses);  // Only show courses without quizzes
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);


  const handleQuestionChange = (step: number, value: string) => {
    const updatedSteps = [...quizSteps];
    updatedSteps[step - 1] = {
      ...updatedSteps[step - 1],
      question: value,
    };
    setQuizSteps(updatedSteps);
  };

  const handleOptionChange = (step: number, optionIndex: number, value: string) => {
    const updatedSteps = [...quizSteps];
    const updatedOptions = [...updatedSteps[step - 1].options];
    updatedOptions[optionIndex] = value;
    updatedSteps[step - 1] = {
      ...updatedSteps[step - 1],
      options: updatedOptions,
    };
    setQuizSteps(updatedSteps);
  };

  const handleCorrectAnswerChange = (step: number, value: string) => {
    const updatedSteps = [...quizSteps];
    updatedSteps[step - 1] = {
      ...updatedSteps[step - 1],
      correctAnswer: value,
    };
    setQuizSteps(updatedSteps);
  };

  const handleActiveChange = (step: number, value: boolean) => {
    const updatedSteps = [...quizSteps];
    updatedSteps[step - 1] = {
      ...updatedSteps[step - 1],
      isActive: value,
    };
    setQuizSteps(updatedSteps);
  };

  const handleSubmit = async () => {
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
      const quizCollectionRef = collection(db, 'courses', selectedCourse, 'quizes');

      // Upload each quiz question as a separate document
      for (const quiz of quizSteps) {
        if (quiz.question && quiz.correctAnswer) {
          await addDoc(quizCollectionRef, {
            ...quiz,
            timeUpdated: Timestamp.now(),
          });
        }
      }

      // Reset form after successful submission
      setQuizSteps(Array(10).fill({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        isActive: true,  // Default to active
        createdAt: Timestamp.now(),  // Set initial timestamp to now
      }));
      setCurrentStep(1);
      setSelectedCourse('');

    } catch (error) {
      console.error('Error uploading quizzes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    const currentQuiz = quizSteps[step - 1];
    return (
      currentQuiz.question.trim() !== '' &&
      currentQuiz.options.every(option => option.trim() !== '') &&
      currentQuiz.correctAnswer.trim() !== ''
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Course Selection */}
      <div className="mb-8">
        <div className="relative w-full">
          <select
            className="w-full pl-5 pr-8 appearance-none border-2 focus:border-[#2c3e50] focus:outline-none"
            style={{
              color: selectedCourse ? "black" : "gray",
              borderRadius: 10,
              height: 40
            }}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled hidden style={{ color: "gray" }}>
              Select a course...
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id} style={{ color: "#2c3e50", fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, }}>
                {course.courseTitle}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((step) => (
          <button
            key={step}
            onClick={() => setCurrentStep(step)}
            className={`w-8 h-8 rounded-lg   ${step === currentStep
              ? 'bg-[#2c3e50] text-white'
              : isStepValid(step)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200'
              }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Quiz Form */}
      <div className="bg-white rounded-lg" style={{marginTop: -10}}>
        <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: "#2c3e50", paddingBottom: 15 }}>Question {currentStep}:</h2>

        {/* Question Input */}
        <div className="mb-6">
          <label style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>Question</label>
          <input
            type="text"
            value={quizSteps[currentStep - 1].question}
            onChange={(e) => handleQuestionChange(currentStep, e.target.value)}
            className="w-full p-2 rounded-md focus:border-[#2c3e50] focus:outline-none border-2"
            placeholder="Enter your question"
            style={{ height: 40, borderRadius: 10 }}
          />
        </div>

        {/* Options */}
        <div className="mb-6">
          <label style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50", height: 40 }}>Options</label>
          {quizSteps[currentStep - 1].options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(currentStep, index, e.target.value)}
              className="w-full p-2 mb-2 focus:border-[#2c3e50] focus:outline-none border-2"
              placeholder={`Option ${index + 1}`}
              style={{ height: 40, borderRadius: 10 }}
            />
          ))}
        </div>

        {/* Correct Answer */}
        <div className="mb-6">
          <label style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>Correct Answer</label>
          <select
            value={quizSteps[currentStep - 1].correctAnswer}
            onChange={(e) => handleCorrectAnswerChange(currentStep, e.target.value)}
            className="w-full p-2 rounded-md appearance-none focus:border-[#2c3e50] focus:outline-none border-2"
            style={{
              color: quizSteps[currentStep - 1].correctAnswer ? "black" : "gray", borderRadius: 10, height: 40
            }}
          >
            <option value="" disabled style={{ color: "gray" }}>
              Select correct answer...
            </option>
            {quizSteps[currentStep - 1].options.map((option, index) => (
              <option key={index} value={option} style={{ color: "black" }}>
                {option}
              </option>
            ))}
          </select>


        </div>

        {/* Active Status */}
        <div className="mb-6">
          <label style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, color: "#2c3e50" }}>Active Status</label>
          <CustomSwitch
            isActive={quizSteps[currentStep - 1].isActive}
            onToggle={() => handleActiveChange(currentStep, !quizSteps[currentStep - 1].isActive)}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
            style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300 }}
          >
            Previous
          </button>

          {currentStep < 10 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(10, prev + 1))}
              disabled={!isStepValid(currentStep)}
              className="px-4 py-2 bg-[#2c3e50] text-white disabled:opacity-50"
              style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, borderRadius: 10 }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid(currentStep)}
              className="px-4 py-2 bg-green-500 text-white rounded-md disabled:opacity-50"
              style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 300, borderRadius: 10 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit All'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadQuiz;
