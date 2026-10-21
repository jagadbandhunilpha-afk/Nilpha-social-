import React, { createContext, useContext, useState } from 'react';

interface NoticeContextType {
  modalNotice: {
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  };
  openNotice: (title: string, message: string, details?: string) => void;
  closeNotice: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export const NoticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalNotice, setModalNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [toast, setToast] = useState<string | null>(null);

  const openNotice = (title: string, message: string, details?: string) => {
    setModalNotice({
      isOpen: true,
      title,
      message,
      details,
    });
  };

  const closeNotice = () => {
    setModalNotice((prev) => ({ ...prev, isOpen: false }));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  return (
    <NoticeContext.Provider value={{ modalNotice, openNotice, closeNotice, toast, showToast }}>
      {children}
    </NoticeContext.Provider>
  );
};

export const useNotice = (): NoticeContextType => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within a NoticeProvider');
  }
  return context;
};
