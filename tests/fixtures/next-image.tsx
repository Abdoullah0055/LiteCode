import type { ImgHTMLAttributes } from "react";
export default function Image(props: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  const { priority, ...imageProps } = props;
  void priority;
  return <img {...imageProps} />;
}
