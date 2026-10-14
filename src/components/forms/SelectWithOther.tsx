"use client";

export function SelectWithOther({
  id,
  label,
  name,
  options,
  value,
  otherValue,
  onSelect,
  onOther,
  required,
  otherPlaceholder = "If other, type your answer",
  otherInputType = "text",
  formatOption,
  className = "",
}: {
  id: string;
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  otherValue: string;
  onSelect: (value: string) => void;
  onOther: (value: string) => void;
  required?: boolean;
  otherPlaceholder?: string;
  otherInputType?: "text" | "number";
  formatOption?: (option: string) => string;
  className?: string;
}) {
  const inList = options.includes(value);
  const selectValue = inList ? value : "Other";
  const needsOther = selectValue === "Other" || selectValue === "None of these / prefer to describe";

  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field"
        name={name}
        value={selectValue}
        required={required}
        onChange={(event) => onSelect(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
      {needsOther ? (
        <>
          <label className="label mt-3" htmlFor={`${id}Other`}>
            Other — tell us what fits
          </label>
          <input
            id={`${id}Other`}
            className="field"
            name={`${name}Other`}
            type={otherInputType}
            value={otherValue}
            onChange={(event) => onOther(event.target.value)}
            placeholder={otherPlaceholder}
            required={required}
            min={otherInputType === "number" ? 1 : undefined}
          />
        </>
      ) : (
        <input type="hidden" name={`${name}Other`} value="" />
      )}
    </div>
  );
}
