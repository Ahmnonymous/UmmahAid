import React from "react";
import { Navigate } from "react-router-dom";

const Authmiddleware = (props) => {
  const authToken = localStorage.getItem("authToken");
  
  if (!authToken) {
    console.log("🔒 No auth token found, redirecting to login...");
    return (
      <Navigate to={{ pathname: "/login", state: { from: props.location } }} replace />
    );
  }
  
  return <React.Fragment>{props.children}</React.Fragment>;
};

export default Authmiddleware;
