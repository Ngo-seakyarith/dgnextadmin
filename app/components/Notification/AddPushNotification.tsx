// src/components/PushNotification.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, doc, setDoc, getDocs, query, Timestamp, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/app/lib/config/firebase';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { cn } from '@/app/lib/untils/utils';
import successAnimation from '@/app/assets/animations/success.json';
import errorAnimation from '@/app/assets/animations/failed.json';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Imagedefault from "@/app/assets/png/image-gallery.png"

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

/* -------------------------------------------------
   Types
------------------------------------------------- */
interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: {
    someData: string;
    thumbnailUrl?: string;
  };
  android: { notification: { icon: string; color: string } };
  ios: { sound: boolean; badge: number };
}

/* -------------------------------------------------
   Modern Toggle Switch Component
------------------------------------------------- */
interface ModernSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({ checked, onCheckedChange, id, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00C851] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-gradient-to-r from-[#00C851] to-[#00C851]"
          : "bg-gray-200 hover:bg-gray-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out",
          checked ? "translate-x-5 shadow-xl" : "translate-x-0"
        )}
      />
    </button>
  );
};

/* -------------------------------------------------
   Main component
------------------------------------------------- */
const PushNotification = () => {
  /* ---------- form state ---------- */
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [notifName, setNotifName] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [androidOn, setAndroidOn] = useState(true);
  const [iosOn, setIosOn] = useState(true);

  /* ---------- UI state ---------- */
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null);
  const [modalMessage, setModalMessage] = useState('');

  /* ---------- helpers ---------- */
  const getUserPushTokens = async (): Promise<string[]> => {
  const tokens: string[] = [];
  const snap = await getDocs(collection(db, 'users'));
  snap.forEach((d) => {
    const arr = d.data().pushTokens;
    console.log('>>> RAW pushTokens field for user', d.id, ':', arr);
    if (Array.isArray(arr)) {
      tokens.push(...arr.filter((token: string) => !token.startsWith('ExponentPushToken') && token.length > 50));
    }
  });
  const uniq = [...new Set(tokens)];
  console.log('>>> FINAL TOKENS:', uniq);
  return uniq;
};

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return imageUrl; // external URL or empty
    const name = `notifications/${Date.now()}_${imageFile.name}`;
    const snap = await uploadBytes(ref(storage, name), imageFile);
    return await getDownloadURL(snap.ref);
  };

  const sendPushNotification = async (token: string, img: string) => {
    const msg: PushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: { someData: 'compose' },
      android: androidOn
        ? { notification: { icon: 'notification-icon', color: '#2c3e50' } }
        : { notification: { icon: '', color: '' } },
      ios: iosOn ? { sound: true, badge: 1 } : { sound: false, badge: 0 },
    };
    if (img) msg.data.thumbnailUrl = img;

    const res = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    if (!res.ok) throw new Error('FCM error');
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await getUserPushTokens();
      if (tokens.length === 0) throw new Error('No push tokens found');

      const img = await uploadImage();

      // 1) Save draft / log
      await setDoc(doc(collection(db, 'notifications')), {
        name: notifName || null,
        title,
        body,
        imageUrl: img,
        androidEnabled: androidOn,
        iosEnabled: iosOn,
        status: sendNow ? 'sent' : 'draft',
        createdAt: serverTimestamp(),
        targetCount: tokens.length,
      });

      // 2) Send now or stop here
      if (sendNow) {
        await Promise.all(tokens.map((t) => sendPushNotification(t, img)));
      }

      setTitle('');
      setBody('');
      setImageUrl('');
      setImageFile(null);
      setNotifName('');
      setModalType('success');
      setModalMessage(sendNow ? 'Notification sent!' : 'Draft saved');
    } catch (err: any) {
      setModalType('error');
      setModalMessage(err.message);
    } finally {
      setModalOpen(true);
      setLoading(false);
    }
  };

  /* ---------- image drop ---------- */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl('');
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalMessage('');
  };

  /* -------------------------------------------------
     Device-preview box (modernized)
  ------------------------------------------------- */
  const DevicePreview = () => (
    <div className="relative border border-gray-200/80 p-6 bg-gradient-to-br from-gray-50/80 to-white backdrop-blur-sm" style={{ borderRadius: 25 }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>Live Preview</div>
      </div>
      {/* Modern phone frame */}
      <div className="w-72 mx-auto relative">
        <div style={{ borderRadius: 25, padding: 10, border: "1px solid #dadada" }}>
          <div className=" relative overflow-hidden" style={{ padding: 5 }}>
            <div className="bg-[#2c3e50] h-7 relative" style={{ borderTopRightRadius: 13, borderTopLeftRadius: 13 }}>
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#fff] rounded-full"></div>
            </div>
            <div className="p-4 space-y-3 bg-#cc3535-50 min-h-[120px]" style={{ borderBottomRightRadius: 13, borderBottomLeftRadius: 13, backgroundColor: "#f1f1f194" }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl  overflow-hidden border border-[#2c3e50]flex-shrink-0">
                  {(imageFile || imageUrl) ? (
                    <Image
                      src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image src={Imagedefault} alt="" height={48} width={48} style={{ padding: 10 }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                    {title || 'Notification title'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {body || 'Your notification message will appear here'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-[12px] text-gray-400 mt-3 text-center">
        Preview may vary by device and OS version
      </div>
    </div>
  );

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className=" bg-white/80 border-0" style={{ paddingRight: 20, paddingLeft: 20, paddingTop: 50, paddingBottom: 30, borderRadius: 25 }}>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* -----  main content grid  ----- */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Title input */}
                    <div className="space-y-2">
                      <Label className="cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50", marginBottom: 10 }}>
                        Notification Title
                      </Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter an eye-catching title"
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    {/* Body textarea */}
                    <div className="space-y-2">
                      <Label className="cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50", marginBottom: 10 }}>
                        Message Content
                      </Label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your notification message here..."
                        rows={4}
                        className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      />
                    </div>

                    {/* Image upload */}
                    <div className="space-y-3">
                      <Label className="cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        Notification Image
                        <span className="text-gray-500" style={{ fontSize: 15 }}>(optional)</span>
                      </Label>
                      <Input
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }}
                        placeholder="https://example.com/image.png"
                        className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                      <div className=" text-gray-500 px-1" style={{ fontSize: 14, textAlign: "center" }}>or drag and drop an image below</div>
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80",
                          isDragActive
                            ? "border-purple-400 bg-purple-50/80 text-purple-600"
                            : imageFile
                              ? "border-green-400 bg-green-50/80 text-green-600"
                              : "border-gray-300 hover:border-gray-400 text-gray-500"
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="space-y-2">
                          {isDragActive ? (
                            <>
                              <svg className="w-8 h-8 mx-auto text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm font-medium">Drop your image here</p>
                            </>
                          ) : imageFile ? (
                            <>
                              <svg className="w-8 h-8 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm font-medium">{imageFile.name}</p>
                              <p className="text-xs">Click to change or drag another image</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm">Drag & drop an image, or click to browse</p>
                              <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notification name */}
                    <div className="space-y-2">
                      <Label className="cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50", marginBottom: 10 }}>
                        Campaign Name
                        <span className=" text-gray-500" style={{ fontSize: 15 }}>(for your reference)</span>
                      </Label>
                      <Input
                        value={notifName}
                        onChange={(e) => setNotifName(e.target.value)}
                        placeholder="e.g., Summer Sale Announcement"
                        className="h-11 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* -----  right: preview  ----- */}
                  <DevicePreview />
                </div>

                {/* -----  platform toggles (modernized)  ----- */}
                <div className="bg-gradient-to-r from-gray-50/80 to-white rounded-2xl p-6 border border-gray-200/50">
                  <h3 className=" mb-4 flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Target Platforms
                  </h3>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <ModernSwitch id="android" checked={androidOn} onCheckedChange={setAndroidOn} />
                      <Label htmlFor="android" className="cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1518-.5712.416.416 0 00-.5712.1518l-2.0223 3.503C15.5902 8.7326 13.8452 8.1934 12 8.1934s-3.5902.5392-5.1367 1.2652L4.841 5.9554a.4161.4161 0 00-.5712-.1518.416.416 0 00-.1518.5712L6.0955 9.321C3.9851 10.8113 2.6667 13.2854 2.6667 16v5.3333C2.6667 21.7043 3.2957 22.3333 4.0001 22.3333h15.9999c.7043 0 1.3333-.6290 1.3333-1.3333V16c-.0001-2.7146-1.3185-5.1887-3.4289-6.6786" />
                          </svg>
                        </div>
                        Android
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <ModernSwitch id="ios" checked={iosOn} onCheckedChange={setIosOn} />
                      <Label htmlFor="ios" className=" cursor-pointer flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                        </div>
                        IOS
                      </Label>
                    </div>
                  </div>
                </div>

                {/* -----  scheduling (modernized)  ----- */}
                <div className="bg-gradient-to-r from-[#fff] to-[#fff] p-6 border border-blue-200/50" style={{ borderRadius: 15 }}>
                  <h3 className=" mb-4 flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, color: "#2c3e50" }}>
                    Delivery Options
                  </h3>
                  <div className="flex items-center gap-3">
                    <ModernSwitch id="sendNow" checked={sendNow} onCheckedChange={setSendNow} />
                    <Label htmlFor="sendNow" className=" cursor-pointer" style={{ fontSize: 15, fontWeight: 400, color: "#2c3e50" }}>
                      {sendNow ? 'Send immediately' : 'Save as draft'}
                    </Label>
                    {!sendNow && (
                      <span className=" bg-amber-100  ml-2" style={{ fontSize: 14, borderRadius: 10, fontWeight: 400, paddingTop: 5, paddingBottom: 5, paddingRight: 8, paddingLeft: 8 }}>
                        Draft Mode
                      </span>
                    )}
                  </div>
                </div>

                {/* -----  actions (modernized)  ----- */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ fontWeight: 400, fontSize: 15, color: "#fff", borderRadius: 15, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15 }}
                    className="relative bg-gradient-to-r from-[#2c3e50] to-[#2c3e50] hover:from-[#45556C] hover:to-[#45556C]transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {loading ? 'Sending...' : sendNow ? 'Send Notification' : 'Save Draft'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setBody('');
                      setImageUrl('');
                      setImageFile(null);
                      setNotifName('');
                    }}
                    style={{ borderRadius: 15, backgroundColor: "#F3F4F6", color: "#2c3e50", fontWeight: 400, fontSize: 15, paddingTop: 10, paddingBottom: 10, paddingRight: 15, paddingLeft: 15 }}
                    className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Clear All
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* -----  result modal (modernized) ----- */}
      <CenteredModal
        modalOpen={modalOpen}
        closeModal={closeModal}
        modalType={modalType!}
        modalMessage={modalMessage}
        successAnimation={successAnimation}
        errorAnimation={errorAnimation}
      />
    </>
  );
};

