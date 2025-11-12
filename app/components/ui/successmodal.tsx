import React from 'react';
import { Button } from '@/app/components/ui/button';

interface SuccessModalProps {
  showModal: boolean;
  message: string;
  onClose: () => void;
  success: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ showModal, message, onClose, success }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
        <div className="text-xl font-semibold">{success ? 'Success' : 'Error'}</div>
        <div className="mt-4">{message}</div>
        <div className="mt-4 flex justify-end">
          <Button  onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
