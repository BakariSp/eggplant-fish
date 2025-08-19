import Image from "next/image";

type SectionHeaderProps = {
  title: string;
  emoji?: string;
  icon?: string; // Path to SVG icon
  variant?: 'default' | 'inverse';
  className?: string;
};

export default function SectionHeader({ 
  title, 
  emoji,
  icon,
  variant = 'default',
  className = '' 
}: SectionHeaderProps) {
  const baseClasses = "flex items-center gap-3 mb-4";
  const titleClasses = variant === 'inverse' 
    ? "text-xl font-bold text-white" 
    : "text-xl font-bold text-[color:var(--brand-900)]";
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {icon ? (
        <div className="w-5 h-5 flex-shrink-0">
          <Image 
            src={icon} 
            alt="" 
            width={20} 
            height={20} 
            className="w-full h-full"
          />
        </div>
      ) : emoji ? (
        <span className="text-xl">{emoji}</span>
      ) : null}
      <h2 className={titleClasses}>
        {title}
      </h2>
    </div>
  );
}
