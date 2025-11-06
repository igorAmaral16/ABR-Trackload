// src/components/ModalViewer.jsx
import { useEffect, useState } from 'react';

export default function ModalViewer({ isOpen, images, initialIndex = 0, onClose, titulo }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (!isOpen || !images || images.length === 0) return null;

  const showImage = (index) => {
    if (!images.length) return;
    let newIndex = index;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setCurrentIndex(newIndex);
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal')) {
      onClose();
    }
  };

  return (
    <div id="modal" className="modal" onClick={handleBackdropClick}>
      <span className="close" onClick={onClose}>
        &times;
      </span>
      <span className="prev" onClick={() => showImage(currentIndex - 1)}>
        &#10094;
      </span>
      <span className="next" onClick={() => showImage(currentIndex + 1)}>
        &#10095;
      </span>
      <img className="modal-content" id="modal-img" src={images[currentIndex]} alt={titulo || ''} />
      {titulo && <div className="modal-caption">{titulo}</div>}
    </div>
  );
}
