import { useEffect, useState } from "react";
import { checkBackend } from "../services/api";

function BackendTest() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    checkBackend()
      .then((data) => {
        setStatus(data.message);
      })
      .catch(() => {
        setStatus("Backend connection failed");
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>RESQ Backend Test</h1>
      <p>{status}</p>
    </div>
  );
}

export default BackendTest;