"use client";

import clsx from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border px-3 py-2 text-sm text-black placeholder:text-black",
        "focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold",
        className
      )}
      {...props}
    />
  );
}


