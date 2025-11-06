// src/components/ImageThumbnail.jsx
export default function ImageThumbnail({ src, alt, onClick, document, categoria }) {
  return (
    <img
      src={src}
      alt={alt}
      className="thumbnail"
      data-document={document}
      data-categoria={categoria}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
