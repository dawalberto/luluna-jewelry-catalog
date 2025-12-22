import { useState } from 'react';
import { getCloudinaryUrl } from '../../utils/cloudinary';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const mainImageUrl = getCloudinaryUrl(images[selectedIndex], {
    width: 800,
    height: 1000,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
  });

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={mainImageUrl}
          alt={`${alt} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => {
            const thumbUrl = getCloudinaryUrl(image, {
              width: 200,
              height: 250,
              quality: 'auto',
              format: 'auto',
              crop: 'fill',
            });

            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`aspect-[4/5] rounded-lg overflow-hidden transition-all ${
                  selectedIndex === index
                    ? 'ring-2 ring-[#2E6A77] scale-95'
                    : 'hover:scale-95 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`${alt} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
