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

  // Shape selection handler
  const handleShapeSelect = (shape: ShapeType, label: string) => {
    setSelectedShape(shape);
    setSelectedShapeLabel(label);
    setIsDropdownOpen(false); // Close the list after selection
  };

  // Click handler for the "Shape" button
  const handleShapeButtonClick = () => {
    if (!isDropdownOpen) {
      // If the drop-down list is not open, activate the "Shape" tool and select the rectangle
      setTool(Tool.Shape);
      if (!selectedShape) {
        handleShapeSelect(ShapeType.Rectangle, "Rectangle");
      }
    } else {
      // If the list is open, simply switch its state
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Function to set the style of the active button
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
      {/* Button to select a figure */}
      <div className="dropdown">
        <button
          onClick={handleShapeButtonClick}
          style={getButtonStyle(Tool.Shape)}
          className="btn"
        >
          <span>{selectedShapeLabel} </span>

          <span
            onClick={(e) => {
              e.stopPropagation(); // Stopping an event from bubbling
              setIsDropdownOpen(!isDropdownOpen); // Switching the state of the list
              setTool(Tool.Shape);
            }}
          >
            {isDropdownOpen ? <GoTriangleUp /> : <GoTriangleDown />}
          </span>
        </button>
        {/* Drop-down list for selecting a shape */}
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
