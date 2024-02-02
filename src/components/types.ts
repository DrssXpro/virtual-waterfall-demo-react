import { CSSProperties } from "react";

export interface IVirtualWaterFallProps {
  gap: number;
  column: number;
  pageSize: number;
  enterSize?: number;
  request: (page: number, pageSize: number) => Promise<ICardItem[]>;
  children: (detail: ICardItem) => React.ReactElement;
}

export interface ICardItem {
  id: number | string;
  width: number;
  height: number;
  [key: string]: any;
}

export interface IColumnQueue {
  list: IRenderItem[];
  height: number;
}

// 渲染视图项
export interface IRenderItem {
  item: ICardItem;
  y: number;
  h: number;
  style: CSSProperties;
}

export interface IItemRect {
  width: number;
  height: number;
}
