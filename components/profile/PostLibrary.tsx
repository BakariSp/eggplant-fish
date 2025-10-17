import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Post = {
  id: string;
  pet_id: string;
  title?: string;
  content: string;
  images?: string[];
  created_at?: string;
};

type Props = {
  posts: Post[];
  onPostClick?: (post: Post) => void;
  isPublic?: boolean;
};

export default function PostLibrary({ posts, onPostClick, isPublic = false }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Jan 31";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Simple windowing: render in chunks as user scrolls
  const CHUNK = 12;
  const [visibleCount, setVisibleCount] = useState(Math.min(CHUNK, posts.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(CHUNK, posts.length));
  }, [posts.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + CHUNK, posts.length));
        }
      }
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [posts.length]);

  return (
    <section className="relative z-10 px-6 pb-8 overflow-x-hidden cv-auto" style={{ marginTop: '104px' }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Post Library</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 items-start">
        {posts.slice(0, visibleCount).map((post) => (
          <div 
            key={post.id} 
            className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow relative group cv-auto"
            onClick={() => onPostClick?.(post)}
          >
            {/* Image */}
            <div className="relative min-h-48 sm:min-h-64 w-full">
              {post.images?.[0] ? (
                <Image 
                  src={post.images[0]} 
                  alt={post.title || "Post image"} 
                  fill 
                  className="object-cover object-center" 
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
              )}
              
            </div>
            
            {/* Content */}
            <div className="p-2 flex-1" style={{ backgroundColor: "#3b3434" }}>
              {/* Title and Date */}
              <div className="flex items-start justify-between mb-1">
                <h3 
                  className="font-bold text-sm text-white flex-1 mr-2 leading-tight"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}
                >
                  {post.title || "Title Text"}
                </h3>
                <span className="text-sm text-white flex-shrink-0 mt-0.5">{formatDate(post.created_at)}</span>
              </div>
              
              {/* Description */}
              {post.content?.trim() && (
                <p 
                  className="text-xs text-white leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}
                >
                  {post.content}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {/* Sentinel for windowing */}
        <div ref={sentinelRef} className="col-span-full h-6" />

        {/* Show empty state if no posts */}
        {posts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-white/60 text-lg">No posts yet</div>
            <div className="text-white/40 text-sm mt-2">Create your first post to get started!</div>
          </div>
        )}
      </div>
    </section>
  );
}
