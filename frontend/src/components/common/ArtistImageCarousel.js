import { useEffect, useState } from "react";

const ArtistImageCarousel = ({ concerts }) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Extract all artist images that exist
    const artistImages = concerts
      .filter((artist) => artist.topAlbumImage)
      .map((artist) => ({
        url: artist.topAlbumImage,
        name: artist.artistName,
      }));

    setImages(artistImages);
  }, [concerts]);

  if (images.length === 0) {
    return null;
  }

  // Split images into three rows: first 8, next 8, and rest
  const firstRowImages = images.slice(0, 8);
  const secondRowImages = images.slice(8, 16);
  const thirdRowImages = images.slice(16);

  // Duplicate for seamless loop
  const firstRowDuplicated = [
    ...firstRowImages,
    ...firstRowImages,
    ...firstRowImages,
  ];
  const secondRowDuplicated = [
    ...secondRowImages,
    ...secondRowImages,
    ...secondRowImages,
  ];
  const thirdRowDuplicated = [
    ...thirdRowImages,
    ...thirdRowImages,
    ...thirdRowImages,
  ];

  return (
    <div className="artist-carousel-background">
      <div className="artist-carousel-track">
        {firstRowDuplicated.map((image, index) => (
          <div
            key={`row1-${image.name}-${index}`}
            className="artist-carousel-item"
          >
            <img
              src={image.url}
              alt={image.name}
              className="artist-carousel-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {secondRowImages.length > 0 && (
        <div className="artist-carousel-track artist-carousel-track-second">
          {secondRowDuplicated.map((image, index) => (
            <div
              key={`row2-${image.name}-${index}`}
              className="artist-carousel-item"
            >
              <img
                src={image.url}
                alt={image.name}
                className="artist-carousel-image"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
      {thirdRowImages.length > 0 && (
        <div className="artist-carousel-track artist-carousel-track-third">
          {thirdRowDuplicated.map((image, index) => (
            <div
              key={`row3-${image.name}-${index}`}
              className="artist-carousel-item"
            >
              <img
                src={image.url}
                alt={image.name}
                className="artist-carousel-image"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistImageCarousel;
