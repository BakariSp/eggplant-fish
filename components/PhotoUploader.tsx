"use client";

type Props = { onChange?: (files: FileList | null) => void };

export default function PhotoUploader({ onChange }: Props) {
  return <input type="file" accept="image/*" multiple onChange={(e) => onChange?.(e.target.files)} />;
}


