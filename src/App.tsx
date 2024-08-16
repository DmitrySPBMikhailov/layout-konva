import { Stage, Layer, Rect, Line, Circle, Star } from "react-konva";
import Konva from "konva";
import { useState } from "react";
// Global context
import { useGlobalContext } from "./context";
// components
import ToolBar from "./components/ToolBar";
// enums
import { ShapeType, Tool } from "./utils/enums";
// hook for canvas drugging
import useCanvasDrag from "./utils/useCanvasDrag";

const App: React.FC = () => {
  const { tool, selectedShape } = useGlobalContext();
  // local state
  const [shapes, setShapes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  // for straight lines
  const [isDrawing, setIsDrawing] = useState(false);
  const [newLinePoints, setNewLinePoints] = useState<number[]>([]);

  // canvas dragging
  const { isCanvasDragging, handleCanvasDragStart, handleCanvasDragEnd } =
    useCanvasDrag();

  // element start dragging
  const handleDragStart = (e: any) => {
    const id = e.target.id();
    setShapes(
      shapes.map((shape) => {
        return {
          ...shape,
          isDragging: shape.id === id,
        };
      })
    );
  };
  // element stop dragging
  const handleDragEnd = () => {
    setShapes(
      shapes.map((shape) => {
        return {
          ...shape,
          isDragging: false,
        };
      })
    );
  };

  // Define cursor depends on instrument
  const getCursorStyle = () => {
    switch (tool) {
      case "hand":
        return isCanvasDragging ? "grabbing" : "grab";
      case "cursor":
        return "default";
      case "shape":
        return "cell";
      case "line":
        return "crosshair";
      default:
        return "default";
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();

    if (tool === Tool.Line && pos) {
      setNewLinePoints([pos.x, pos.y]); // Starting point of the line
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== Tool.Line) return;

    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition() || { x: 0, y: 0 };

    if (pos) {
      // Renew last point of the line
      const updatedLinePoints = [
        newLinePoints[0],
        newLinePoints[1],
        pos.x,
        pos.y,
      ];
      setNewLinePoints(updatedLinePoints);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && tool === Tool.Line) {
      setLines([...lines, newLinePoints]); // Добавляем новую линию в массив линий
      setIsDrawing(false); // Завершаем процесс рисования
      setNewLinePoints([]); // Сбрасываем временные точки
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();

    if (tool === Tool.Shape && selectedShape && pos) {
      const newShape = createShape(selectedShape, pos.x, pos.y);
      setShapes([...shapes, newShape]);
    }
  };

  const createShape = (shapeType: ShapeType, x: number, y: number) => {
    const shapeId = `${shapeType}-${Date.now()}`; // Generate unique ID for each figure
    switch (shapeType) {
      case ShapeType.Rectangle:
        return {
          id: shapeId,
          isDragging: false,
          type: "rectangle",
          x,
          y,
          width: 100,
          height: 100,
          fill: "red",
        };
      case ShapeType.Circle:
        return {
          id: shapeId,
          isDragging: false,
          type: "circle",
          x,
          y,
          radius: 50,
          fill: "green",
        };
      case ShapeType.Star:
        return {
          id: shapeId,
          isDragging: false,
          type: "star",
          x,
          y,
          fill: "blue",
        };
      default:
        return null;
    }
  };

  return (
    <div className="full-screen">
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={tool === "hand"} // user can drag canvas only when hand tool is set
        onDragStart={handleCanvasDragStart}
        onDragEnd={handleCanvasDragEnd}
        style={{ cursor: getCursorStyle() }} // dynamically changing cursor
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {shapes.map((shape, i) => {
            if (shape.type === ShapeType.Rectangle) {
              return (
                <Rect
                  key={i}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  draggable={tool === Tool.Cursor}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              );
            } else if (shape.type === ShapeType.Circle) {
              return (
                <Circle
                  key={i}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  draggable={tool === Tool.Cursor}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              );
            } else if (shape.type === ShapeType.Star) {
              return (
                <Star
                  key={i}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  numPoints={5}
                  fill={shape.fill}
                  draggable={tool === Tool.Cursor}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  rotation={0}
                  innerRadius={20}
                  outerRadius={50}
                />
              );
            }
            return null;
          })}
          {lines.map((linePoints, i) => {
            const x1 = linePoints[0];
            const y1 = linePoints[1];
            const x2 = linePoints[2];
            const y2 = linePoints[3];

            return (
              <Line
                key={i}
                points={[0, 0, x2 - x1, y2 - y1]} // Рисуем линию из (0, 0)
                x={x1} // Устанавливаем начальную позицию
                y={y1} // Устанавливаем начальную позицию
                stroke="black"
                strokeWidth={5}
                draggable={tool === Tool.Cursor}
              />
            );
          })}
          {isDrawing && (
            <Line points={newLinePoints} stroke="black" strokeWidth={5} />
          )}
        </Layer>
      </Stage>
      {/* Toolbar */}
      <ToolBar />
    </div>
  );
};

export default App;
