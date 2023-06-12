import React from "react";
import site from '../site';

export type HeaderImageProps = {
  src: string;
  srcset: string;
  alt: string;
  caption: string;
};

export const HeaderImage: React.FC<HeaderImageProps> = ({
  src,
  srcset,
  alt,
  caption,
}) => (
  <div className="relative">
    <img
      className="object-center object-cover w-full header-image"
      src={src}
      alt={alt}
      srcSet={srcset}
      sizes="100vw"
    />
    <div className="absolute bottom-0 w-full max-h-full overflow-hidden px-5">
      <div className="container mx-auto">
        <p className="pb-6 text-gray-100 text-sm whitespace-pre-wrap">
          {caption}
        </p>
      </div>
    </div>
  </div>
);
