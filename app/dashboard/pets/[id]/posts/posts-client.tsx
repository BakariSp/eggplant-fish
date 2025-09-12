"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PostComposer from "@/components/posts/PostComposer";
import ProfileSummary from "@/components/posts/ProfileSummary";
import SectionHeader from "@/components/ui/SectionHeader";
// Removed EmergencyPanel per new design
import RecentPosts from "@/components/profile/RecentPosts";
import RecentPostsContent from "@/components/profile/RecentPostsContent";
import PostLibrary from "@/components/profile/PostLibrary";
import OwnerInfo from "@/components/profile/OwnerInfo";

type Props = { petId: string };

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

export default function PostsClient({ petId }: Props) {
  const [posts, setPosts] = useState<MockPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [emergency, setEmergency] = useState<Record<string, unknown> | null>(null);
  const [owner, setOwner] = useState<Record<string, unknown> | null>(null);
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

        // Load profile from database
        const profileResponse = await fetch(`/api/pets/${petId}`);
        if (profileResponse.ok) {
          const responseText = await profileResponse.text();
          if (responseText) {
            try {
              const profileData = JSON.parse(responseText);
              if (mounted) setProfile(profileData.pet || null);
            } catch (parseError) {
              console.error("Failed to parse profile response:", parseError, responseText);
              if (mounted) setProfile(null);
            }
          } else {
            console.error("Empty profile response");
            if (mounted) setProfile(null);
          }
        } else {
          console.error("Profile API failed:", profileResponse.status, profileResponse.statusText);
          if (mounted) setProfile(null);
        }

        // Load owner info from database
        const ownerResponse = await fetch(`/api/pets/${petId}/owner`);
        if (ownerResponse.ok) {
          const responseText = await ownerResponse.text();
          if (responseText) {
            try {
              const ownerData = JSON.parse(responseText);
              if (mounted) setOwner(ownerData.owner || null);
            } catch (parseError) {
              console.error("Failed to parse owner response:", parseError, responseText);
              if (mounted) setOwner(null);
            }
          } else {
            console.error("Empty owner response");
            if (mounted) setOwner(null);
          }
        } else {
          console.error("Owner API failed:", ownerResponse.status, ownerResponse.statusText);
          if (mounted) setOwner(null);
        }

        // Set emergency info to null for now (no API endpoint yet)
        if (mounted) setEmergency(null);

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
      <header>
        <h1 className="text-xl font-semibold">EGGPLANT.FISH</h1>
        <div className="hairline mt-2" />
      </header>

      <ProfileSummary profile={{...profile, pet_id: petId}} loading={profile === null} />

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
                    <div className="text-[9px] opacity-80 mb-1">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      }).replace(/\//g, '/') : "2025/01/10"}
                    </div>
                    <div className="font-bold text-xs mb-1">{post.title || "Title Text"}</div>
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

      <OwnerInfo owner={owner as Record<string, unknown>} emergency={emergency as Record<string, unknown>} />
    </div>
  );
}


