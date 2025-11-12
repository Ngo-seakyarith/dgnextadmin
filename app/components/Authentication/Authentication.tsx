"use client";
import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/app/lib/config/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Checkbox } from "@/app/components/ui/checkbox";
import AdminDashboard from "@/app/components/Dashboard/AdminDashboard";
import Modal from "@/app/components/ui/Modals";
import loadingAnimation from "@/app/assets/animations/sand-loading.json";
import failedAnimation from "@/app/assets/animations/failed.json";
import successAnimation from "@/app/assets/animations/success.json";
import { Eye, EyeOff, Check, X } from "lucide-react";
import DG from "@/app/assets/animations/login-1.json";
import BGAnimation from "@/app/assets/animations/bg-style3.json";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });


interface FloatingInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  required?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string;
}

interface AuthData {
  email: string;
  password: string;
}

interface SignupData extends AuthData {
  confirmPassword: string;
}

interface ModalConfig {
  show: boolean;
  message: string;
  type: "loading" | "success" | "error";
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

const FloatingInput = ({
  label,
  type,
  value,
  onChange,
  name,
  required,
  showPassword,
  onTogglePassword,
  error,
}: FloatingInputProps) => {
  const isPassword = type === "password";

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          borderRadius: 15,
          fontWeight: 400,
          fontSize: 15,
          color: "#2c3e50",
          borderColor: error ? "#e74c3c" : "#d1d5db"
        }}
        className={`block w-full px-4 h-11 text-sm text-gray-900 bg-transparent border appearance-none focus:outline-none focus:ring-0 peer ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-600"
          }`}
        placeholder=" "
      />
      <label className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 left-3 rounded-lg ${error ? "text-red-500 peer-focus:text-red-500" : "text-gray-500 peer-focus:text-blue-600"
        }`}>
        {label}
      </label>
      {isPassword && (
        <button
          type="button"
          className="absolute inset-y-0 right-3 flex items-center text-gray-500"
          onClick={onTogglePassword}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500" style={{ fontSize: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One special character");
    }

    return { score, feedback };
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#e74c3c", "#f39c12", "#f1c40f", "#2ecc71", "#27ae60"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">Password Strength:</span>
        <span
          className="text-sm font-medium"
          style={{ color: strengthColors[strength.score] }}
        >
          {strengthLabels[strength.score]}
        </span>
      </div>

      <div className="flex gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundColor: i < strength.score ? strengthColors[strength.score] : "#e5e7eb"
            }}
          />
        ))}
      </div>

      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <X size={12} className="text-red-500" />
              {item}
            </div>
          ))}
        </div>
      )}

      {strength.score === 5 && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Check size={12} />
          Password meets all requirements
        </div>
      )}
    </div>
  );
};

export default function AuthPreview() {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    show: false,
    message: "",
    type: "loading",
  });
  const [loginData, setLoginData] = useState<AuthData>({ email: "", password: "" });
  const [signupData, setSignupData] = useState<SignupData>({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowDashboard(false);
        setModalConfig({ show: false, message: "", type: "loading" });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = <T extends AuthData>(
    e: React.ChangeEvent<HTMLInputElement>,
    setData: React.Dispatch<React.SetStateAction<T>>
  ) => {
    const { name, value } = e.target;
    setData((prev: T) => ({ ...prev, [name]: value } as T));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Real-time validation for confirm password (only for signup)
    if (name === "confirmPassword" && "password" in signupData && signupData.password) {
      if (value !== signupData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }

    if (name === "password" && "confirmPassword" in signupData && signupData.confirmPassword) {
      if (value !== signupData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateSignup = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement validation
    if (!agreeTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalConfig({ show: true, message: "Please Wait", type: "loading" });

    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Show success modal after loading
      setModalConfig({ show: true, message: "You have logged in successfully!", type: "success" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again!";
      // Show error modal after loading
      setModalConfig({ show: true, message: `Login failed<br/> ${errorMessage}`, type: "error" });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateSignup()) {
      return;
    }

    setModalConfig({ show: true, message: "Creating your account...", type: "loading" });

    try {
      await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      // Show success modal after loading
      setModalConfig({ show: true, message: "Account created successfully!", type: "success" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed. Please try again!";
      // Show error modal after loading
      setModalConfig({ show: true, message: `Signup failed<br />${errorMessage}`, type: "error" });
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setLoginData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Handle modal close for success and error cases
  const handleModalClose = () => {
    if (modalConfig.type === "success" && isAuthenticated) {
      setShowDashboard(true);
    }
    setModalConfig({ show: false, message: "", type: "loading" });
  };

  if (showDashboard && isAuthenticated) {
    return <AdminDashboard onSignOut={() => signOut(auth)} />;
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
        }}
      >
        <Lottie animationData={BGAnimation} loop={true} />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen">
        <div>
          <Card className="w-full bg-white shadow-lg relative z-10 p-0 overflow-hidden" style={{ borderRadius: 20, width: 800 }}>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 bg-gray-50 flex items-center justify-center">
                <Lottie animationData={DG} loop autoplay style={{ width: 280, height: 280 }} />
              </div>
              <div className="w-full md:w-3/5 p-6">
                <CardHeader className="space-y-1 pt-2 pb-1 px-0">
                  <CardTitle
                    className="text-2xl font-bold text-center"
                    style={{ fontFamily: "'Barlow', sans-serif", fontSize: 20, fontWeight: 600, color: "#2c3e50" }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 400, paddingBottom: "6px", display: "inline-block" }}>
                      Welcome to
                    </span>
                    <br />
                    DG Next Admin Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="relative mb-6 grid w-full grid-cols-2 gap-x-4">
                      <TabsTrigger
                        value="login"
                        className="
                          relative z-10 rounded-[15px] border border-[#f5cba7]
                          px-8 py-3 text-sm font-medium
                          transition-all duration-300 ease-in-out
                          bg-white text-[#2c3e50]
                          hover:bg-[#F0B13B] hover:text-white
                          data-[state=active]:bg-[#e67e22] data-[state=active]:text-white"
                      >
                        SIGN IN
                      </TabsTrigger>

                      <TabsTrigger
                        value="signup"
                        className="
                        relative z-10 rounded-[15px] border border-[#f5cba7]
                        px-8 py-3 text-sm font-medium
                        transition-all duration-300 ease-in-out
                        bg-white text-[#2c3e50]
                        hover:bg-[#F0B13B] hover:text-white
                        data-[state=active]:bg-[#e67e22] data-[state=active]:text-white"
                      >
                        SIGN UP
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <FloatingInput
                          label="Type your email"
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={(e) => handleChange(e, setLoginData)}
                          required
                        />
                        <FloatingInput
                          label="Type your password"
                          type="password"
                          name="password"
                          value={loginData.password}
                          onChange={(e) => handleChange(e, setLoginData)}
                          required
                          showPassword={showLoginPassword}
                          onTogglePassword={() => setShowLoginPassword(!showLoginPassword)}
                        />

                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={setRememberMe}
                          />
                          <label
                            htmlFor="remember"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            style={{ color: "#2c3e50", fontSize: 14, marginTop: 5 }}
                          >
                            Remember me
                          </label>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-[#2c3e50] hover:bg-[#62748E] text-white"
                          style={{ borderRadius: 15, fontWeight: 400, fontSize: 15, color: "#fff", paddingTop: 12, paddingBottom: 12, paddingLeft: 20, paddingRight: 20 }}
                        >
                          LOGIN
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignupSubmit} className="space-y-4">
                        <FloatingInput
                          label="Type your email"
                          type="email"
                          name="email"
                          value={signupData.email}
                          onChange={(e) => handleChange(e, setSignupData)}
                          required
                          error={errors.email}
                        />
                        <FloatingInput
                          label="Type your password"
                          type="password"
                          name="password"
                          value={signupData.password}
                          onChange={(e) => handleChange(e, setSignupData)}
                          required
                          showPassword={showSignupPassword}
                          onTogglePassword={() => setShowSignupPassword(!showSignupPassword)}
                          error={errors.password}
                        />

                        <PasswordStrengthIndicator password={signupData.password} />

                        <FloatingInput
                          label="Type your confirm password"
                          type="password"
                          name="confirmPassword"
                          value={signupData.confirmPassword}
                          onChange={(e) => handleChange(e, setSignupData)}
                          required
                          showPassword={showConfirmPassword}
                          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                          error={errors.confirmPassword}
                        />

                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id="terms"
                            checked={agreeTerms}
                            onCheckedChange={setAgreeTerms}
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            style={{ color: "#2c3e50", fontSize: 14, lineHeight: "1.4", marginTop: 5 }}
                          >
                            I agree to the{" "}
                            <span
                              className="text-[#e67e22] hover:text-[#e67e22] cursor-pointer underline"
                              onClick={() => window.open('/terms', '_blank')}
                            >
                              Terms and Conditions
                            </span>{" "}
                            and{" "}
                            <span
                              className="text-[#e67e22] hover:text-[#e67e22] cursor-pointer underline"
                              onClick={() => window.open('/privacy', '_blank')}
                            >
                              Privacy Policy
                            </span>
                          </label>
                        </div>
                        {errors.terms && (
                          <p className="text-sm text-red-500" style={{ fontSize: 12, marginTop: 4 }}>
                            {errors.terms}
                          </p>
                        )}

                        <Button
                          type="submit"
                          className="w-full bg-[#2c3e50] hover:bg-[#62748E] text-white"
                          style={{ borderRadius: 15, fontWeight: 400, fontSize: 15, color: "#fff", paddingTop: 12, paddingBottom: 12, paddingLeft: 20, paddingRight: 20, border: "1px solid #2c3e50" }}
                        >
                          REGISTER
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        <footer
          className="relative z-10 mt-6 text-center text-sm text-[#2c3e50]"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          ©{new Date().getFullYear()} Powered by DG Next
        </footer>

        {modalConfig.show && (
          <Modal isOpen={modalConfig.show} onClose={handleModalClose}>
            <div className="text-center px-2 py-2">
              {/* ===== LOADING ===== */}
              {modalConfig.type === "loading" && (
                <>
                  <Lottie
                    animationData={loadingAnimation}
                    loop
                    autoplay
                    style={{ width: 150, height: 150, margin: "0 auto" }}
                  />
                </>
              )}

              {/* ===== SUCCESS ===== */}
              {modalConfig.type === "success" && (
                <>

                  <Lottie
                    animationData={successAnimation}
                    loop
                    style={{ width: 150, height: 150, margin: "0 auto" }}
                  />
                  <h2
                    className="text-lg font-semibold mb-3"
                    style={{ fontFamily: "'Barlow', sans-serif", color: "#2ecc71" }}
                  >
                    Login Successfully! <br /> <span style={{ fontSize: 14, fontWeight: 400, color: "#6e737c" }}>Welcome Back.</span>
                  </h2>
                  <Button
                    className="mt-4 bg-[#2c3e50] hover:bg-[#1c2b3a] text-white"
                    onClick={handleModalClose}
                    style={{ borderRadius: 15, fontWeight: 400, fontSize: 15, color: "#fff", paddingTop: 12, paddingBottom: 12, paddingLeft: 20, paddingRight: 20, border: "1px solid #2c3e50" }}
                  >
                    Okay
                  </Button>
                </>
              )}

              {/* ===== ERROR ===== */}
              {modalConfig.type === "error" && (
                <>

                  <Lottie
                    animationData={failedAnimation}
                    loop
                    style={{ width: 150, height: 150, margin: "0 auto" }}
                  />
                  <h2
                    className="text-lg font-semibold mb-3"
                    style={{ fontSize: 16, fontWeight: 800, color: "#e74c3c" }}

                  > Login Failed! <br /> <span style={{ fontSize: 14, fontWeight: 400, color: "#6e737c" }}>Incorrect Email or password <br /> Please try agian.</span>
                  </h2>
                  <Button
                    className="mt-4 bg-[#2c3e50] hover:bg-[#1c2b3a] text-white"
                    onClick={handleModalClose}
                    style={{ borderRadius: 15, fontWeight: 400, fontSize: 15, color: "#fff", paddingTop: 12, paddingBottom: 12, paddingLeft: 20, paddingRight: 20, border: "1px solid #2c3e50" }}
                  >
                    Okay
                  </Button>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}