import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface NewTaskModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  setIsOpen: (open: boolean) => void;
}

const NewTaskModalContext = createContext<NewTaskModalContextType | null>(null);

export function NewTaskModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <NewTaskModalContext.Provider value={{ isOpen, openModal, closeModal, setIsOpen }}>
      {children}
    </NewTaskModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNewTaskModal() {
  const context = useContext(NewTaskModalContext);
  if (!context) {
    throw new Error('useNewTaskModal must be used within a NewTaskModalProvider');
  }
  return context;
}
