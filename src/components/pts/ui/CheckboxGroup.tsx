"use client";

interface CheckboxGroupProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  columns?: 1 | 2;
}

export default function CheckboxGroup({
  options,
  selected,
  onChange,
  columns = 1,
}: CheckboxGroupProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className={columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "flex flex-col gap-2"}>
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checked ? "bg-red-50 border-[#C41230]" : "bg-white border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#C41230] shrink-0"
              checked={checked}
              onChange={() => toggle(opt.value)}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
