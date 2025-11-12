import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';

// 1️⃣ Declare the prop types
interface ModalEditProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

// 2️⃣ Use the interface
const ModalEdit: React.FC<ModalEditProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-7xl mx-auto p-6 max-h-[90vh] overflow-y-auto rounded-lg shadow-lg">
        <Card className="w-full" style={{ borderRadius: 15, padding: 0 }}>
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-6 p-4 border-b">
              <h3 className="font-bold text-xl text-[#2c3e50]">{title}</h3>
              <Button
                onClick={onClose}
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                style={{ borderRadius: 15 }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModalEdit;