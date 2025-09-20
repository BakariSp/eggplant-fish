"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import PostComposer from "@/components/posts/PostComposer";

type Post = {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  created_at?: string;
};

type Props = {
  posts: Post[];
  onCreatePost?: () => void;
  petId?: string;
  onPostCreated?: () => void;
};

export default function RecentPosts({ posts, onCreatePost, petId, onPostCreated }: Props) {
  const [showComposer, setShowComposer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    } else if (petId) {
      setShowComposer(true);
    }
  };

  // 轮播逻辑：计算当前显示的三张图片
  const getCurrentPosts = () => {
    if (posts.length === 0) return [];
    const totalPosts = posts.length;
    return [
      posts[currentIndex % totalPosts],           // 左侧
      posts[(currentIndex + 1) % totalPosts],     // 中间
      posts[(currentIndex + 2) % totalPosts]      // 右侧
    ];
  };

  // 点击左侧图片的处理函数（向左滑动）
  const handleLeftImageClick = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  // 点击右侧图片的处理函数（向右滑动）
  const handleRightImageClick = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const handlePostCreated = () => {
    setShowComposer(false);
    onPostCreated?.();
  };

  const handleCancel = () => {
    setShowComposer(false);
  };
  return (
    <section className="mt-6 mb-8 relative z-10" style={{ marginTop: '50px' }}>
      <div className="flex items-center justify-between section-header-spacing">
        <SectionHeader 
          title="Recent Posts" 
          icon="/icon/recent-post.svg"
          variant="default"
          className="mb-0"
        />
        <button
          onClick={handleCreatePost}
          className="px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: "#EC5914" }}
        >
          + Create
        </button>
      </div>

      {/* Posts Carousel (3 tilted cards) */}
      <div className="relative px-4 pb-4 min-h-[220px]" style={{ paddingTop: '76px' }}>
        {posts.length > 0 ? getCurrentPosts().map((post, index) => (
          <div
            key={post.id}
            className={
              "absolute w-32 sm:w-36 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 ease-in-out " +
              (index === 0 ? "-rotate-18" : index === 2 ? "rotate-18" : "rotate-0 scale-[1.4]") +
              (index === 1 ? " z-20" : index === 0 ? " z-5" : " z-10")
            }
            style={{ 
              background: "#2a2a2a",
              left: index === 0 ? "25%" : index === 1 ? "calc(50% + 30px)" : "75%",
              top: index === 2 ? "110px" : "70px",
              transform: `translateX(-50%) ${index === 0 ? "rotate(-18deg)" : index === 2 ? "rotate(18deg)" : "scale(1.05)"}`
            }}
            onClick={index === 0 ? handleLeftImageClick : index === 2 ? handleRightImageClick : undefined}
          >
            <div className="relative h-48 sm:h-52">
              {post.images?.[0] ? (
                <Image
                  src={post.images[0]}
                  alt={post.title || "Post image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-1 left-2 right-2 text-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs">{post.title || "Title Text"}</div>
                  <div className="text-[9px] opacity-80">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    }).replace(/\//g, '/') : "2025/01/10"}
                  </div>
                </div>
                <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">{post.content}</div>
              </div>
            </div>
          </div>
        )) : (
          /* Empty state with placeholder cards */
          [0, 1, 2].map((index) => (
            <div
              key={`placeholder-${index}`}
              className={
                "absolute w-32 sm:w-36 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 ease-in-out " +
                (index === 0 ? "-rotate-18" : index === 2 ? "rotate-18" : "rotate-0 scale-[1.4]") +
                (index === 1 ? " z-20" : index === 0 ? " z-5" : " z-10")
              }
              style={{ 
                background: "#2a2a2a",
                left: index === 0 ? "25%" : index === 1 ? "calc(50% + 30px)" : "75%",
                top: index === 2 ? "110px" : "70px",
                transform: `translateX(-50%) ${index === 0 ? "rotate(-18deg)" : index === 2 ? "rotate(18deg)" : "scale(1.05)"}`
              }}
            >
              <div className="relative h-48 sm:h-52">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-4xl opacity-50">📷</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-1 left-2 right-2 text-white">
                  <div className="text-[9px] opacity-80 mb-1">2025/01/10</div>
                  <div className="font-bold text-xs mb-1">It's quiet here…</div>
                  <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">Start your first post!</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 pb-6" style={{ marginTop: '132px' }}>
        <div className="w-2 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-white/60" />
        <div className="w-2 h-2 rounded-full bg-white/60" />
      </div>

      {/* Post Composer - shown when creating a new post */}
      {showComposer && petId && (
        <PostComposer
          petId={petId}
          onPostCreated={handlePostCreated}
          onCancel={handleCancel}
        />
      )}
    </section>
  );
}
