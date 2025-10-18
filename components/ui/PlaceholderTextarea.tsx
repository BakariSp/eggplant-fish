"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

interface PlaceholderTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder: string;
  defaultValue?: string;
}

const PlaceholderTextarea = forwardRef<HTMLTextAreaElement, PlaceholderTextareaProps>(
  ({ placeholder, defaultValue = "", className, onChange, ...props }, ref) => {
    const [currentValue, setCurrentValue] = useState(defaultValue);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      setCurrentValue(defaultValue);
    }, [defaultValue]);

    const isPlaceholder = !currentValue;
    const showPlaceholder = isPlaceholder && !isFocused;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      if (onChange) onChange(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (!currentValue.trim()) setCurrentValue("");
    };

    const combinedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    return (
      <textarea
        ref={combinedRef}
        value={currentValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={showPlaceholder ? placeholder : ""}
        className={`${className || ''} ${showPlaceholder ? 'text-gray-400 italic' : 'text-black'}`}
        {...props}
      />
    );
  }
);

PlaceholderTextarea.displayName = "PlaceholderTextarea";

export default PlaceholderTextarea;


