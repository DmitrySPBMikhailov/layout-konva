import { useState } from "react";

const useCanvasDrag = () => {
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);

  const handleCanvasDragStart = () => setIsCanvasDragging(true);
  const handleCanvasDragEnd = () => setIsCanvasDragging(false);

  return { isCanvasDragging, handleCanvasDragStart, handleCanvasDragEnd };
};

export default useCanvasDrag;
