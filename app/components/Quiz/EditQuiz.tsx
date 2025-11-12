import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

interface QuizQuestion {
  id?: string;  // Optional, for editing
  courseId: string;  // Ensure we pass courseId when editing or creating a quiz
  question: string;
  options: string[];
  correctAnswer: string;
  isActive: boolean;
}

interface EditQuizProps {
  quiz?: QuizQuestion;
  onCancel: () => void;
}

interface CustomSwitchProps {
  isActive: boolean;
  onToggle: () => void;
}

const CustomSwitch = ({ isActive, onToggle }: CustomSwitchProps) => (
  <div
    onClick={onToggle}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer 
      ${isActive ? "bg-green-500" : "bg-gray-400"}`}
  >
    <span
      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
      ${isActive ? "translate-x-6" : "translate-x-0"}`}
    />
  </div>
);

const EditQuiz = ({ quiz, onCancel }: EditQuizProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (quiz) {
      setQuestion(quiz.question || '');
      setOptions(quiz.options || ['', '', '', '']);
      setCorrectAnswer(quiz.correctAnswer || '');
      setIsActive(quiz.isActive ?? true);
    }
  }, [quiz]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleUpdate = async () => {
    if (!quiz?.courseId) {
      console.error("Course ID is missing");
      return;
    }
  
    try {
      const quizRef = quiz?.id
        ? doc(db, 'courses', quiz.courseId, 'quizes', quiz.id)  // Updating existing quiz
        : doc(collection(db, 'courses', quiz.courseId, 'quizes')); // Creating new quiz
  
      const quizData = {
        question,
        options,
        correctAnswer,
        isActive,
      };
  
      if (quiz?.id) {
        await updateDoc(quizRef, quizData);  // Update existing quiz
      } else {
        await setDoc(quizRef, quizData);  // Create new quiz
      }
  
      onCancel();  // Close the form after saving
    } catch (error) {
      console.error("Error updating or creating quiz:", error);
    }
  };
  

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <Input
              key={index}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
          ))}
        </div>

        <div>
          <Label htmlFor="correctAnswer">Correct Answer</Label>
          <select
            id="correctAnswer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select correct answer...</option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="isActive">Active Status</Label>
          <CustomSwitch
            isActive={isActive}
            onToggle={() => setIsActive(!isActive)}
          />
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={handleUpdate} style={{ backgroundColor: '#2c3e50', color: "#fff"}}>Save</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default EditQuiz;
