"use client";

import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  isLoading,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] min-h-[44px]";
  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
      ? "h-12 px-5 text-base"
      : "h-11 px-4 text-base";
  const variants =
    variant === "primary"
      ? "text-white bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)]"
      : "text-[color:var(--brand-800)] bg-white border border-[color:var(--brand-200)] hover:bg-[color:var(--brand-100)]";
  const widthClass = fullWidth ? "w-full" : undefined;

  return (
    <button
      className={clsx(base, sizes, variants, widthClass, className)}
      aria-busy={isLoading || (props as any)["aria-busy"] ? true : undefined}
      {...props}
    />
  );
}


