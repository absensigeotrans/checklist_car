"use client";

interface FuelGaugeProps {
  value: number;
  onChange: (value: number) => void;
}

function getStatusText(value: number): string {
  if (value <= 5) return "E (Empty)";
  if (value <= 35) return "1/4";
  if (value <= 65) return "1/2";
  if (value <= 90) return "3/4";
  return "F (Full)";
}

export default function FuelGauge({ value, onChange }: FuelGaugeProps) {
  const deg = -90 + (value / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="relative w-[200px] h-[100px] border-b-2 border-border overflow-hidden">
        <div className="w-[200px] h-[200px] rounded-full border-[10px] border-bg-sidebar border-b-transparent border-l-transparent -rotate-45 absolute top-0 left-0" />
        <div
          className="w-[4px] h-[80px] bg-primary-red absolute bottom-0 left-[98px] origin-bottom-center rounded-sm after:content-[''] after:absolute after:-bottom-1 after:-left-1 after:w-3 after:h-3 after:bg-text-main after:rounded-full"
          style={{ transform: `rotate(${deg}deg)`, transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <div className="absolute w-full bottom-[5px] flex justify-between px-[10px] text-xs font-bold text-text-muted">
          <span>E</span>
          <span>1/4</span>
          <span>1/2</span>
          <span>3/4</span>
          <span>F</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-[300px]"
      />
      <span className="font-bold text-primary-blue">
        Status: {getStatusText(value)} ({value}%)
      </span>
    </div>
  );
}
