import type { JSX } from "react";

export type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export type DatePreset = {
  label: string;
  from: Date;
  to: Date;
  shortcut: string;
};

// TODO: we could type the value(!) especially when using enums
export type Option = {
  label: string;
  value: string | boolean | number | undefined;
};

export type Input = {
  type: "input";
  options?: Option[];
};

export type Checkbox = {
  type: "checkbox";
  component?: (props: Option) => JSX.Element | null;
  options?: Option[];
};

export type Slider = {
  type: "slider";
  min: number;
  max: number;
  // if options is undefined, we will provide all the steps between min and max
  options?: Option[];
};

export type Timerange = {
  type: "timerange";
  options?: Option[]; // required for TS
  presets?: DatePreset[];
};

export type Base<TData> = {
  label: string;
  value: keyof TData;
  /**
   * Defines if the accordion in the filter bar is open by default
   */
  defaultOpen?: boolean;
  /**
   * Defines if the command input is disabled for this field
   */
  commandDisabled?: boolean;
};

export type DataTableCheckboxFilterField<TData> = Base<TData> & Checkbox;
export type DataTableSliderFilterField<TData> = Base<TData> & Slider;
export type DataTableInputFilterField<TData> = Base<TData> & Input;
export type DataTableTimerangeFilterField<TData> = Base<TData> & Timerange;

export type DataTableFilterField<TData> =
  | DataTableCheckboxFilterField<TData>
  | DataTableSliderFilterField<TData>
  | DataTableInputFilterField<TData>
  | DataTableTimerangeFilterField<TData>;

/** ----------------------------------------- */

export type SheetField<TData, TMeta = Record<string, unknown>> = {
  id: keyof TData;
  label: string;
  // FIXME: rethink that! I dont think we need this as there is no input type
  // REMINDER: readonly if we only want to copy the value (e.g. uuid)
  // TODO: we might have some values that are not in the data but can be computed
  type: "readonly" | "input" | "checkbox" | "slider" | "timerange";
  component?: (
    // REMINDER: this is used to pass additional data like the `InfiniteQueryMeta`
    props: TData & {
      metadata?: {
        totalRows: number;
        filterRows: number;
        totalRowsFetched: number;
      } & TMeta;
    }
  ) => JSX.Element | null | string;
  condition?: (props: TData) => boolean;
  className?: string;
  skeletonClassName?: string;
};
