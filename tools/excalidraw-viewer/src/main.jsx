import React, { useState, useCallback, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const file = new URLSearchParams(window.location.search).get("file") || "";

function App() {
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const stateRef = useRef(null);
  const firstChange = useRef(true);

  useEffect(() => {
    if (!file) { setError("缺少 ?file= 参数"); return; }
    fetch("/" + encodeURI(file))
      .then(async (r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        if (!Array.isArray(data.elements)) throw new Error("不是合法的 .excalidraw 文件");
        setInitialData({
          elements: data.elements,
          appState: {
            viewBackgroundColor: (data.appState && data.appState.viewBackgroundColor) || "#ffffff",
          },
        });
      })
      .catch((e) => setError(`加载失败 ${file}: ${e.message}`));
  }, []);

  const onChange = (elements, appState) => {
    if (firstChange.current) { firstChange.current = false; return; } // 初始 restore 不算脏
    stateRef.current = { elements, appState };
    setDirty(true);
  };

  const save = useCallback(async () => {
    const s = stateRef.current;
    if (!s) return;
    const payload = {
      file,
      data: {
        type: "excalidraw",
        version: 2,
        source: "present2me-viewer",
        elements: s.elements,
        appState: { viewBackgroundColor: s.appState.viewBackgroundColor || "#ffffff" },
      },
    };
    try {
      const r = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString());
      setTimeout(() => setSavedAt(""), 2500);
    } catch (e) {
      alert("保存失败: " + e.message);
    }
  }, [file]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  if (error) return <div className="bar"><span className="error">{error}</span></div>;
  if (!initialData) return <div className="bar"><span>加载中… {file}</span></div>;

  return (
    <>
      <div className="bar">
        <span className="fname">{file}</span>
        <span className={"dot " + (dirty ? "dirty" : "clean")} title={dirty ? "有未保存修改" : "无修改"} />
        {savedAt && <span className="saved">已保存 {savedAt}</span>}
        <span className="tip">改动会保存回同一文件（Agent 下次迭代前会重读）</span>
        <button onClick={save} disabled={!dirty}>{dirty ? "保存 ⌘S" : "已保存"}</button>
      </div>
      <div className="canvas">
        <Excalidraw initialData={initialData} onChange={onChange} theme="light" />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
