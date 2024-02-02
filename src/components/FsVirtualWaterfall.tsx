import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ICardItem, IColumnQueue, IItemRect, IRenderItem, IVirtualWaterFallProps } from "./types";
import { rafThrottle } from "./tool";

const FsVirtualWaterfall = (props: IVirtualWaterFallProps) => {
  const containerRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  const [dataState, setDataState] = useState({
    loading: false,
    isFinish: false,
    currentPage: 1,
    list: [] as ICardItem[],
  });

  const [scrollState, setScrollState] = useState({
    viewWidth: 0,
    viewHeight: 0,
    start: 0,
  });

  const [queueState, setQueueState] = useState({
    queue: new Array(props.column).fill(0).map<IColumnQueue>(() => ({ list: [], height: 0 })),
    len: 0,
  });

  const [listStyle, setListStyle] = useState<CSSProperties>({});

  const itemSizeInfo = useMemo(() => {
    return dataState.list.reduce<Map<ICardItem["id"], IItemRect>>((pre, current) => {
      const itemWidth = Math.floor((scrollState.viewWidth - (props.column - 1) * props.gap) / props.column);
      pre.set(current.id, {
        width: itemWidth,
        height: Math.floor((itemWidth * current.height) / current.width),
      });
      return pre;
    }, new Map());
  }, [dataState.list]);

  useEffect(() => {
    itemSizeInfo.size && addInQueue();
  }, [itemSizeInfo]);

  const end = useMemo(() => scrollState.viewHeight + scrollState.start, [scrollState]);

  const cardList = useMemo(
    () => queueState.queue.reduce<IRenderItem[]>((pre, { list }) => pre.concat(list), []),
    [queueState]
  );

  const renderList = useMemo(
    () => cardList.filter((i) => i.h + i.y > scrollState.start && i.y < end),
    [queueState, end]
  );

  const computedHeight = () => {
    let minIndex = 0,
      minHeight = Infinity,
      maxHeight = -Infinity;
    queueState.queue.forEach(({ height }, index) => {
      if (height < minHeight) {
        minHeight = height;
        minIndex = index;
      }
      if (height > maxHeight) {
        maxHeight = height;
      }
    });
    setListStyle({ height: `${maxHeight}px` });
    return {
      minIndex,
      minHeight,
    };
  };

  const addInQueue = (size = props.pageSize) => {
    const queue = queueState.queue;
    let len = queueState.len;
    for (let i = 0; i < size; i++) {
      const minIndex = computedHeight().minIndex;
      const currentColumn = queue[minIndex];
      const before = currentColumn.list[currentColumn.list.length - 1] || null;
      const dataItem = dataState.list[len];
      const item = generatorItem(dataItem, before, minIndex);
      currentColumn.list.push(item);
      currentColumn.height += item.h;
      len++;
    }
    setQueueState({ queue: [...queue], len });
  };

  const generatorItem = (item: ICardItem, before: IRenderItem | null, index: number): IRenderItem => {
    const rect = itemSizeInfo.get(item.id);
    const width = rect!.width;
    const height = rect!.height;
    let y = 0;
    if (before) y = before.y + before.h + props.gap;

    return {
      item,
      y,
      h: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate3d(${index === 0 ? 0 : (width + props.gap) * index}px, ${y}px, 0)`,
      },
    };
  };

  const loadDataList = async () => {
    if (dataState.isFinish) return;
    dataState.loading = true;
    setDataState({ ...dataState, loading: true });
    const list = await props.request(dataState.currentPage++, props.pageSize);
    if (!list.length) {
      setDataState({ ...dataState, isFinish: true });
      return;
    }
    setDataState({ ...dataState, list: [...dataState.list, ...list], loading: false });
    return list.length;
  };

  const handleScroll = rafThrottle(() => {
    const { scrollTop, clientHeight } = containerRef.current!;
    setScrollState({ ...scrollState, start: scrollTop });
    if (scrollTop + clientHeight > computedHeight().minHeight) {
      !dataState.loading && loadDataList();
    }
  });

  const initScrollState = () => {
    setScrollState({
      viewWidth: containerRef.current!.clientWidth,
      viewHeight: containerRef.current!.clientHeight,
      start: containerRef.current!.scrollTop,
    });
  };

  const init = async () => {
    initScrollState();
    await loadDataList();
  };

  return (
    <div className="w-full h-full overflow-y-scroll overflow-x-hidden" ref={containerRef} onScroll={handleScroll}>
      <div className="relative w-full" style={listStyle}>
        {renderList.map(({ item, style }) => (
          <div className="absolute top-0 left-0 box-border" key={item.id} style={style}>
            {props.children(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FsVirtualWaterfall;
