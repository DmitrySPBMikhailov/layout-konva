import React from "react";
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
        {
          id: `line-${Date.now()}`,
          points: [pos.x, pos.y, pos.x, pos.y],
          draggable: true,
        },
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
  const handleMouseUp = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const lastLine = lines[lines.length - 1];
    if (!lastLine || !lastLine.points) return; // Проверяем, существуют ли точки у линии
    const updatedLines = [...lines]; // Копируем массив линий

    let isStartConnected = false;
    let isEndConnected = false;

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
        setLines(updatedLines); // Обновляем состояние
        stage.batchDraw(); // Перерисовка
      }

      // Проверка пересечения начальной точки линии с фигурой
      if (
        checkPointInsideRect(lastLine.points[0], lastLine.points[1], rectBox)
      ) {
        isStartConnected = true;
      }

      // Проверка пересечения конечной точки линии с фигурой
      if (
        checkPointInsideRect(lastLine.points[2], lastLine.points[3], rectBox)
      ) {
        isEndConnected = true;
      }
    });

    // Если хотя бы одна точка соединена с фигурой, делаем линию неподвижной
    if (isStartConnected || isEndConnected) {
      lastLine.draggable = false; // Устанавливаем draggable в false
      updatedLines[updatedLines.length - 1] = lastLine; // Обновляем линию в массиве
      setLines(updatedLines); // Обновляем состояние линий
    }

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

  // handle drag end for lines
  const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const { x: dx, y: dy } = e.target.position(); // Получаем сдвиг линии после завершения перемещения
    const stage = stageRef.current;

    if (!stage) return;
    let myDraggble = true;

    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === id) {
          let [x1, y1, x2, y2] = line.points;
          let newPoints = [x1 + dx, y1 + dy, x2 + dx, y2 + dy];

          let isStartConnected = false;
          let isEndConnected = false;

          // Проверяем пересечения с фигурами
          shapes.forEach((shape) => {
            const rect = stage.findOne(`#${shape.id}`);
            if (!rect) return;

            const rectBox = rect.getClientRect();

            // Проверка пересечения с началом и концом линии
            if (checkPointInsideRect(newPoints[0], newPoints[1], rectBox)) {
              // Начальная точка пересекается с фигурой
              newPoints[0] = rectBox.x + rectBox.width / 2;
              newPoints[1] = rectBox.y + rectBox.height / 2;
              isStartConnected = true;
              myDraggble = false;
            }

            if (checkPointInsideRect(newPoints[2], newPoints[3], rectBox)) {
              // Конечная точка пересекается с фигурой
              newPoints[2] = rectBox.x + rectBox.width / 2;
              newPoints[3] = rectBox.y + rectBox.height / 2;
              isEndConnected = true;
              myDraggble = false;
            }
          });

          return {
            ...line,
            points: newPoints,
            isStartConnected, // Флаг соединения начала линии
            isEndConnected, // Флаг соединения конца линии
            draggable: myDraggble, // Можно ли перетаскивать всю линию
          };
        }
        return line;
      })
    );

    // Сбрасываем позицию в Konva после окончания перемещения
    e.target.position({ x: 0, y: 0 });
  };

  // Вспомогательная функция для проверки, находится ли точка внутри прямоугольника
  const checkPointInsideRect = (x: number, y: number, rectBox: any) => {
    return (
      x >= rectBox.x &&
      x <= rectBox.x + rectBox.width &&
      y >= rectBox.y &&
      y <= rectBox.y + rectBox.height
    );
  };

  // Handle point dragging to adjust line endpoints
  const handlePointDragMove = (
    e: Konva.KonvaEventObject<DragEvent>,
    pointIndex: number,
    lineId: string
  ) => {
    const { x, y } = e.target.position(); // Новые координаты точки

    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === lineId) {
          const newPoints = [...line.points];
          // Обновляем координаты соответствующей точки (0, 1 - начало линии; 2, 3 - конец линии)
          newPoints[pointIndex * 2] = x;
          newPoints[pointIndex * 2 + 1] = y;
          return {
            ...line,
            points: newPoints,
          };
        }
        return line;
      })
    );
  };

  const handlePointDragEnd = (lineId: string) => {
    const stage = stageRef.current;

    if (!stage) return;

    const line = lines.find((line) => line.id === lineId);

    if (!line) return;

    const { points } = line;
    const [x1, y1, x2, y2] = points;

    let isStartConnected = false;
    let isEndConnected = false;

    shapes.forEach((shape) => {
      const rect = stage.findOne(`#${shape.id}`);
      if (!rect) return;

      const rectBox = rect.getClientRect();

      // Проверка пересечения начальной точки линии с фигурой
      if (checkPointInsideRect(x1, y1, rectBox)) {
        isStartConnected = true;
      }

      // Проверка пересечения конечной точки линии с фигурой
      if (checkPointInsideRect(x2, y2, rectBox)) {
        isEndConnected = true;
      }
    });

    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            draggable: !isStartConnected && !isEndConnected,
          };
        }
        return line;
      })
    );
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
            <React.Fragment key={i}>
              <Line
                id={line.id}
                points={line.points}
                stroke="black"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
                draggable={line.draggable} // Can we drag the whole line?
                onDragEnd={handleLineDragEnd} // Handle stop moving
              />

              {/* Control Point for Start */}
              <Circle
                x={line.points[0]}
                y={line.points[1]}
                radius={5}
                fill="transparent"
                draggable
                onDragMove={(e) => handlePointDragMove(e, 0, line.id)}
                onDragEnd={() => handlePointDragEnd(line.id)}
              />

              {/* Control Point for End */}
              <Circle
                x={line.points[2]}
                y={line.points[3]}
                radius={5}
                fill="transparent"
                draggable
                onDragMove={(e) => handlePointDragMove(e, 1, line.id)}
                onDragEnd={() => handlePointDragEnd(line.id)}
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
      {/* Toolbar */}
      <ToolBar />
    </div>
  );
};

export default App;
