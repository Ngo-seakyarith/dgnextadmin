import React from 'react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { X } from 'lucide-react';

interface BlurAlertProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const BlurAlert: React.FC<BlurAlertProps> = ({ message, type = 'success', onClose }) => {
  const baseStyles =
    'fixed top-4 right-4 w-80 backdrop-blur-md border shadow-lg transition-all duration-300 ease-in-out';

  const alertStyles =
    type === 'success'
      ? `${baseStyles} bg-green-50/80 border-green-200 text-green-800`
      : `${baseStyles} bg-red-50/80 border-red-200 text-red-800`;

  return (
    <Alert className={alertStyles}>
      <div className="flex items-center justify-between">
        <AlertDescription className="text-sm font-medium">{message}</AlertDescription>
        <button
          onClick={onClose}
          className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
};

export default BlurAlert;