import type { FC, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={props.id}
          className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={props.id}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary ${
          error ? "border-red-500" : "border-primary-dark dark:border-secondary"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;
