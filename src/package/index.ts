// Components
export { Editable, DefaultPlaceholder } from "./components/editable";

export type { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from "./components/editable";

export { DefaultElement } from "./components/element";
export { DefaultLeaf } from "./components/leaf";
export { Slate } from "./components/slate";

// Hooks
export { useEditor } from "./hooks/use-editor";
export { useSlateStatic } from "./hooks/use-slate-static";
export { useFocused } from "./hooks/use-focused";
export { useReadOnly } from "./hooks/use-read-only";
export { useSelected } from "./hooks/use-selected";
export { useSlate, useSlateWithV } from "./hooks/use-slate";
export { useSlateSelector } from "./hooks/use-slate-selector";
export { useSlateSelection } from "./hooks/use-slate-selection";

// Plugin
export { SolidEditor } from "./plugin/solid-editor";
export { withSolid } from "./plugin/with-solid";
