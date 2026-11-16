import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackTitle }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F2F2EE] border border-[#E5E5DF] text-[#71717A] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-7 h-7 mb-2 text-[#73739C]" strokeWidth={1.5} />
        <p className="text-sm font-medium text-[#3F3F46] max-w-xs truncate">
          {fallbackTitle || alt || '이미지를 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
