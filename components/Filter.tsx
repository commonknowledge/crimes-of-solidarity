import cx from "classnames";
import pluralize from "pluralize";

export function FilterButton({
  label = "Select",
  selectionCount,
  isOpen,
}: {
  label?: string;
  selectionCount?: number;
  isOpen?: boolean;
}) {
  const hasSelections = !!selectionCount;
  return (
    <div
      className={cx(
        !isOpen && !hasSelections ? "border-gray-300" : "",
        isOpen
          ? "border-b-0 rounded-b-none bg-white z-50 border-white"
          : "hover:shadow-innerActiveBlue",
        hasSelections ? "border-white" : "",
        !isOpen && hasSelections
          ? "text-black border-black"
          : isOpen && hasSelections
          ? "text-black border-black"
          : // Untouched state
            "hover:border-white active:bg-white",
        "text-midGrey border-2 px-3 py-2 text-sm font-normal font-mono w-full relative"
      )}
    >
      {!selectionCount ? label : pluralize(label, selectionCount, true)}
      &nbsp;
      <span
        className={cx(
          isOpen ? "rotate-180" : "",
          "transform text-midGrey inline-block text-lg leading-none"
        )}
      >
        ▾
      </span>
    </div>
  );
}

type HeadlessUiListBoxOptionArgs = {
  active: boolean;
  selected: boolean;
  disabled: boolean;
};

export function FilterOption({
  children,
  active,
  selected,
  disabled,
}: {
  children?: any;
} & HeadlessUiListBoxOptionArgs) {
  return (
    <div
      className={cx(
        selected
          ? "bg-white"
          : disabled
          ? "text-gray-400 cursor-not-allowed"
          : active
          ? "bg-gray-100"
          : "bg-white",
        "px-3 py-2 cursor-pointer text-left flex justify-start items-baseline w-full"
      )}
    >
      {children}
    </div>
  );
}
