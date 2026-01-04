'use client';

import Image from 'next/image';
import { useState } from 'react';

interface TeamLogoProps {
  src: string | null;
  alt: string;
  teamAbbr: string;
  teamColor?: string | null;
  size?: number;
  className?: string;
}

export default function TeamLogo({
  src,
  alt,
  teamAbbr,
  teamColor,
  size = 32,
  className = ''
}: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-xs ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: teamColor || '#999',
          color: '#fff',
          borderRadius: '4px'
        }}
      >
        {teamAbbr}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}
