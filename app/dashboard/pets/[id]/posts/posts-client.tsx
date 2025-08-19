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
    // Load posts
    fetch("/mock/pet-posts.json")
      .then((r) => r.json())
      .then((data: MockPost[]) => {
        if (!mounted) return;
        const filtered = data
          .filter((p) => p.pet_id === petId)
          .sort((a, b) => {
            const ta = a.created_at ? Date.parse(a.created_at) : 0;
            const tb = b.created_at ? Date.parse(b.created_at) : 0;
            return tb - ta;
          });
        console.log('Posts loaded:', { petId, totalPosts: data.length, filteredPosts: filtered.length, filtered });
        setPosts(filtered);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load mock data");
      });

    // Load profile summary
    fetch("/mock/pet-profile.json")
      .then((r) => r.json())
      .then((rows: Record<string, unknown>[]) => {
        if (!mounted) return;
        setProfile(rows.find((x) => x.pet_id === petId) ?? null);
      })
      .catch(() => {});

    // Load emergency info (kept for vet link in Owner section)
    fetch("/mock/pet-emergency.json")
      .then((r) => r.json())
      .then((rows: Record<string, unknown>[]) => {
        if (!mounted) return;
        setEmergency(rows.find((x) => x.pet_id === petId) ?? null);
      })
      .catch(() => {});

    // Load owner info
    fetch("/mock/pet-owner.json")
      .then((r) => r.json())
      .then((rows: Record<string, unknown>[]) => {
        if (!mounted) return;
        setOwner(rows.find((x) => x.pet_id === petId) ?? null);
      })
      .catch(() => {});
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

      <ProfileSummary profile={profile} loading={profile === null} />

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

      <OwnerInfo owner={owner as any} emergency={emergency as any} />
    </div>
  );
}


