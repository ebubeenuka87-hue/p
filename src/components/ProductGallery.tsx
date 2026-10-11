"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const currentImage = images[selected];

  return <div className="product-gallery">
    <div className="detail-image">
      {currentImage
        ? <Image src={currentImage} alt={name} fill sizes="(max-width: 760px) 100vw, 50vw" priority unoptimized />
        : <div className="image-placeholder"><span>TORIA</span></div>}
    </div>
    {images.length > 1 && <div className="product-gallery-thumbnails" aria-label="More product images">
      {images.map((image, index) => <button
        className={index === selected ? "product-gallery-thumbnail is-selected" : "product-gallery-thumbnail"}
        key={`${image}-${index}`}
        type="button"
        aria-label={`Show image ${index + 1} of ${images.length}`}
        aria-pressed={index === selected}
        onClick={() => setSelected(index)}
      >
        <Image src={image} alt="" width={72} height={72} unoptimized />
      </button>)}
    </div>}
  </div>;
}
