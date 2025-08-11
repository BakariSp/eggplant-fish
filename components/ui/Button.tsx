"use client";

import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors";
  const sizes = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm";
  const variants =
    variant === "primary"
      ? "text-white" // bg applied inline via brand to keep tokens simple
      : "text-[color:var(--brand-800)] bg-white border border-[color:var(--brand-200)]";

  return (
    <button
      className={clsx(base, sizes, variants, className)}
      style={variant === "primary" ? { backgroundColor: "var(--brand-500)" } : undefined}
      {...props}
    />
  );
}


