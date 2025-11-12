'use client';

import { useState } from 'react';
import { db } from '@/app/lib/config/firebase';
import { setDoc, doc } from 'firebase/firestore';
import SuccessLotie from '@/app/assets/animations/success.json';
import FailedLotie from '@/app/assets/animations/failed.json';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Pencil, Link, FileText, Video, Type, Link2, File, List, Trash2 } from 'lucide-react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import Image from 'next/image';
import dynamic from 'next/dynamic';

// Define content type for the content state
type ContentType = 'text' | 'subtext' | 'headline' | 'subheadline' | 'bullet' | 'image' | 'video' | 'link' | 'file';
interface ContentItem {
  type: ContentType;
  value: string;
}

export default function BlogPostForm() {
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [featureImage, setFeatureImage] = useState<string>('');
  const [content, setContent] = useState<ContentItem[]>([{ type: 'text', value: '' }]);
  const [reference, setReference] = useState<string>('');
  const [modal, setModal] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFeatureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureImage(e.target.value);
  };

  const addContent = (type: ContentType) => setContent([...content, { type, value: '' }]);

  const handleContentChange = (index: number, value: string) => {
    const newContent = [...content];
    newContent[index].value = value;
    setContent(newContent);
  };

  const removeContent = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if ('key' in e && e.key === 'Enter' && tagInput.trim()) {
      const newTag: string = tagInput.split(',')[0].trim();
      if (newTag) {
        setTags([...tags, newTag]);
        setTagInput(tagInput.replace(newTag, '').replace(/^,\s*/, '').trim());
      }
      e.preventDefault();
    } else if (e.type === 'change') {
      setTagInput((e as React.ChangeEvent<HTMLInputElement>).target.value);
    }
  };

  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setTagInput('');
    setTags([]);
    setFeatureImage('');
    setContent([{ type: 'text', value: '' }]);
    setReference('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || content.some((item) => item.type === 'text' && !item.value.trim())) {
      setModal({ show: true, success: false, message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);

    const inputTags = tagInput.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');
    const allTags = inputTags.length > 0 || tags.length > 0 ? Array.from(new Set([...tags, ...inputTags])) : ['Nothing Tag'];
    const docId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      const featureImageUrl = featureImage || '';
      const processedContent = content.map((item) => ({
        type: item.type,
        value: item.value,
      }));

      await setDoc(doc(db, 'blogPosts', docId), {
        title,
        author,
        tags: allTags,
        featureImage: featureImageUrl,
        content: processedContent,
        reference: reference || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setModal({ show: true, success: true, message: 'Blog post submitted successfully!' });
      resetForm();
    } catch (error) {
      console.error('Error submitting blog post:', error);
      setModal({ show: true, success: false, message: 'Failed to submit blog post. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => setModal({ show: false, success: false, message: '' });

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-4 space-y-4"
        style={{
          width: 700,
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow:
            '0 -4px 6px rgba(196, 196, 196, 0.1), 4px 4px 10px rgba(182, 182, 182, 0.1), -4px 4px 10px rgba(226, 226, 226, 0.1), 0 4px 6px rgba(212, 212, 212, 0.1)',
          borderRadius: 15,
          borderColor: '#fff',
          padding: 25,
        } as React.CSSProperties}
      >
        <div>
          <Label htmlFor="title" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Title:
          </Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="w-full p-2 border"
            style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
          />
        </div>
        <div>
          <Label htmlFor="author" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Author:
          </Label>
          <Input
            id="author"
            type="text"
            value={author}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)}
            placeholder="Enter author name"
            className="w-full p-2 border rounded"
            style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
          />
        </div>
        <div>
          <Label htmlFor="featureImage" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Feature Image URL:
          </Label>
          <Input
            id="featureImage"
            type="url"
            value={featureImage}
            onChange={handleFeatureImage}
            placeholder="Enter image URL"
            className="w-full p-2 border"
            style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
          />
          {featureImage && (
            <Image
              src={featureImage}
              alt="Feature Preview"
              className="mt-2 w-32 h-32 object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>
        <div>
          <Label htmlFor="tags" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Tags:
          </Label>
          <Input
            id="tags"
            type="text"
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagInput}
            placeholder="Type a tag and press Enter (e.g., AI, Leadership)"
            className="w-full p-2 border"
            style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center bg-gray-200 px-2 py-1 rounded">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2 text-red-500 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Content:
          </Label>
          {content.map((item, index) => (
            <div key={index} className="space-y-2 relative">
              <button
                type="button"
                onClick={() => removeContent(index)}
                className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700"
                title="Remove this content"
              >
                <Trash2 size={18} />
              </button>
              {item.type === 'text' || item.type === 'subtext' || item.type === 'headline' || item.type === 'subheadline' || item.type === 'bullet' ? (
                <textarea
                  value={item.value}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(index, e.target.value)}
                  placeholder={item.type === 'bullet' ? 'Enter bullet points (one per line)' : `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} content`}
                  className="w-full p-2 border pr-10"
                  style={{ borderRadius: 10, marginTop: 0, minHeight: item.type === 'bullet' ? '150px' : '100px' } as React.CSSProperties}
                />
              ) : (
                <div>
                  <Input
                    type={item.type === 'file' ? 'text' : 'url'}
                    value={item.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleContentChange(index, e.target.value)}
                    placeholder={`Enter ${item.type} URL`}
                    className="w-full p-2 border pr-10"
                    style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
                  />
                  {(item.type === 'image' || item.type === 'video') && item.value && (
                    item.type === 'image' ? (
                      <Image
                        src={item.value}
                        alt="Content Preview"
                        className="mt-2 w-32 h-32 object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <video
                        src={item.value}
                        controls
                        className="mt-2 w-32 h-32 object-cover"
                        onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => (e.currentTarget.style.display = 'none')}
                      />
                    )
                  )}
                </div>
              )}
              {item.type === 'bullet' && item.value && (
                <div className="mt-2 pl-4">
                  {item.value.split('\n').map((line, i) => (
                    line.trim() && (
                      <div key={i} className="flex items-start">
                        <span className="mr-2"></span>
                        <span>{line.trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addContent('text')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Pencil size={18} className="mr-2" /> Add Text
            </button>
            <button
              type="button"
              onClick={() => addContent('bullet')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <List size={18} className="mr-2" /> Add Bullet Text
            </button>
            <button
              type="button"
              onClick={() => addContent('subtext')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <FileText size={18} className="mr-2" /> Add Sub Text
            </button>
            <button
              type="button"
              onClick={() => addContent('headline')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Type size={18} className="mr-2" /> Add Headline
            </button>
            <button
              type="button"
              onClick={() => addContent('subheadline')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Type size={18} className="mr-2" /> Add Sub Headline
            </button>
            <button
              type="button"
              onClick={() => addContent('image')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Link size={18} className="mr-2" /> Add Image By URL
            </button>
            <button
              type="button"
              onClick={() => addContent('video')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Video size={18} className="mr-2" /> Add Video By URL
            </button>
            <button
              type="button"
              onClick={() => addContent('link')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <Link2 size={18} className="mr-2" /> Add Link
            </button>
            <button
              type="button"
              onClick={() => addContent('file')}
              className="px-4 py-2 text-[#2c3e50] flex items-center"
              style={{ borderRadius: 10, backgroundColor: 'transparent', border: '1px solid #2c3e50', height: '40px' } as React.CSSProperties}
            >
              <File size={18} className="mr-2" /> Add File By URL
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="reference" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, color: '#2c3e50' } as React.CSSProperties}>
            Reference (Optional):
          </Label>
          <Input
            id="reference"
            type="text"
            value={reference}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
            placeholder="Enter reference"
            className="w-full p-2 border rounded"
            style={{ borderRadius: 10, marginTop: 5 } as React.CSSProperties}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ borderRadius: 10 } as React.CSSProperties}
          className={`w-full p-2 ${isSubmitting ? 'bg-[#2c3e50] opacity-70' : 'bg-[#2c3e50]'} text-white`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </form>

      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div
            className="bg-white p-6 shadow-lg max-w-sm w-full text-center flex flex-col items-center justify-center"
            style={{ borderRadius: 15 } as React.CSSProperties}
          >
            {modal.success ? (
              <Lottie
                autoplay
                loop={false}
                animationData={SuccessLotie}
                style={{ height: '150px', width: '150px' } as React.CSSProperties}
              />
            ) : (
              <Lottie
                autoplay
                loop={false}
                animationData={FailedLotie}
                style={{ height: '150px', width: '150px' } as React.CSSProperties}
              />
            )}
            <h2 className={`text-xl font-bold ${modal.success ? 'text-green-600' : 'text-red-600'}`}>
              {modal.success ? 'Success' : 'Error'}
            </h2>
            <p className="mt-2">{modal.message}</p>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-gray-500 text-white hover:bg-gray-600"
              style={{ borderRadius: 10 } as React.CSSProperties}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}