import { Stage, Layer, Rect, Line, Circle, Star } from "react-konva";
import Konva from "konva";
import { useState, useRef } from "react";
// Global context
import { useGlobalContext } from "./context";
// components
import ToolBar from "./components/ToolBar";
// enums
import { ShapeType, Tool } from "./utils/enums";
// hook for canvas drugging
import useCanvasDrag from "./utils/useCanvasDrag";

const App: React.FC = () => {
  const stageRef = useRef<Konva.Stage | null>(null); // Создаем ref для Stage
  const { tool, selectedShape } = useGlobalContext();
  // local state
  const [shapes, setShapes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

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
    if (tool !== Tool.Line) return;
    isDrawing.current = true;
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();
    if (pos) {
      startPoint.current = { x: pos.x, y: pos.y };
      setLines([
        ...lines,
        { id: `line-${Date.now()}`, points: [pos.x, pos.y, pos.x, pos.y] },
      ]);
    }
  };

  // handle mouse move to update the endpoint of the line
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current || tool !== Tool.Line || !startPoint.current) return;

    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();

    if (!pos) return;

    const lastLine = lines[lines.length - 1];
    lastLine.points = [
      startPoint.current.x,
      startPoint.current.y,
      pos.x,
      pos.y,
    ];
    setLines(lines.slice(0, -1).concat(lastLine));
  };

  // Функция для проверки пересечения и обновления координат линии
  const updateLineIfIntersecting = (
    linePoints: number[], // Координаты линии
    rectBox: any, // Границы прямоугольника
    shapeType: ShapeType,
    rect: any // Сам объект фигуры
  ): number[] | null => {
    const [x1, y1, x2, y2] = linePoints;

    // Проверяем, пересекается ли линия с прямоугольником
    if (
      (x1 >= rectBox.x &&
        x1 <= rectBox.x + rectBox.width &&
        y1 >= rectBox.y &&
        y1 <= rectBox.y + rectBox.height) ||
      (x2 >= rectBox.x &&
        x2 <= rectBox.x + rectBox.width &&
        y2 >= rectBox.y &&
        y2 <= rectBox.y + rectBox.height)
    ) {
      // Вычисляем центр фигуры
      let centerX = 0;
      let centerY = 0;

      if (shapeType === ShapeType.Rectangle) {
        centerX = rectBox.x + rectBox.width / 2;
        centerY = rectBox.y + rectBox.height / 2;
      } else if (
        shapeType === ShapeType.Circle ||
        shapeType === ShapeType.Star
      ) {
        centerX = rect.x();
        centerY = rect.y();
      }

      // Обновляем координаты линии
      if (
        x1 >= rectBox.x &&
        x1 <= rectBox.x + rectBox.width &&
        y1 >= rectBox.y &&
        y1 <= rectBox.y + rectBox.height
      ) {
        linePoints[0] = centerX;
        linePoints[1] = centerY;
      } else if (
        x2 >= rectBox.x &&
        x2 <= rectBox.x + rectBox.width &&
        y2 >= rectBox.y &&
        y2 <= rectBox.y + rectBox.height
      ) {
        linePoints[2] = centerX;
        linePoints[3] = centerY;
      }

      // Возвращаем обновленные координаты линии
      return linePoints;
    }

    return null; // Линия не пересекается с фигурой
  };

  // Handle mouse up to finish drawing the line
  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const lastLine = lines[lines.length - 1];
    const updatedLines = [...lines]; // Clone lines array

    shapes.forEach((shape) => {
      const rect = stage.findOne(`#${shape.id}`);
      if (!rect) return;

      const rectBox = rect.getClientRect();
      const updatedPoints = updateLineIfIntersecting(
        lastLine.points,
        rectBox,
        shape.type,
        rect
      );

      if (updatedPoints) {
        lastLine.points = updatedPoints;
        updatedLines[updatedLines.length - 1] = lastLine;
        setLines(updatedLines); // Update state
        stage.batchDraw(); // Force redraw
      }
    });

    isDrawing.current = false;
    startPoint.current = null;
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

  const handleLineDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {};

  const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const { x: dx, y: dy } = e.target.position(); // Получаем сдвиг линии после завершения перемещения

    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === id) {
          const [x1, y1, x2, y2] = line.points;
          const newPoints = [
            x1 + dx,
            y1 + dy, // Обновляем первую точку
            x2 + dx,
            y2 + dy, // Обновляем вторую точку
          ];

          return {
            ...line,
            points: newPoints,
          };
        }
        return line; // Возвращаем остальные линии без изменений
      })
    );

    // Сбрасываем позицию в Konva после окончания перемещения
    e.target.position({ x: 0, y: 0 });
  };

  return (
    <div className="full-screen">
      <Stage
        ref={stageRef} // Привязываем ref к Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={tool === "hand"} // user can drag canvas only when hand tool is set
        onDragStart={handleCanvasDragStart}
        onDragEnd={handleCanvasDragEnd}
        style={{ cursor: getCursorStyle() }} // dynamically changing cursor
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
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
          {lines.map((line, i) => (
            <Line
              key={i}
              id={line.id}
              points={line.points}
              stroke="black"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
              draggable={tool === Tool.Cursor} // Add ability to move
              onDragMove={handleLineDragMove} // Handle move
              onDragEnd={handleLineDragEnd} // Handle stop moving
            />
          ))}
        </Layer>
      </Stage>
      {/* Toolbar */}
      <ToolBar />
    </div>
  );
};

export default App;
