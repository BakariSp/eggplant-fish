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
    const [isFocused, setIsFocused] = useState(false);

    // Update value when defaultValue changes
    useEffect(() => {
      setCurrentValue(defaultValue);
    }, [defaultValue]);

    // Determine placeholder state (value is always the real value)
    const isPlaceholder = !currentValue;
    const showPlaceholder = isPlaceholder && !isFocused;

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      
      // Call external onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    // Handle focus/blur just toggles placeholder visibility; value remains ""
    const handleFocus = () => {
      setIsFocused(true);
    };

    // Handle blur - restore placeholder if empty
    const handleBlur = () => {
      setIsFocused(false);
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
        value={currentValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={showPlaceholder ? placeholder : ""}
        className={`${className || ''} ${showPlaceholder ? 'text-gray-400 italic' : 'text-black focus:font-semibold'} placeholder:text-black bg-white border-gray-300 dark:bg-white dark:text-black dark:border-gray-300 dark:placeholder:text-black`}
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

    // Handle click/focus - clear placeholder if showing (visual only until selection)
    const handleInteractive = () => {
      if (isPlaceholder) {
        setCurrentValue("");
      }
    };

    return (
      <div className="relative">
        <select
          ref={ref}
          value={isPlaceholder ? "" : currentValue}
          onChange={handleChange}
          onClick={handleInteractive}
          onFocus={handleInteractive}
          className={`${className || ''} pr-12 ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'} bg-white border-gray-300 dark:bg-white dark:text-gray-900 dark:border-gray-300`}
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
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
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
    defaultValue,
    fallbackTag: "None"
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  
  // Use ref to store the latest onTagsChange function
  const onTagsChangeRef = useRef(onTagsChange);
  onTagsChangeRef.current = onTagsChange;

  // Notify parent when tags change. If still showing placeholder, emit placeholder tags
  useEffect(() => {
    const tagsToEmit = isPlaceholder ? placeholderTags : tags;
    onTagsChangeRef.current?.(tagsToEmit);
  }, [tags, isPlaceholder, placeholderTags]);

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      addTag(newTagInput.trim());
      setNewTagInput("");
      setShowAddInput(false);
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
      {/* Tags Display with add (+) button on the right */}
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-sm font-medium`}
              style={
                isPlaceholder
                  ? { backgroundColor: "var(--brand-100)", color: "var(--brand-900)" }
                  : { backgroundColor: "var(--brand-200)", color: "var(--brand-900)" }
              }
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className={`ml-2`}
                style={{ color: "var(--brand-800)" }}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {showInput && !showAddInput && (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="mx-2 mt-0 text-gray-400 hover:text-gray-600 text-3xl leading-none"
            aria-label="Add tag"
          >
            +
          </button>
        )}
      </div>

      {/* Add New Tag Input - toggled */}
      {showInput && showAddInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new tag..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-black placeholder:text-black focus:font-semibold bg-white dark:bg-white dark:text-black dark:border-gray-300 dark:placeholder:text-black"
            style={{
              boxShadow: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--brand-700)';
              e.currentTarget.style.borderColor = 'var(--brand-700)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '';
            }}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTagInput.trim()}
            className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-[#b1924d] hover:bg-[#8f743c]"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowAddInput(false); setNewTagInput(""); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
