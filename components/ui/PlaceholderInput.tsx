"use client";

import { usePlaceholderTags } from "@/lib/hooks/usePlaceholderInput";
import { forwardRef, useState, useEffect, useRef } from "react";

interface PlaceholderInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder: string;
  defaultValue?: string;
}

export const PlaceholderInput = forwardRef<HTMLInputElement, PlaceholderInputProps>(
  ({ placeholder, defaultValue = "", className, onChange, ...props }, ref) => {
    const [currentValue, setCurrentValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update value when defaultValue changes
    useEffect(() => {
      setCurrentValue(defaultValue);
    }, [defaultValue]);

    // Determine display value and styling
    const displayValue = currentValue || placeholder;
    const isPlaceholder = !currentValue;

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      
      // Call external onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    // Handle click - clear placeholder if showing
    const handleClick = () => {
      if (isPlaceholder) {
        setCurrentValue("");
      }
    };

    // Handle blur - restore placeholder if empty
    const handleBlur = () => {
      if (!currentValue.trim()) {
        setCurrentValue("");
      }
    };

    // Combine refs
    const combinedRef = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <input
        ref={combinedRef}
        value={displayValue}
        onChange={handleChange}
        onClick={handleClick}
        onBlur={handleBlur}
        className={`${className || ''} ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'}`}
        {...props}
      />
    );
  }
);

PlaceholderInput.displayName = "PlaceholderInput";

interface PlaceholderSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}

export const PlaceholderSelect = forwardRef<HTMLSelectElement, PlaceholderSelectProps>(
  ({ placeholder, defaultValue = "", options, className, onChange, ...props }, ref) => {
    const [currentValue, setCurrentValue] = useState(defaultValue);

    // Update value when defaultValue changes
    useEffect(() => {
      setCurrentValue(defaultValue);
    }, [defaultValue]);

    // Determine if showing placeholder
    const isPlaceholder = !currentValue;

    // Handle select change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      
      // Call external onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    // Handle click - clear placeholder if showing
    const handleClick = () => {
      if (isPlaceholder) {
        setCurrentValue("");
      }
    };

    return (
      <select
        ref={ref}
        value={isPlaceholder ? "" : currentValue}
        onChange={handleChange}
        onClick={handleClick}
        className={`${className || ''} ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'}`}
        {...props}
      >
        {isPlaceholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

PlaceholderSelect.displayName = "PlaceholderSelect";

interface PlaceholderTagsProps {
  placeholderTags: string[];
  defaultValue?: string[];
  onTagsChange?: (tags: string[]) => void;
  className?: string;
  showInput?: boolean;
}

export const PlaceholderTags: React.FC<PlaceholderTagsProps> = ({
  placeholderTags,
  defaultValue = [],
  onTagsChange,
  className = "",
  showInput = true
}) => {
  const {
    tags,
    isPlaceholder,
    displayTags,
    addTag,
    removeTag
  } = usePlaceholderTags({
    placeholderTags,
    defaultValue
  });

  const [newTagInput, setNewTagInput] = useState("");

  // Notify parent when tags change
  useEffect(() => {
    onTagsChange?.(tags);
  }, [tags, onTagsChange]);

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      addTag(newTagInput.trim());
      setNewTagInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (index: number) => {
    removeTag(index);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-sm ${
              isPlaceholder 
                ? 'bg-gray-100 text-gray-400 italic' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              className={`ml-2 ${
                isPlaceholder 
                  ? 'text-gray-300 hover:text-gray-400' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add New Tag Input - Always show when showInput is true */}
      {showInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new tag..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTagInput.trim()}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};
