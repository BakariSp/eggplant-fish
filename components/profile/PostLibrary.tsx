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
};

export default function PostLibrary({ posts }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Jan 31";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="relative z-10 px-6 pb-8 mt-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Post Library</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
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
