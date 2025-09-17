import Image from "next/image";

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
};

export default function RecentPostsContent({ posts, onCreatePost }: Props) {
  return (
    <section className="mb-2 relative z-10">
      {/* Create Button - Top Right */}
      <div className="flex justify-end mb-4 px-6">
        <button
          onClick={onCreatePost}
          className="px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: "#EC5914" }}
        >
          + Create
        </button>
      </div>

      {/* Posts Carousel (3 tilted cards) */}
      <div className="relative flex gap-3 justify-center px-4 pt-6 pb-4 min-h-[220px]">
        {posts.length > 0 ? posts.slice(0, 3).map((post, index) => (
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
                  <div className="font-bold text-xs mb-1">It's quiet here…</div>
                  <div className="text-[9px] opacity-85 line-clamp-3 leading-tight">Start your first post!</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-2 pb-6">
        <div className="w-2 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-white/60" />
        <div className="w-2 h-2 rounded-full bg-white/60" />
      </div>
    </section>
  );
}
