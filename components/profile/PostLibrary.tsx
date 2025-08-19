import Image from "next/image";

type Post = {
  id: string;
  images?: string[];
  content: string;
};

type Props = {
  posts: Post[];
};

export default function PostLibrary({ posts }: Props) {
  // Flatten all images from posts, keep order newest-first by assuming posts are pre-sorted
  const allImages = posts
    .flatMap((p) => p.images || [])
    .filter((src) => typeof src === "string" && src.length > 0)
    .slice(0, 6); // Show 6 images in 2 rows of 3

  return (
    <section className="relative z-10 px-6 pb-8 mt-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Post Library</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
        {allImages.map((src, index) => (
          <div key={`${src}-${index}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image 
              src={src} 
              alt={`Post ${index + 1}`} 
              fill 
              className="object-cover hover:scale-105 transition-transform duration-200" 
            />
          </div>
        ))}
        
        {/* Fill empty slots if less than 6 images */}
        {Array.from({ length: Math.max(0, 6 - allImages.length) }).map((_, index) => (
          <div 
            key={`empty-${index}`} 
            className="relative aspect-square bg-white/10 flex items-center justify-center rounded-lg"
          >
            <div className="text-white/30 text-xl">📷</div>
          </div>
        ))}
      </div>
    </section>
  );
}
