import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/app/components/ui/button"; // Assuming you have a custom button component
import lottieJson from "@/app/assets/animations/signout.json"; // Path to your Lottie JSON file
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const SignOutModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 p-6 bg-white shadow-lg" style={{borderRadius: 15}}>
          {/* <Dialog.Close style={{borderRadius: 15, border: "0px solid #ffffff00"}}>
            <button className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700" style={{borderRadius: 15, border: "0px solid #ffffff00"}}>
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close> */}

          {/* Lottie Animation */}
          <div className="flex justify-center mb-4">
            <Lottie animationData={lottieJson} loop={true} style={{height: 150, width: 150}} />
          </div>

          {/* Dialog Title */}
          <Dialog.Title className=" text-center" style={{fontWeight: 800, fontSize: 16, color: "#2c3e50"}}>
            Are you sure?
          </Dialog.Title>
          <Dialog.Title className=" text-center" style={{ fontWeight: 400, fontSize: 14, color: "#6e737c"}}>
            You want to sing out.
          </Dialog.Title>

          <div className="mt-4 flex justify-center space-x-4">
            <Button className="bg-gray-200" onClick={onClose} style={{paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40, borderRadius: 15, fontSize: 15, fontWeight: 400 }}>Cancel</Button>
            <Button onClick={onConfirm} className="bg-red-600 text-white hover:bg-red-700" style={{paddingTop: 10, paddingBottom: 10, paddingLeft: 40, paddingRight: 40, borderRadius: 15, fontSize: 15, fontWeight: 400}}>Sign Out</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SignOutModal;
