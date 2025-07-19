import type { FC, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "contained" | "outlined" | "text";
  fullWidth?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = "outlined",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    contained:
      "bg-primary dark:bg-secondary text-text-primary dark:text-text-secondary focus:ring-primary shadow-md hover:shadow-xl hover:bg-primary-light dark:hover:bg-secondary-light disabled:hover:bg-primary dark:disabled:hover:bg-secondary disabled:hover:shadow-md",
    outlined:
      "border-2 border-primary-dark dark:border-primary text-text-primary dark:text-text-secondary hover:bg-primary-light dark:hover:bg-secondary-light disabled:hover:bg-transparent",
    text: "text-text-primary dark:text-text-secondary hover:bg-primary-light/50 dark:hover:bg-secondary-light/50 disabled:hover:bg-transparent",
  };
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
