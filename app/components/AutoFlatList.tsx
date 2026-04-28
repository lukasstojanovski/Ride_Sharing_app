import { useMemo, useState } from "react";
import { FlatList, type FlatListProps, type LayoutChangeEvent } from "react-native";

export function AutoFlatList<ItemT>(props: FlatListProps<ItemT>) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollEnabled = useMemo(
    () => contentHeight > containerHeight + 1,
    [contentHeight, containerHeight]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
    props.onLayout?.(event);
  };

  const handleContentSizeChange = (width: number, height: number) => {
    setContentHeight(height);
    props.onContentSizeChange?.(width, height);
  };

  return (
    <FlatList
      {...props}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      scrollEnabled={props.scrollEnabled ?? scrollEnabled}
      bounces={props.bounces ?? true}
      alwaysBounceVertical={props.alwaysBounceVertical ?? true}
    />
  );
}
