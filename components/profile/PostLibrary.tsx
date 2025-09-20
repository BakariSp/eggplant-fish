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
  onPostClick?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
};

export default function PostLibrary({ posts, onPostClick, onDeletePost }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Jan 31";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="relative z-10 px-6 pb-8" style={{ marginTop: '104px' }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Post Library</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow relative group"
            onClick={() => onPostClick?.(post)}
          >
            {/* Image */}
            <div className="relative h-72 sm:h-96 w-full">
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
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost?.(post.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Delete post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-2" style={{ backgroundColor: "#3b3434" }}>
              {/* Title and Date */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-white">{post.title || "Title Text"}</h3>
                <span className="text-sm text-white">{formatDate(post.created_at)}</span>
              </div>
              
              {/* Description */}
              <p className="text-xs text-white leading-relaxed line-clamp-2">
                {post.content || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore..."}
              </p>
            </div>
          </div>
        ))}
        
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
