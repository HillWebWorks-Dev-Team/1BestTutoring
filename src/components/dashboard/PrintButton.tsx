"use client";

export function PrintButton({ label = "Print receipt" }: { label?: string }) {
  return (
    <button className="btn btn-primary print:hidden" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
