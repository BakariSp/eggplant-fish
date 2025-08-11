import Image from "next/image";
type Props = { content: string; images?: string[] };

export default function PostCard({ content, images = [] }: Props) {
  return (
    <article className="border rounded p-3">
      <p>{content}</p>
      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((src) => (
            <Image
              key={src}
              src={src}
              alt="photo"
              width={400}
              height={300}
              className="w-full h-auto rounded"
            />
          ))}
        </div>
      )}
    </article>
  );
}


