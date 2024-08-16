import { useState } from "react";
import { Tool, ShapeType } from "../utils/enums";

// react icons
import { FaRegHandPaper } from "react-icons/fa";
import { CiLocationArrow1 } from "react-icons/ci";
import { GoTriangleUp, GoTriangleDown } from "react-icons/go";
// global context
import { useGlobalContext } from "../context";

const ToolBar = () => {
  const { setTool, tool, setSelectedShape, selectedShape } = useGlobalContext();
  const [selectedShapeLabel, setSelectedShapeLabel] = useState("Rectangle");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Обработчик выбора фигуры
  const handleShapeSelect = (shape: ShapeType, label: string) => {
    setSelectedShape(shape);
    setSelectedShapeLabel(label);
    setIsDropdownOpen(false); // Закрываем список после выбора
  };

  // Обработчик клика по кнопке "Shape"
  const handleShapeButtonClick = () => {
    if (!isDropdownOpen) {
      // Если выпадающий список не открыт, активируем инструмент "Shape" и выбираем прямоугольник
      setTool(Tool.Shape);
      if (!selectedShape) {
        handleShapeSelect(ShapeType.Rectangle, "Rectangle");
      }
    } else {
      // Если список открыт, просто переключаем его состояние
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Функция для установки стиля активной кнопки
  const getButtonStyle = (currentTool: Tool) => {
    return tool === currentTool
      ? { border: "2px solid blue" }
      : { border: "2px solid transparent" };
  };

  return (
    <div className="toolbar">
      <button
        onClick={() => setTool(Tool.Hand)}
        style={getButtonStyle(Tool.Hand)}
        className="btn"
      >
        <FaRegHandPaper />
      </button>
      <button
        onClick={() => setTool(Tool.Cursor)}
        style={getButtonStyle(Tool.Cursor)}
        className="btn"
      >
        <CiLocationArrow1 />
      </button>
      {/* Кнопка для выбора фигуры */}
      <div className="dropdown">
        <button
          onClick={handleShapeButtonClick}
          style={getButtonStyle(Tool.Shape)}
          className="btn"
        >
          <span>{selectedShapeLabel} </span>

          <span
            onClick={(e) => {
              e.stopPropagation(); // Останавливаем всплытие события
              setIsDropdownOpen(!isDropdownOpen); // Переключаем состояние списка
            }}
          >
            {isDropdownOpen ? <GoTriangleUp /> : <GoTriangleDown />}
          </span>
        </button>
        {/* Выпадающий список для выбора фигуры */}
        {isDropdownOpen && (
          <ul className="dropdown-menu">
            <li
              onClick={() =>
                handleShapeSelect(ShapeType.Rectangle, "Rectangle")
              }
            >
              {/* Rect. First letter is capitalized */}
              {ShapeType.Rectangle.slice(0, 1).toUpperCase() +
                ShapeType.Rectangle.slice(1)}
            </li>
            <li onClick={() => handleShapeSelect(ShapeType.Circle, "Circle")}>
              {/* Circle, first letter is capitalized */}
              {ShapeType.Circle.slice(0, 1).toUpperCase() +
                ShapeType.Circle.slice(1)}
            </li>
            <li onClick={() => handleShapeSelect(ShapeType.Star, "Star")}>
              {/* Star, first letter is capitalized */}
              {ShapeType.Star.slice(0, 1).toUpperCase() +
                ShapeType.Star.slice(1)}
            </li>
          </ul>
        )}
      </div>
      <button
        onClick={() => setTool(Tool.Line)}
        style={getButtonStyle(Tool.Line)}
        className="btn"
      >
        Line
      </button>
    </div>
  );
};
export default ToolBar;
