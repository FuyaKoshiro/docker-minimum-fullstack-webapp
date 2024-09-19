"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8080/db").then(async (res) => {
      const data = await res.json();
      const now = data[0].now;
      setResponse(now);
    });
  }, []);

  return <div>now: {response}</div>;
}
