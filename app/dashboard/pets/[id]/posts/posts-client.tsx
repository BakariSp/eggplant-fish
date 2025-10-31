"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
const PostComposer = dynamic(() => import("@/components/posts/PostComposer"), { ssr: false });
import SectionHeader from "@/components/ui/SectionHeader";
// Removed EmergencyPanel per new design
 
import PostLibrary from "@/components/profile/PostLibrary";
import OwnerInfo from "@/components/profile/OwnerInfo";
import styles from "./posts.module.css";

// Lightweight shimmer placeholder for image blur
const shimmer = (w: number, h: number) => `
  <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#eee" offset="20%" />
        <stop stop-color="#ddd" offset="50%" />
        <stop stop-color="#eee" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#eee" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"  />
  </svg>`;

const toBase64 = (str: string) => (typeof window === "undefined" ? str : window.btoa(str));

type Props = { 
  petId: string;
  ownerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    photo_url?: string;
  } | null;
  emergencyInfo?: {
    vet?: { name?: string; phone?: string };
  } | null;
  isPublic?: boolean;
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

export default function PostsClient({ petId, ownerInfo, emergencyInfo, isPublic = false }: Props) {
  const [posts, setPosts] = useState<MockPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const composerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MockPost | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerDragging, setViewerDragging] = useState(false);
  const [viewerStartX, setViewerStartX] = useState(0);
  const [viewerDeltaX, setViewerDeltaX] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncTitle, setIsTruncTitle] = useState(false);
  const [isTruncContent, setIsTruncContent] = useState(false);
  const viewerTitleRef = useRef<HTMLDivElement>(null);
  const viewerContentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const [panelHeightPx, setPanelHeightPx] = useState<number | null>(null);
  const [panelOverflowAuto, setPanelOverflowAuto] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  // Bottom panel mouse-drag-to-scroll (desktop) state
  const panelDragActiveRef = useRef(false);
  const panelDragStartYRef = useRef(0);
  const panelDragStartScrollRef = useRef(0);
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
  const [clickSource, setClickSource] = useState<'carousel' | 'library'>('carousel');

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

  // 所有有图的post（用于Post Library popup）
  const allImagePosts = useMemo(() => {
    const list = posts || [];
    return list.filter(p => Array.isArray(p.images) && p.images.length > 0 && !!p.images[0]);
  }, [posts]);

  // 根据点击来源获取对应的数据源
  const getPopupDataSource = useCallback(() => {
    if (clickSource === 'carousel') {
      return previewPosts; // 最多9张
    } else {
      return allImagePosts; // 所有有图的post
    }
  }, [clickSource, previewPosts, allImagePosts]);

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
    setClickSource('carousel'); // 设置来源为轮播
    setSelectedPost(post);
    // 将 viewerIndex 对齐到当前前方项
    const idx = previewPosts.findIndex(p => p.id === post.id);
    setViewerIndex(idx >= 0 ? idx : 0);
    setShowPopup(true);
  };

  // Post Library点击处理函数
  const handleLibraryPostClick = (post: MockPost) => {
    setClickSource('library'); // 设置来源为Post Library
    setSelectedPost(post);
    // 在allImagePosts中找到索引
    const idx = allImagePosts.findIndex(p => p.id === post.id);
    setViewerIndex(idx >= 0 ? idx : 0);
    setShowPopup(true);
  };

  // 关闭popup的处理函数
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedPost(null);
    setViewerIndex(null);
    setViewerDragging(false);
    setViewerDeltaX(0);
    setIsExpanded(false);
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
        // 如果当前删除的是正在查看的post，关闭popup
        if (selectedPost && selectedPost.id === postToDelete) {
          handleClosePopup();
        }
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

  const moveDrag = useCallback((x: number, y?: number) => {
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
  }, [isDragging, dragStartX, dragStartY, activeAxis, previewPosts]);

  const endDrag = useCallback(() => {
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
  }, [isDragging, dragDeltaX, previewPosts, angleDeg]);
  
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
  }, [isDragging, moveDrag, endDrag]);

  // Reset expand state when switching image
  useEffect(() => {
    setIsExpanded(false);
  }, [viewerIndex]);

  // Detect truncation for content only when collapsed (source of truth for canExpand)
  useEffect(() => {
    if (!showPopup) return;
    if (isExpanded) return; // measure collapsed state only
    const measure = () => {
      // derive current post content presence
      const idx = viewerIndex ?? 0;
      const popupDataSource = getPopupDataSource();
      const cur = (popupDataSource && popupDataSource.length > 0) ? popupDataSource[idx] : undefined;
      const contentText = cur?.content?.trim() || "";
      const hasContentLocal = contentText.length > 0;

      let truncContent = false;
      if (hasContentLocal) {
        // 基于文本长度检测 - 更简单可靠
        // 大约1行能容纳的字符数（根据字体大小和容器宽度估算）
        const estimatedCharsPerLine = 50; // 可以根据实际情况调整
        truncContent = contentText.length > estimatedCharsPerLine;
      }
      setHasContent(hasContentLocal);
      setIsTruncContent(truncContent);
      setCanExpand(hasContentLocal && truncContent);
    };
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [showPopup, viewerIndex, isExpanded, clickSource, previewPosts, allImagePosts, getPopupDataSource]);

  // Expanded panel: dynamic height with 60% cap of image area
  useEffect(() => {
    const compute = () => {
      // If expansion is not available, reset and skip
      if (!isExpanded || !canExpand) {
        setPanelHeightPx(null);
        setPanelOverflowAuto(false);
        return;
      }
      const H = viewerRef.current?.clientHeight || 0;
      const cap = Math.round(H * 0.6);
      const contentH = panelContentRef.current?.scrollHeight || 0;
      const target = Math.min(contentH + 40, cap);
      setPanelHeightPx(target);
      setPanelOverflowAuto(contentH > cap);
    };
    const id = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(id);
  }, [isExpanded, viewerIndex, previewPosts, canExpand]);

  // Recompute on window resize while expanded
  useEffect(() => {
    if (!isExpanded || !canExpand) return;
    const onResize = () => {
      const H = viewerRef.current?.clientHeight || 0;
      const cap = Math.round(H * 0.6);
      const contentH = panelContentRef.current?.scrollHeight || 0;
      const target = Math.min(contentH + 20, cap);
      setPanelHeightPx(target);
      setPanelOverflowAuto(contentH > cap);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isExpanded, canExpand]);

  // Top overlay height = viewer height - bottom panel height
  const viewerHeight = viewerRef.current?.clientHeight || 0;
  const collapsedPanelPx = 96; // h-24
  const currentBottomPanelPx = isExpanded
    ? (panelHeightPx !== null ? panelHeightPx : Math.round(viewerHeight * 0.6))
    : collapsedPanelPx;
  const overlayHeightPx = Math.max(0, viewerHeight - currentBottomPanelPx);

  // Handlers for desktop drag-to-scroll inside bottom text panel
  const onPanelMouseDown = (e: React.MouseEvent) => {
    if (!isExpanded) return;
    if (!panelRef.current) return;
    panelDragActiveRef.current = true;
    panelDragStartYRef.current = e.clientY;
    panelDragStartScrollRef.current = panelRef.current.scrollTop;
    (panelRef.current as HTMLDivElement).style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
    const onMove = (ev: MouseEvent) => {
      if (!panelDragActiveRef.current) return;
      const dy = ev.clientY - panelDragStartYRef.current;
      if (panelRef.current) {
        panelRef.current.scrollTop = panelDragStartScrollRef.current - dy;
      }
      ev.preventDefault();
      ev.stopPropagation();
    };
    const onUp = () => {
      panelDragActiveRef.current = false;
      if (panelRef.current) (panelRef.current as HTMLDivElement).style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="space-y-5 bg-transparent">
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
          {!isPublic && (
            <button
              onClick={handleGoToCreate}
              className="px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "#EC5914" }}
            >
              + Create
            </button>
          )}
        </div>

         {/* Posts Cards - Top half outside background */}
         <div className="relative px-4 mb-[-120px] z-20">
          <div
            ref={carouselRef}
            className="relative min-h-[220px] select-none"
            onPointerDown={(e) => { e.preventDefault(); beginDrag(e.clientX, e.clientY ?? 0); }}
            onPointerMove={(e) => { if (activeAxis === 'x') e.preventDefault(); moveDrag(e.clientX, e.clientY ?? undefined); }}
            onPointerUp={() => endDrag()}
            onPointerCancel={() => endDrag()}
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
                      sizes="(max-width: 640px) 180px, (max-width: 768px) 200px, 240px"
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(16, 16))}`}
                      priority={i === ((currentIndex % (previewPosts.length || 1)) + (previewPosts.length || 1)) % (previewPosts.length || 1)}
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
        <div className="relative overflow-hidden">
          {/* SVG Background */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/recent-post-bg.svg')",
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              minHeight: "500px"
            }}
          />

          {/* Fallback gradient background */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-t-[48px]"
            style={{ 
              // background: "linear-gradient(180deg, #EC5914 0%, #D4490F 100%)",
              zIndex: -1
            }}
          />

           {/* Content container */}
           <div className="relative z-10 pt-[140px]">
            <PostLibrary posts={posts || []} onPostClick={handleLibraryPostClick} isPublic={isPublic} />
           </div>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      {ownerInfo && <OwnerInfo owner={ownerInfo} emergency={emergencyInfo} />}

      {/* Post Popup Modal - 强制浅色模式 */}
      {showPopup && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePopup}
        >
          <div 
            className={`bg-[#f5f5dc] text-black rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 dark:bg-[#f5f5dc] dark:text-black [color-scheme:light] ${styles.postsModal}`}
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

            {/* Delete Button */}
            {!isPublic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPost) {
                    handleShowDeleteModal(selectedPost.id);
                  }
                }}
                className="absolute top-4 left-4 z-10 w-8 h-8 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white transition-colors"
                title="Delete post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Viewer with swipe */}
            <div
              ref={viewerRef}
              className="relative h-[70vh] bg-black overflow-hidden select-none"
              onMouseDown={(e) => { if (isExpanded) return; e.preventDefault(); setViewerDragging(true); setViewerStartX(e.clientX); setViewerDeltaX(0); }}
              onMouseMove={(e) => { if (isExpanded) return; if (!viewerDragging) return; setViewerDeltaX(e.clientX - viewerStartX); }}
              onMouseUp={() => {
                if (isExpanded) return;
                if (!viewerDragging) return;
                const width = viewerRef.current?.offsetWidth || 800;
                const threshold = Math.max(60, width * 0.15);
                const popupDataSource = getPopupDataSource();
                const total = popupDataSource.length || 1;
                if (viewerDeltaX <= -threshold) {
                  setViewerIndex(prev => {
                    const idx = prev ?? 0;
                    return Math.min(idx + 1, total - 1);
                  });
                } else if (viewerDeltaX >= threshold) {
                  setViewerIndex(prev => {
                    const idx = prev ?? 0;
                    return Math.max(idx - 1, 0);
                  });
                }
                setViewerDragging(false);
                setViewerDeltaX(0);
              }}
              onTouchStart={(e) => { if (isExpanded) return; const t = e.touches[0]; setViewerDragging(true); setViewerStartX(t.clientX); setViewerDeltaX(0); }}
              onTouchMove={(e) => { if (isExpanded) return; const t = e.touches[0]; setViewerDeltaX(t.clientX - viewerStartX); e.preventDefault(); }}
              onTouchEnd={() => {
                if (isExpanded) return;
                const width = viewerRef.current?.offsetWidth || 800;
                const threshold = Math.max(60, width * 0.15);
                const popupDataSource = getPopupDataSource();
                const total = popupDataSource.length || 1;
                if (viewerDeltaX <= -threshold) {
                  setViewerIndex(prev => {
                    const idx = prev ?? 0;
                    return Math.min(idx + 1, total - 1);
                  });
                } else if (viewerDeltaX >= threshold) {
                  setViewerIndex(prev => {
                    const idx = prev ?? 0;
                    return Math.max(idx - 1, 0);
                  });
                }
                setViewerDragging(false);
                setViewerDeltaX(0);
              }}
              style={{ touchAction: 'none' }}
            >
              {(() => {
                const popupDataSource = getPopupDataSource();
                return popupDataSource.length > 0 && (
                  <div className="relative w-full h-full">
                    <div
                      className="flex w-full h-full transition-transform duration-300 ease-out"
                      style={{
                        width: `${popupDataSource.length * 100}%`,
                        transform: (() => {
                          const total = popupDataSource.length || 1;
                          const idx = viewerIndex ?? 0;
                          let delta = viewerDeltaX;
                          if (idx === 0 && delta > 0) delta = delta * 0.35; // 左边界阻尼
                          if (idx === total - 1 && delta < 0) delta = delta * 0.35; // 右边界阻尼
                          return `translate3d(calc(-${idx * (100 / total)}% + ${delta}px), 0, 0)`;
                        })(),
                        transition: viewerDragging ? 'none' : 'transform 300ms ease-out'
                      }}
                    >
                      {popupDataSource.map((p) => (
                        <div key={p.id} className="h-full flex-shrink-0 flex items-center justify-center" style={{ width: `${100 / (popupDataSource.length || 1)}%` }}>
                          <div className="relative w-full h-full">
                            {p.images?.[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.title || "Post image"}
                                fill
                                className="object-contain"
                                sizes="(max-width: 480px) 90vw, (max-width: 768px) 80vw, 60vw"
                                placeholder="blur"
                                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(16, 12))}`}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                <span className="text-6xl opacity-50">📷</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Top overlay: only shown when expanded; clicking collapses */}
              {isExpanded && canExpand && (
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: `${overlayHeightPx}px`, zIndex: 16 }}
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                />
              )}
              {/* Bottom text panel overlay over image */}
              {(() => {
                const popupDataSource = getPopupDataSource();
                if (popupDataSource.length === 0) return null;
                const idx = viewerIndex ?? 0;
                const cur = popupDataSource[idx];
                const dateStr = cur?.created_at ? new Date(cur.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/') : "";
                return (
                  <div
                    ref={panelRef}
                    className={`absolute bottom-0 left-0 right-0 bg-black/90 text-white px-6 transition-all duration-300 overflow-x-hidden no-scrollbar ${isExpanded ? 'py-3' : 'h-24 overflow-hidden py-3'}`}
                    onClick={(e) => { e.stopPropagation(); if (!isExpanded && canExpand) setIsExpanded(true); }}
                    onWheel={(e) => { if (isExpanded && canExpand) e.stopPropagation(); }}
                    onTouchMove={(e) => { if (isExpanded && canExpand) e.stopPropagation(); }}
                    onMouseDown={(e) => { if (canExpand) onPanelMouseDown(e); }}
                    style={{
                      zIndex: 15,
                      height: isExpanded ? (panelHeightPx !== null ? `${panelHeightPx}px` : undefined) : undefined,
                      overflowY: isExpanded && canExpand ? (panelOverflowAuto ? 'auto' : 'hidden') : undefined,
                      WebkitOverflowScrolling: isExpanded && canExpand ? 'touch' : undefined,
                      overscrollBehavior: isExpanded && canExpand ? 'contain' : undefined,
                      touchAction: isExpanded && canExpand ? 'pan-y' : undefined,
                      cursor: !isExpanded && canExpand ? 'pointer' : 'default'
                    }}
                  >
                    <div ref={panelContentRef}>
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <div 
                          ref={viewerTitleRef} 
                          className="flex-1 min-w-0 font-bold text-sm leading-tight whitespace-pre-wrap break-words"
                          style={isExpanded ? {} : {
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {cur?.title || 'Untitled Post'}
                        </div>
                        <div className="shrink-0 text-[11px] opacity-80 whitespace-nowrap">{dateStr}</div>
                      </div>
                      {hasContent ? (
                        <div 
                          ref={viewerContentRef} 
                          className="text-[13px] leading-snug whitespace-pre-wrap break-words"
                          style={isExpanded ? {} : {
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {cur?.content}
                        </div>
                      ) : null}
                    </div>
                    {canExpand && (
                      <div className="mt-1 text-[11px] text-white/70">{isExpanded ? 'Collapse' : 'More'}</div>
                    )}
                  </div>
                );
              })()}
              {/* Arrows */}
              {(() => {
                const popupDataSource = getPopupDataSource();
                return popupDataSource.length > 1 && !isExpanded && (
                  <>
                    <button
                      onClick={() => setViewerIndex(prev => { const idx = prev ?? 0; return Math.max(idx - 1, 0); })}
                      disabled={(viewerIndex ?? 0) <= 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center z-20"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setViewerIndex(prev => { const total = popupDataSource.length; const idx = prev ?? 0; return Math.min(idx + 1, total - 1); })}
                      disabled={(viewerIndex ?? 0) >= (popupDataSource.length - 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center z-20"
                    >
                      ›
                    </button>
                  </>
                );
              })()}
            </div>

            
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - 强制浅色模式 */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className={`bg-[#f5f5dc] text-black rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300 scale-100 dark:bg-[#f5f5dc] dark:text-black [color-scheme:light] ${styles.postsModal}`}
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
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors dark:bg-gray-200 dark:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors dark:bg-red-500 dark:text-white"
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


