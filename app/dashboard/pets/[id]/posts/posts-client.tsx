"use client";

import { useEffect, useRef, useState } from "react";
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
  const [showComposer, setShowComposer] = useState(false);

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

  const handleRefresh = () => setRefreshKey(prev => prev + 1);
  const handleGoToCreate = () => {
    setShowComposer(true);
    // Wait a tick so the composer mounts, then scroll into view
    setTimeout(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

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
          <div className="flex gap-3 justify-center min-h-[220px]">
            {posts && posts.length > 0 ? posts.slice(0, 3).map((post, index) => (
              <div
                key={post.id}
                className={
                  "w-32 sm:w-36 rounded-2xl overflow-hidden relative shadow-2xl transform transition-transform " +
                  (index === 0 ? "-rotate-12" : index === 2 ? "rotate-12" : "rotate-0 scale-105")
                }
                style={{ background: "#2a2a2a" }}
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
                    "w-32 sm:w-36 rounded-2xl overflow-hidden relative shadow-2xl transform transition-transform " +
                    (index === 0 ? "-rotate-12" : index === 2 ? "rotate-12" : "rotate-0 scale-105")
                  }
                  style={{ background: "#2a2a2a" }}
                >
                  <div className="relative h-48 sm:h-52">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-4xl opacity-50">📷</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="text-[9px] opacity-80 mb-1">2025/01/10</div>
                      <div className="font-bold text-xs mb-1">Title Text</div>
                      <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">Sample post content...</div>
                    </div>
                  </div>
                </div>
              ))
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
            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </div>
            
            <PostLibrary posts={posts || []} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      {ownerInfo && <OwnerInfo owner={ownerInfo} />}
    </div>
  );
}


