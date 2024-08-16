import { Stage, Layer, Rect, Line, Circle } from "react-konva";
import Konva from "konva";
import { useState } from "react";
// Global context
import { useGlobalContext } from "./context";
// custom hook for dragging
import useDrag from "./utils/useDrag";
// components
import ToolBar from "./components/ToolBar";
// enums
import { ShapeType, Tool } from "./utils/enums";

const App: React.FC = () => {
  const { tool, selectedShape } = useGlobalContext();
  // functions from custom hook for grabbing
  const { isDragging, handleDragStart, handleDragEnd } = useDrag();
  // local state
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [newLinePoints, setNewLinePoints] = useState<number[]>([]);

  // Define cursor depends on instrument
  const getCursorStyle = () => {
    switch (tool) {
      case "hand":
        return isDragging ? "grabbing" : "grab";
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
      setNewLinePoints([pos.x, pos.y]); // Начальная точка линии
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== Tool.Line) return;

    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition() || { x: 0, y: 0 };

    if (pos) {
      // Обновляем конечную точку линии
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
    switch (shapeType) {
      case ShapeType.Rectangle:
        return {
          type: "rectangle",
          x,
          y,
          width: 100,
          height: 100,
          fill: "red",
        };
      case ShapeType.Circle:
        return { type: "circle", x, y, radius: 50, fill: "green" };
      case ShapeType.Triangle:
        return { type: "triangle", x, y, fill: "blue" }; // Простая фигура для примера
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  draggable={tool === Tool.Cursor}
                />
              );
            } else if (shape.type === ShapeType.Circle) {
              return (
                <Circle
                  key={i}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  draggable={tool === Tool.Cursor}
                />
              );
            } else if (shape.type === ShapeType.Triangle) {
              // Треугольник можно реализовать через Line с тремя точками
              const trianglePoints = [
                shape.x,
                shape.y,
                shape.x - 50,
                shape.y + 100,
                shape.x + 50,
                shape.y + 100,
              ];
              return (
                <Line
                  key={i}
                  points={trianglePoints}
                  fill={shape.fill}
                  closed
                  draggable={tool === Tool.Cursor}
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
