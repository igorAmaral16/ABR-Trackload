import React from 'react';

function ImageThumbnail({ src, alt, onClick, document, categoria }) {
  return (
    <img
      src={src}
      alt={alt}
      className="thumbnail"
      data-document={document}
      data-categoria={categoria}
      onClick={onClick}
      loading="lazy"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}

export default React.memo(ImageThumbnail);