/* -------------------------------------------------
   Modernized modal component
------------------------------------------------- */
interface CenteredModalProps {
  modalOpen: boolean;
  closeModal: () => void;
  modalType: 'success' | 'error';
  modalMessage: string;
  successAnimation: unknown;
  errorAnimation: unknown;
}

const CenteredModal: React.FC<CenteredModalProps> = ({
  modalOpen,
  closeModal,
  modalType,
  modalMessage,
  successAnimation,
  errorAnimation
}) => {
  if (!modalOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={closeModal}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 max-w-sm w-11/12 text-center z-50 shadow-2xl shadow-black/10 border border-gray-200/50 backdrop-blur-sm">
        <div className="mb-4">
          <Lottie
            animationData={modalType === 'success' ? successAnimation : errorAnimation}
            loop
            autoplay
            className="w-25 h-25 mx-auto"
          />
        </div>
        <h3 className={cn(
          "text-xl font-bold mb-2",
          modalType === 'success' ? 'text-green-600' : 'text-red-600'
        )}>
          {modalType === 'success' ? 'Success!' : 'Error'}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {modalMessage}
        </p>
        <Button
          onClick={closeModal}
          style={{ backgroundColor: '#E7E5E4', borderRadius: 15, fontSize: 15, fontWeight: 400, paddingTop: 10, paddingBottom: 10 }}
          className={cn(
            "w-full transition-all duration-200",
            modalType === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white '
          )}
        >
          Got it
        </Button>
      </div>
    </>
  );
};

export default PushNotification;