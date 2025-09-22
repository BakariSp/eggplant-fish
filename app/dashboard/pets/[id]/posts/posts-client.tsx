"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import PostComposer from "@/components/posts/PostComposer";
import SectionHeader from "@/components/ui/SectionHeader";
// Removed EmergencyPanel per new design
import RecentPosts from "@/components/profile/RecentPosts";
import RecentPostsContent from "@/components/profile/RecentPostsContent";
import PostLibrary from "@/components/profile/PostLibrary";
import OwnerInfo from "@/components/profile/OwnerInfo";

type Props = { 
  petId: string;
  ownerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    photo_url?: string;
  } | null;
};

type MockPost = {
  id: string;
  pet_id: string;
  content: string;
  title?: string;
  images?: string[];
  created_at?: string;
  author_name?: string;
  tags?: string[];
};

export default function PostsClient({ petId, ownerInfo }: Props) {
  const [posts, setPosts] = useState<MockPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const composerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MockPost | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [activeAxis, setActiveAxis] = useState<'none' | 'x' | 'y'>('none');
  const [suppressClick, setSuppressClick] = useState(false);
  const [angleDeg, setAngleDeg] = useState(0); // continuous angle during drag
  const [snapAngleDeg, setSnapAngleDeg] = useState(0); // snapping target angle
  const [isSnapping, setIsSnapping] = useState(false);

  // ESC键关闭popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup) {
        handleClosePopup();
      }
    };

    if (showPopup) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPopup]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        // Load posts from database
        const postsResponse = await fetch(`/api/pets/${petId}/posts`);
        console.log("📝 Posts API response status:", postsResponse.status);
        if (postsResponse.ok) {
          const responseText = await postsResponse.text();
          console.log("📝 Posts API response text:", responseText);
          if (responseText) {
            try {
              const postsData = JSON.parse(responseText);
              console.log("📝 Parsed posts data:", postsData);
              // API returns nested structure: {success: true, data: {posts: [...]}}
              const actualPosts = postsData.data?.posts || postsData.posts || [];
              console.log("📝 Extracted posts:", actualPosts);
              if (mounted) setPosts(actualPosts);
            } catch (parseError) {
              console.error("Failed to parse posts response:", parseError, responseText);
              if (mounted) setPosts([]);
            }
          } else {
            console.error("Empty posts response");
            if (mounted) setPosts([]);
          }
        } else {
          console.error("Posts API failed:", postsResponse.status, postsResponse.statusText);
          // Set empty array instead of mock data
          if (mounted) setPosts([]);
        }

        // Profile data is now loaded at page level

        // Owner info is now passed from page level

      } catch (error) {
        console.error("Error loading data:", error);
        if (mounted) setError(error instanceof Error ? error.message : "Failed to load data");
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [petId, refreshKey]);

  // Recent Posts 数据源：仅取有图的最近最多 9 条
  const previewPosts = useMemo(() => {
    const list = posts || [];
    const withImages = list.filter(p => Array.isArray(p.images) && p.images.length > 0 && !!p.images[0]);
    // 假设后端已按时间降序返回；若无保证，可在此处按 created_at 排序
    return withImages.slice(0, 9);
  }, [posts]);

  // 轮播逻辑：计算当前显示的三张图片（来自预览数据源）
  const getCurrentPosts = () => {
    if (!previewPosts || previewPosts.length === 0) return [];
    const totalPosts = previewPosts.length;
    return [
      previewPosts[currentIndex % totalPosts],
      previewPosts[(currentIndex + 1) % totalPosts],
      previewPosts[(currentIndex + 2) % totalPosts]
    ];
  };

  // 点击左侧图片的处理函数（向左滑动）
  const handleLeftImageClick = () => {
    setCurrentIndex((prev) => (prev - 1 + (posts?.length || 1)) % (posts?.length || 1));
  };

  // 点击右侧图片的处理函数（向右滑动）
  const handleRightImageClick = () => {
    setCurrentIndex((prev) => (prev + 1) % (posts?.length || 1));
  };

  // 点击中间图片的处理函数（显示popup）
  const handleMiddleImageClick = (post: MockPost) => {
    if (suppressClick || isDragging) return;
    setSelectedPost(post);
    setShowPopup(true);
  };

  // 关闭popup的处理函数
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedPost(null);
  };

  // 显示删除确认弹窗
  const handleShowDeleteModal = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  // 确认删除post的处理函数
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/pets/${petId}/posts/${postToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 删除成功，刷新数据
        setRefreshKey(prev => prev + 1);
        setShowDeleteModal(false);
        setPostToDelete(null);
      } else {
        console.error('Failed to delete post');
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);
  const handleGoToCreate = () => {
    setShowComposer(true);
    // Wait a tick so the composer mounts, then scroll into view
    setTimeout(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  // Swipe/drag handlers for carousel
  const beginDrag = (x: number, y: number) => {
    setIsDragging(true);
    setDragStartX(x);
    setDragStartY(y);
    setDragDeltaX(0);
    setActiveAxis('none');
    setIsSnapping(false);
    setSnapAngleDeg(0);
  };

  const moveDrag = (x: number, y?: number) => {
    if (!isDragging) return;
    const dx = x - dragStartX;
    const dy = (y ?? dragStartY) - dragStartY;
    if (activeAxis === 'none') {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        // 更偏向水平滑动：仅当垂直明显大于水平时才判定为 y
        const preferX = Math.abs(dx) >= Math.abs(dy) - 8;
        setActiveAxis(preferX ? 'x' : 'y');
      }
    }
    if (activeAxis === 'x') {
      setDragDeltaX(dx);
      const width = carouselRef.current?.offsetWidth || 320;
      const total = previewPosts.length || 1;
      const stepDeg = 360 / total;
      const sensitivity = 1; // 1 drag width ~ 1 step
      const newAngle = (dx / width) * stepDeg * sensitivity;
      setAngleDeg(newAngle);
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    const width = carouselRef.current?.offsetWidth || 300;
    const threshold = Math.max(40, width * 0.2);
    const moved = Math.abs(dragDeltaX) > 6;
    const total = previewPosts.length || 1;
    const stepDeg = 360 / total;
    // Decide steps by normalized angle, or by threshold if axis chosen
    let steps = 0;
    if (Math.abs(dragDeltaX) >= threshold) {
      steps = dragDeltaX > 0 ? -1 : 1; // right drag => go to previous (rotate right), left drag => next
    } else {
      // snap to nearest based on angleDeg
      steps = Math.round(-angleDeg / stepDeg);
    }
    if (total > 0) {
      const targetAngle = -steps * stepDeg;
      setIsSnapping(true);
      setSnapAngleDeg(targetAngle);
      // After animation, update index and reset angles
      setTimeout(() => {
        if (steps !== 0) {
          setCurrentIndex(prev => (prev + steps + total) % total);
        }
        setAngleDeg(0);
        setSnapAngleDeg(0);
        setIsSnapping(false);
      }, 300);
    }
    setIsDragging(false);
    setActiveAxis('none');
    setDragDeltaX(0);
    if (moved) {
      setSuppressClick(true);
      setTimeout(() => setSuppressClick(false), 150);
    }
  };
  
  // Global mouse listeners for dragging on desktop
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, moveDrag]);

  return (
    <div className="space-y-5">
      {/* Global SiteHeader is included via app/layout.tsx */}
      {/* PetProfileSection is now rendered at page level */}

      {showComposer && (
        <div ref={composerRef}>
          <PostComposer
            petId={petId}
            onPostCreated={() => {
              handleRefresh();
              setShowComposer(false);
            }}
            onCancel={() => setShowComposer(false)}
          />
        </div>
      )}

      {/* Posts Section */}
      <div className="mt-6">
        {/* Recent Posts Header with Create Button */}
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader 
            title="Recent Posts" 
            icon="/icon/recent-post.svg"
            variant="default"
            className="mb-0"
          />
          <button
            onClick={handleGoToCreate}
            className="px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: "#EC5914" }}
          >
            + Create
          </button>
        </div>

         {/* Posts Cards - Top half outside background */}
         <div className="relative px-4 mb-[-120px] z-20">
           <div
             ref={carouselRef}
             className="relative min-h-[220px] select-none"
             onMouseDown={(e) => { e.preventDefault(); beginDrag(e.clientX, e.clientY); }}
             onTouchStart={(e) => { const t = e.touches[0]; beginDrag(t.clientX, t.clientY); }}
             onTouchMove={(e) => { if (activeAxis === 'x') e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
             onTouchEnd={() => endDrag()}
             style={{ touchAction: 'pan-y' }}
           >
             {previewPosts.length > 0 ? (
               // 渲染所有 N 张，前面三张自然成为前侧，其他在背面可见
              previewPosts.map((post, i) => {
               const total = previewPosts.length;
               // 每项在环上的基础角度（平均分布）
               const step = 360 / total;
               // 基于当前 frontIndex 偏移：currentIndex 指向前方 0°
               const base = ((i - (currentIndex % total) + total) % total) * step;
               const delta = isSnapping ? snapAngleDeg : angleDeg;
               const angle = base + delta;
               const rad = (angle * Math.PI) / 180;
               const radiusX = 140;
               const radiusY = 22;
               const x = Math.sin(rad) * radiusX;
               const y = -Math.cos(rad) * radiusY; // front更高，侧面略低
               const depth = (Math.cos(rad) + 1) / 2; // 0..1, front=1
               const scale = 0.9 + depth * 0.5; // 0.9..1.4
               const tilt = Math.sin(rad) * 16; // -16..16deg
               const z = Math.round(1 + depth * 40); // 1..41
               const opacity = 0.8 + depth * 0.2; // 0.8..1，侧边更透明一些（侧位≈0.9）
               return (
                <div
                  key={post.id}
                  className={
                    "absolute w-32 sm:w-36 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ease-out"
                  }
                  style={{ 
                    background: "#2a2a2a",
                    left: "50%",
                    top: "80px",
                    transform: `translateX(-50%) translateX(${x}px) translateY(${y}px) scale(${scale}) rotate(${tilt}deg)`,
                    zIndex: z,
                    opacity,
                    cursor: previewPosts.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    willChange: 'transform'
                  }}
                  onClick={() => {
                    // 仅当该项最接近前方时允许点击
                    if (suppressClick) return;
                    // 找出前方项：角度最接近 0° 的项
                    const normalized = ((angle % 360) + 360) % 360;
                    const distanceFromFront = Math.min(Math.abs(normalized), Math.abs(360 - normalized));
                    if (distanceFromFront < 20) {
                      handleMiddleImageClick(post);
                    }
                  }}
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
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-xs">{post.title || "Untitled Post"}</div>
                      <div className="text-[9px] opacity-80">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        }).replace(/\//g, '/') : ""}
                      </div>
                    </div>
                    <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">{post.content || ""}</div>
                  </div>
                </div>
              </div>
               );
             }) ) : (
              /* Empty state with placeholder cards */
               [0, 1, 2].map((index) => (
                 (() => {
                   const baseAngles = [-120, 0, 120];
                   const delta = isSnapping ? snapAngleDeg : angleDeg;
                   const angle = baseAngles[index] + delta;
                   const rad = (angle * Math.PI) / 180;
                   const radiusX = 140;
                   const radiusY = 20;
                   const x = Math.sin(rad) * radiusX;
                   const y = -Math.cos(rad) * radiusY;
                   const depth = (Math.cos(rad) + 1) / 2;
                   const scale = 1.0 + depth * 0.4;
                   const tilt = Math.sin(rad) * 18;
                   const z = Math.round(5 + depth * 20);
                   const opacity = 0.85 + depth * 0.15;
                   return (
                     <div
                       key={`placeholder-${index}`}
                       className={
                         "absolute w-32 sm:w-36 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ease-out"
                       }
                       style={{ 
                         background: "#2a2a2a",
                         left: "50%",
                         top: "80px",
                         transform: `translateX(-50%) translateX(${x}px) translateY(${y}px) scale(${scale}) rotate(${tilt}deg)` ,
                         zIndex: z,
                         opacity
                       }}
                     >
                  <div className="relative h-48 sm:h-52">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-4xl opacity-50">📷</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="font-bold text-xs mb-1">What’s your pet up to today?</div>
                      <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">Share a funny moment, a cute story, or a little paw-some adventure</div>
                    </div>
                  </div>
                    </div>
                   );
                 })()
              ))
            )}
          </div>
          
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2" style={{ marginTop: '132px' }}>
            {previewPosts.length > 0 ? (
              Array.from({ length: previewPosts.length }).map((_, idx) => (
                <div
                  key={`dot-${idx}`}
                  className={`w-2 h-2 rounded-full ${idx === (currentIndex % previewPosts.length) ? 'bg-white' : 'bg-white/60'}`}
                />
              ))
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <div className="w-2 h-2 rounded-full bg-white/60" />
              </>
            )}
          </div>
        </div>

        {/* Posts Section with SVG background - starts in middle of cards */}
        <div className="relative -mx-6">
          {/* SVG Background */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/recent-post-bg.svg')",
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              marginLeft: "-32px",
              marginRight: "-32px",
              minHeight: "500px"
            }}
          />

          {/* Fallback gradient background */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-t-[48px]"
            style={{ 
              // background: "linear-gradient(180deg, #EC5914 0%, #D4490F 100%)",
              marginLeft: "-32px",
              marginRight: "-32px",
              zIndex: -1
            }}
          />

           {/* Content container */}
           <div className="relative z-10 pt-[140px]">
             <PostLibrary posts={posts || []} onPostClick={handleMiddleImageClick} onDeletePost={handleShowDeleteModal} />
           </div>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      {ownerInfo && <OwnerInfo owner={ownerInfo} />}

      {/* Post Popup Modal */}
      {showPopup && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePopup}
        >
          <div 
            className="bg-[#f5f5dc] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative h-[500px] sm:h-[700px]">
              {selectedPost.images?.[0] ? (
                <Image
                  src={selectedPost.images[0]}
                  alt={selectedPost.title || "Post image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-6xl opacity-50">📷</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 -mt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedPost.title || "Untitled Post"}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-6">
                {selectedPost.content || "No description available."}
              </p>
              
              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author and Date */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>By {ownerInfo?.name || "Unknown"}</span>
                <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-[#f5f5dc] rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Delete Post
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


