// // src/components/ui/modal.tsx

// import React from 'react';
// import { Dialog, DialogOverlay, DialogContent } from '@headlessui/react';
// import { Button } from './button'; // Import the Button component you have

// interface ModalProps {
//   open: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
// }

// export const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
//   return (
//     <Dialog open={open} onClose={onClose}>
//       <DialogOverlay className="fixed inset-0 bg-black opacity-50" />
//       <DialogContent className="fixed inset-0 flex items-center justify-center z-50">
//         <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">{children}</div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// interface ModalHeaderProps {
//   children: React.ReactNode;
// }

// export const ModalHeader: React.FC<ModalHeaderProps> = ({ children }) => {
//   return (
//     <div className="text-xl font-semibold mb-4">
//       {children}
//     </div>
//   );
// };

// interface ModalBodyProps {
//   children: React.ReactNode;
// }

// export const ModalBody: React.FC<ModalBodyProps> = ({ children }) => {
//   return (
//     <div className="mb-4 text-sm text-gray-700">
//       {children}
//     </div>
//   );
// };

// interface ModalFooterProps {
//   children: React.ReactNode;
// }

// export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
//   return (
//     <div className="flex justify-end space-x-2">
//       {children}
//     </div>
//   );
// };

// interface ModalContentProps {
//   children: React.ReactNode;
// }

// export const ModalContent: React.FC<ModalContentProps> = ({ children }) => {
//   return <div>{children}</div>;
// };
