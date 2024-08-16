import { useState } from "react";

const useDrag = () => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  return { isDragging, handleDragStart, handleDragEnd };
};

export default useDrag;
