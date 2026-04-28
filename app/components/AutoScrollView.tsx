import { useMemo, useState } from "react";
import { ScrollView, type LayoutChangeEvent, type ScrollViewProps } from "react-native";

export function AutoScrollView(props: ScrollViewProps) {
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
    <ScrollView
      {...props}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      scrollEnabled={props.scrollEnabled ?? scrollEnabled}
      bounces={props.bounces ?? true}
      alwaysBounceVertical={props.alwaysBounceVertical ?? true}
    />
  );
}
