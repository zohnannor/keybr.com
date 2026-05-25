import { Rect, type ShapeList, Shapes, type Size } from "@keybr/widget";
import { type ReactNode } from "react";
import { type ChartStyles } from "./use-chart-styles.ts";

export type SizeProps = {
  readonly width: string;
  readonly height: string;
};

export function Chart({
  children,
  width,
  height,
}: {
  readonly children: ReactNode;
} & SizeProps): ReactNode {
  return (
    <div
      style={{
        display: "block",
        position: "relative",
        insetInlineStart: "0px",
        insetBlockStart: "0px",
        inlineSize: width,
        blockSize: height,
        margin: "0px",
        padding: "0px",
        borderStyle: "none",
      }}
    >
      {children}
    </div>
  );
}

export function chartArea(
  styles: ChartStyles,
  cb: (d: Rect) => ShapeList,
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  },
) {
  return ({ width, height }: Size) => {
    const left = styles.lineHeight * (padding?.left ?? 5);
    const right = styles.lineHeight * (padding?.right ?? 5);
    const top = styles.lineHeight * (padding?.top ?? 2);
    const bottom = styles.lineHeight * (padding?.bottom ?? 2);
    const area = new Rect(
      left,
      top,
      width - left - right,
      height - top - bottom,
    ).round();
    return [Shapes.clear(), cb(area)];
  };
}
