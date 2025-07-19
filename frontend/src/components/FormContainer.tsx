import type { FC, ReactNode } from "react";

interface FormContainerProps {
  children: ReactNode;
  title?: string;
}

const FormContainer: FC<FormContainerProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary dark:bg-secondary py-12 px-4 pt-24 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-primary-light dark:bg-secondary-light p-8 rounded-lg shadow-md">
        {title && (
          <h2 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-secondary">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default FormContainer;
