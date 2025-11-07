import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

export default function FeedbackMessage({ type, text }) {
  const icons = {
    success: <FaCheckCircle />,
    warning: <FaExclamationTriangle />,
    error: <FaTimesCircle />,
  };

  return (
    <p className={`message ${type}`}>
      {icons[type]} {text}
    </p>
  );
}
