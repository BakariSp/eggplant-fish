"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface PlaceholderInputOptions {
  placeholder: string;
  defaultValue?: string;
  isPlaceholder?: boolean;
}

export interface PlaceholderInputReturn {
  value: string;
  isPlaceholder: boolean;
  displayValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  handleClick: () => void;
  setValue: (value: string) => void;
  setIsPlaceholder: (isPlaceholder: boolean) => void;
  reset: () => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

/**
 * Custom hook for managing placeholder input behavior
 * Shows placeholder text in gray when empty, hides when user starts typing
 */
export function usePlaceholderInput({
  placeholder,
  defaultValue = "",
  isPlaceholder: initialIsPlaceholder = true
}: PlaceholderInputOptions): PlaceholderInputReturn {
  const [value, setValue] = useState(defaultValue);
  const [isPlaceholder, setIsPlaceholder] = useState(initialIsPlaceholder && (!defaultValue || defaultValue.trim() === ""));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update display value based on placeholder state
  const displayValue = isPlaceholder ? placeholder : value;

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // If user starts typing, hide placeholder
    if (isPlaceholder && newValue.length > 0) {
      setIsPlaceholder(false);
    }
  }, [isPlaceholder]);

  // Handle focus - hide placeholder if it's showing
  const handleFocus = useCallback(() => {
    if (isPlaceholder) {
      setIsPlaceholder(false);
      setValue(""); // Only clear if it was showing placeholder
    }
  }, [isPlaceholder]);

  // Handle blur - show placeholder if input is empty
  const handleBlur = useCallback(() => {
    if (value.trim() === "") {
      setIsPlaceholder(true);
      setValue("");
    }
  }, [value]);

  // Handle click - same as focus
  const handleClick = useCallback(() => {
    handleFocus();
  }, [handleFocus]);

  // Set value programmatically
  const setValueProgrammatically = useCallback((newValue: string) => {
    setValue(newValue);
    setIsPlaceholder(newValue.trim() === "");
  }, []);

  // Reset to placeholder state
  const reset = useCallback(() => {
    setValue("");
    setIsPlaceholder(true);
  }, []);

  // Update placeholder state when defaultValue changes
  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
      setIsPlaceholder(!defaultValue || defaultValue.trim() === "");
    }
  }, [defaultValue, value]);

  return {
    value,
    isPlaceholder,
    displayValue,
    handleChange,
    handleFocus,
    handleBlur,
    handleClick,
    setValue: setValueProgrammatically,
    setIsPlaceholder,
    reset,
    inputRef
  };
}

/**
 * Hook for managing placeholder select behavior
 */
export function usePlaceholderSelect({
  placeholder,
  defaultValue = "",
  options
}: {
  placeholder: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [isPlaceholder, setIsPlaceholder] = useState(!defaultValue);

  const displayValue = isPlaceholder ? placeholder : value;
  const displayLabel = isPlaceholder ? placeholder : options.find(opt => opt.value === value)?.label || value;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsPlaceholder(false);
  }, []);

  const reset = useCallback(() => {
    setValue("");
    setIsPlaceholder(true);
  }, []);

  return {
    value,
    isPlaceholder,
    displayValue,
    displayLabel,
    handleChange,
    reset
  };
}

/**
 * Hook for managing placeholder tags/chips behavior
 */
export function usePlaceholderTags({
  placeholderTags,
  defaultValue = [],
  fallbackTag = "None"
}: {
  placeholderTags: string[];
  defaultValue?: string[];
  fallbackTag?: string;
}) {
  // Initialize with actual data if provided, otherwise use placeholder logic
  const [tags, setTags] = useState<string[]>(() => {
    if (defaultValue.length > 0) {
      return defaultValue;
    }
    return placeholderTags; // Start with placeholder tags
  });
  const [isPlaceholder, setIsPlaceholder] = useState(defaultValue.length === 0);

  const displayTags = isPlaceholder ? placeholderTags : tags;

  const addTag = useCallback((tag: string) => {
    if (isPlaceholder) {
      setIsPlaceholder(false);
      setTags([tag]);
      return;
    }
    setTags(prev => (prev.length === 1 && prev[0] === fallbackTag ? [tag] : [...prev, tag]));
  }, [isPlaceholder, fallbackTag]);

  const removeTag = useCallback((index: number) => {
    setTags(prevTags => {
      if (isPlaceholder) {
        // When removing placeholder tags, switch to real tags mode
        const newPlaceholderTags = placeholderTags.filter((_, i) => i !== index);
        if (newPlaceholderTags.length === 0) {
          // If all placeholder tags are removed, provide a minimal explicit tag
          setIsPlaceholder(false);
          return [fallbackTag];
        } else {
          // Update placeholder tags
          return newPlaceholderTags;
        }
      }
      
      const newTags = prevTags.filter((_, i) => i !== index);
      if (newTags.length === 0) {
        // When all user tags are removed, keep a minimal explicit tag
        setIsPlaceholder(false);
        return [fallbackTag];
      } else {
        return newTags;
      }
    });
  }, [isPlaceholder, placeholderTags, fallbackTag]);

  const reset = useCallback(() => {
    setTags([]);
    setIsPlaceholder(true);
  }, []);

  return {
    tags,
    isPlaceholder,
    displayTags,
    addTag,
    removeTag,
    reset
  };
}
