"use client";

import Image from "next/image";
import { useState } from "react";

type Post = {
  id: string;
  content: string;
  images?: string[];
  created_at?: string;
  author_name?: string;
  tags?: string[];
};

type Props = {
  post: Post;
  onDelete?: (id: string) => void;
  isPublic?: boolean;
};

export default function PostCard({ post, onDelete, isPublic = false }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <article className="rounded-2xl border border-[color:var(--brand-200)] soft-shadow p-4 bg-white space-y-3 relative">
      {/* Menu button */}
      {!isPublic && onDelete && (
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
              <button
                onClick={() => {
                  onDelete?.(post.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="pr-8">
        <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {post.images.map((src, i) => (
            <div key={i} className="relative h-28 sm:h-32 rounded-lg overflow-hidden border border-[color:var(--brand-200)] bg-gray-50">
              <Image
                src={src}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs bg-[color:var(--brand-50)] border border-[color:var(--brand-200)]"
              style={{ color: "var(--brand-700)" }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[color:var(--brand-100)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[color:var(--brand-200)] flex items-center justify-center text-[10px] font-medium" style={{ color: "var(--brand-700)" }}>
            {(post.author_name ?? "").slice(0, 1).toUpperCase() || "🐾"}
          </div>
          <span className="text-xs text-gray-600">{post.author_name ?? "Pet Owner"}</span>
        </div>
        <span className="text-[11px] text-gray-500">{formatDate(post.created_at)}</span>
      </div>
    </article>
  );
}
