'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './TeamLogo.module.css';

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
        className={`${styles.logoFallback} ${className}`}
        data-size={size}
        data-color={teamColor || '#999'}
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
