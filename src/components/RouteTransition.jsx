import { useLocation } from "react-router-dom";

export default function RouteTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname + location.search} className="route-transition">
      {children}
    </div>
  );
}
