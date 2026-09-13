export default function FilterChipGroup({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:[scrollbar-width:thin]">
        {options.map((option) => {
          const selected = String(value) === String(option.value);
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={
                "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 " +
                (selected
                  ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-950/30"
                  : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white")
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
