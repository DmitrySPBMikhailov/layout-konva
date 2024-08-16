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
  const { tool, selectedShape } = useGlobalContext();
  // local state
  const [shapes, setShapes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);

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
    isDrawing.current = true;
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();
    if (tool === Tool.Line && pos) {
      setLines([
        ...lines,
        { tool, points: [pos.x, pos.y], id: `line-${Date.now()}` },
      ]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!isDrawing.current || tool !== Tool.Line) {
      return;
    }

    const stage = e.target.getStage();
    const point = stage?.getRelativePointerPosition();

    let lastLine = lines[lines.length - 1];
    // add point
    if (!point) return;
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
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

  const handleLineDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const { x, y } = e.target.position();

    setLines(
      lines.map((line) => {
        if (line.id === id) {
          const dx = x - line.points[0];
          const dy = y - line.points[1];
          return {
            ...line,
            points: line.points.map((point: any, index: any) =>
              index % 2 === 0 ? point + dx : point + dy
            ),
          };
        }
        return line;
      })
    );
  };

  const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // finish moving
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
