"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RecentPosts from "./RecentPosts";

type Post = {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  created_at?: string;
};

type Props = {
  posts: Post[];
  petId: string;
};

export default function RecentPostsWrapper({ posts, petId }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const handlePostCreated = () => {
    // Refresh the page to show new posts
    router.refresh();
  };

  return (
    <RecentPosts 
      key={refreshKey}
      posts={posts} 
      petId={petId} 
      onPostCreated={handlePostCreated} 
    />
  );
}
