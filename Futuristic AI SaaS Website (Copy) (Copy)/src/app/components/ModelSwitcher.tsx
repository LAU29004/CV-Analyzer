import { useEffect, useState } from "react";

type Model = "Gemini" | "ChatGPT" | "Groq";

export interface ModelSwitcherProps {
  defaultModel?: Model;
  onChange?: (model: Model) => void;
}

const models: Model[] = ["Gemini", "ChatGPT", "Groq"];

function ModelSwitcher({
  defaultModel = "Gemini",
  onChange,
}: ModelSwitcherProps) {
  const [selected, setSelected] = useState<Model>(defaultModel);

  // Keep internal state in sync if the parent's defaultModel arrives later
  // (e.g. loaded async from the backend after this component already mounted).
  useEffect(() => {
    setSelected(defaultModel);
  }, [defaultModel]);

  const handleSelect = (model: Model) => {
    setSelected(model);
    onChange?.(model);
  };

  const activeIndex = models.indexOf(selected);
  const count = models.length;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">
        Model Switcher
      </span>

      <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-1 w-80 h-11 overflow-hidden shadow-inner">
        {/* Sliding gradient pill, position derived from active index so it scales to any number of options */}
        <div
          className="absolute left-1 top-1 bottom-1 rounded-full bg-gradient-to-r from-amber-400 via-violet-400 to-cyan-400 shadow-md shadow-violet-500/25 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: `calc(${100 / count}% - ${8 / count}px)`,
            transform: `translateX(calc(${activeIndex} * 100%))`,
          }}
        />

        {models.map((model) => {
          const isActive = selected === model;
          return (
            <button
              key={model}
              onClick={() => handleSelect(model)}
              className={`relative z-10 flex-1 h-full whitespace-nowrap px-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                isActive ? "text-neutral-950" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {model}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ModelSwitcher;