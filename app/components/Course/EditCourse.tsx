import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { X, Plus, Trash2 } from 'lucide-react';

interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  title: string;
  content: string;
  videoUrl?: string; // Added optional videoUrl to match usage
}

interface Course {
  courseTitle: string;
  categories: string;
  instructor: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isActive: boolean;
  thumbnail: string;
  profileimg: string;
  modules: { [key: string]: Module };
}

interface EditCourseProps {
  courseId: string;
  onClose: () => void;
  onUpdate: () => void;
}

// Define interface for CustomSwitch props
interface CustomSwitchProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
}

const CustomSwitch = ({ isActive, onToggle }: CustomSwitchProps) => (
  <button
    onClick={() => onToggle(!isActive)}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 
      ${isActive ? "bg-green-500" : "bg-gray-400"}`}
  >
    <span
      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 
      ${isActive ? "translate-x-6" : "translate-x-0"}`}
    />
  </button>
);

export default function EditCourse({ courseId, onClose, onUpdate }: EditCourseProps) {
  const [course, setCourse] = useState<Course>({
    courseTitle: '',
    categories: '',
    instructor: '',
    price: 0,
    level: 'Beginner',
    isActive: true,
    thumbnail: '',
    profileimg: '',
    modules: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFree, setIsFree] = useState(course.price === 0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (courseSnap.exists()) {
          const data = courseSnap.data() as Course;
          setCourse({
            courseTitle: data.courseTitle || '',
            categories: data.categories || '',
            instructor: data.instructor || '',
            price: data.price || 0,
            level: data.level || 'Beginner',
            isActive: data.isActive ?? true,
            thumbnail: data.thumbnail || '',
            profileimg: data.profileimg || '',
            modules: data.modules || {},
          });
          setIsFree(data.price === 0);
        } else {
          setError('Course not found');
        }
      } catch (err) {
        setError('Error fetching course');
        console.error(err);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCourse((prev) => ({
      ...prev,
      [name]: name === "price"
        ? value.toLowerCase() === "free" ? 0 : parseFloat(value) || 0
        : value
    }));
  };

  const handleModuleChange = (key: string, field: string, value: string) => {
    setCourse(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: {
          ...prev.modules[key],
          [field]: value
        }
      }
    }));
  };

  const handleLessonChange = (moduleKey: string, lessonIndex: number, field: string, value: string) => {
    setCourse(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: {
          ...prev.modules[moduleKey],
          lessons: prev.modules[moduleKey].lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex ? { ...lesson, [field]: value } : lesson
          )
        }
      }
    }));
  };

  const addModule = () => {
    const newModuleKey = `module_${Date.now()}`;
    const newModuleIndex = Object.keys(course.modules).length + 1;

    setCourse(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [newModuleKey]: {
          title: '',
          description: '',
          lessons: [],
          index: newModuleIndex
        }
      }
    }));
  };

  const removeModule = (key: string) => {
    setCourse(prev => {
      const updatedModules = { ...prev.modules };
      delete updatedModules[key];
      return { ...prev, modules: updatedModules };
    });
  };

  const addLesson = (moduleKey: string) => {
    setCourse(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: {
          ...prev.modules[moduleKey],
          lessons: [...prev.modules[moduleKey].lessons, { title: '', content: '', videoUrl: '' }]
        }
      }
    }));
  };

  const removeLesson = (moduleKey: string, lessonIndex: number) => {
    setCourse(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: {
          ...prev.modules[moduleKey],
          lessons: prev.modules[moduleKey].lessons.filter((_, i) => i !== lessonIndex)
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const courseRef = doc(db, 'courses', courseId);
      // Ensure course is a plain object compatible with Firestore
      const courseData = {
        courseTitle: course.courseTitle,
        categories: course.categories,
        instructor: course.instructor,
        price: course.price,
        level: course.level,
        isActive: course.isActive,
        thumbnail: course.thumbnail,
        profileimg: course.profileimg,
        modules: Object.keys(course.modules).reduce((acc, key) => {
          acc[key] = {
            title: course.modules[key].title,
            description: course.modules[key].description,
            lessons: course.modules[key].lessons.map(lesson => ({
              title: lesson.title,
              content: lesson.content,
              videoUrl: lesson.videoUrl || '',
            })),
          };
          return acc;
        }, {} as { [key: string]: Module }),
      };
      await updateDoc(courseRef, courseData);
      onUpdate();
      onClose();
    } catch (err) {
      setError('Error updating course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-10">
        <DialogHeader>
          <DialogTitle style={{ textAlign: "center" }}>Edit Course</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="space-y-4">
            <div>
              <Label htmlFor="courseTitle">Course Title:</Label>
              <Input
                id="courseTitle"
                name="courseTitle"
                value={course.courseTitle}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="categories">Categories:</Label>
              <Input
                id="categories"
                name="categories"
                value={course.categories}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="instructor">Instructor:</Label>
              <Input
                id="instructor"
                name="instructor"
                value={course.instructor}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price:</Label>
              <div className="flex items-center gap-4">
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priceOption"
                      value="free"
                      checked={isFree}
                      onChange={() => setIsFree(true)}
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
                      onChange={() => setIsFree(false)}
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
                <div className="text-gray-600" style={{ borderWidth: 1, paddingTop: 7, paddingBottom: 7, borderRadius: 5, paddingLeft: 10 }}>Free</div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-2">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={course.price}
                    onChange={handleInputChange}
                    className="w-full pl-6"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="level">Level:</Label>
              <Select
                value={course.level}
                onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') =>
                  setCourse(prev => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#fff" }}>
                  <SelectItem value="Beginner" className="hover:bg-gray-200 hover:rounded-lg">
                    Beginner
                  </SelectItem>
                  <SelectItem value="Intermediate" className="hover:bg-gray-200 hover:rounded-lg">
                    Intermediate
                  </SelectItem>
                  <SelectItem value="Advanced" className="hover:bg-gray-200 hover:rounded-lg">
                    Advanced
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="isActive">Active Status:</Label>
              <CustomSwitch
                isActive={course.isActive}
                onToggle={(checked) => setCourse(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL:</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                value={course.thumbnail}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="profileimg">Profile Image URL</Label>
              <Input
                id="profileimg"
                name="profileimg"
                value={course.profileimg}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Modules:</Label>
                <Button type="button" onClick={addModule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>

              {Object.keys(course.modules)
                .sort((a, b) => {
                  const moduleA = course.modules[a];
                  const moduleB = course.modules[b];
                  return (moduleA.title > moduleB.title) ? 1 : -1;
                })
                .map((moduleKey, index) => {
                  const currentModule = course.modules[moduleKey]; // Changed 'module' to 'currentModule'
                  return (
                    <Card key={moduleKey} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-semibold">{index + 1}. {currentModule.title}</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => removeModule(moduleKey)}
                            style={{ backgroundColor: "#EF4444", color: "#fff" }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Module Title:</Label>
                          <Input
                            placeholder="Module Title"
                            value={currentModule.title}
                            onChange={(e) => handleModuleChange(moduleKey, 'title', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Lessons:</Label>
                            <Button
                              type="button"
                              onClick={() => addLesson(moduleKey)}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Lesson
                            </Button>
                          </div>

                          {currentModule.lessons?.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="space-y-2 p-2 border rounded">
                              <div className="flex justify-between items-center">
                                <Input
                                  placeholder="Lesson Title"
                                  value={lesson.title}
                                  onChange={(e) => handleLessonChange(moduleKey, lessonIndex, 'title', e.target.value)}
                                  className="mr-2"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => removeLesson(moduleKey, lessonIndex)}
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Lesson Description"
                                value={lesson.content}
                                onChange={(e) => handleLessonChange(moduleKey, lessonIndex, 'content', e.target.value)}
                              />
                              <Input
                                placeholder="Lesson Video URL"
                                value={lesson.videoUrl || ''}
                                onChange={(e) => handleLessonChange(moduleKey, lessonIndex, 'videoUrl', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={loading ? 'cursor-not-allowed' : ''}
              style={{ backgroundColor: "#2c3e50", color: "#fff" }}
            >
              {loading ? 'Updating...' : 'Update Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}