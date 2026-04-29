declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss?inline' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
