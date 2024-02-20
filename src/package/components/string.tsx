import { createRenderEffect, createSignal, mergeProps } from "solid-js";
import { Editor, Text, Path, Element, Node } from "slate";

// index index-fix
import { SolidEditor } from "../plugin/solid-editor";
import { useSlateStatic } from "../hooks/use-slate-static";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { IS_ANDROID } from "../utils/environment";
import { MARK_PLACEHOLDER_SYMBOL } from "../utils/weak-maps";

/**
 * Leaf content strings.
 */

const String = (props: { isLast: boolean; leaf: Text; parent: Element; text: Text }) => {
	const editor = useSlateStatic();
	const path = () => SolidEditor.findPath(editor(), props.text);
	const parentPath = () => Path.parent(path());
	const isMarkPlaceholder = () => Boolean(props.leaf[MARK_PLACEHOLDER_SYMBOL]);

	let jsx = <TextString text={props.leaf.text} />;
	console.log("Running text effects");

	// COMPAT: Render text inside void nodes with a zero-width space.
	// So the node can contain selection but the text is not visible.
	createRenderEffect(() => {
		if (editor().isVoid(props.parent)) {
			jsx = <ZeroWidthString length={Node.string(props.parent).length} />;
		}
	});

	// COMPAT: If this is the last text node in an empty block, render a zero-
	// width space that will convert into a line break when copying and pasting
	// to support expected plain text.
	createRenderEffect(() => {
		if (
			props.leaf.text === "" &&
			props.parent.children[props.parent.children.length - 1] === props.text &&
			!editor().isInline(props.parent) &&
			Editor.string(editor(), parentPath()) === ""
		) {
			jsx = <ZeroWidthString isLineBreak isMarkPlaceholder={isMarkPlaceholder()} />;
		}
	});

	// COMPAT: If the text is empty, it's because it's on the edge of an inline
	// node, so we render a zero-width space so that the selection can be
	// inserted next to it still.
	createRenderEffect(() => {
		if (props.leaf.text === "") {
			jsx = <ZeroWidthString isMarkPlaceholder={isMarkPlaceholder()} />;
		}
	});

	// COMPAT: Browsers will collapse trailing new lines at the end of blocks,
	// so we need to add an extra trailing new lines to prevent that.
	createRenderEffect(() => {
		if (props.isLast && props.leaf.text.slice(-1) === "\n") {
			jsx = <TextString isTrailing text={props.leaf.text} />;
		}
	});

	return jsx;
};

/**
 * Leaf strings with text in them.
 */
const TextString = (props: { text: string; isTrailing?: boolean }) => {
	const merge = mergeProps(
		{
			isTrailing: false,
		},
		props
	);
	let ref: HTMLSpanElement | undefined;
	const getTextContent = () => {
		console.log("Running Text", merge.text, merge.isTrailing);
		return `${merge.text ?? ""}${merge.isTrailing ? "\n" : ""}`;
	};
	const [initialText] = createSignal(getTextContent);

	// This is the actual text rendering boundary where we interface with the DOM
	// The text is not rendered as part of the virtual DOM, as since we handle basic character insertions natively,
	// updating the DOM is not a one way dataflow anymore. What we need here is not reconciliation and diffing
	// with previous version of the virtual DOM, but rather diffing with the actual DOM element, and replace the DOM <span> content
	// exactly if and only if its current content does not match our current virtual DOM.
	// Otherwise the DOM TextNode would always be replaced by React as the user types, which interferes with native text features,
	// eg makes native spellcheck opt out from checking the text node.

	// useLayoutEffect: updating our span before browser paint
	useIsomorphicLayoutEffect(() => {
		// null coalescing text to make sure we're not outputing "null" as a string in the extreme case it is nullish at runtime
		const textWithTrailing = getTextContent();

		if (ref && ref.textContent !== textWithTrailing) {
			ref.textContent = textWithTrailing;
		}

		// intentionally not specifying dependencies, so that this effect runs on every render
		// as this effectively replaces "specifying the text in the virtual DOM under the <span> below" on each render
	});

	// We intentionally render a memoized <span> that only receives the initial text content when the component is mounted.
	// We defer to the layout effect above to update the `textContent` of the span element when needed.
	// return <MemoizedText ref={ref}>{initialText}</MemoizedText>;
	return (
		<span data-slate-string="true" ref={ref}>
			{initialText()()}
		</span>
	);
};

// Maybe-Beware
// const MemoizedText = memo(
// 	forwardRef<HTMLSpanElement, { children: string }>((props, ref) => {
// 		return (
// 			<span data-slate-string ref={ref}>
// 				{props.children}
// 			</span>
// 		);
// 	})
// );

/**
 * Leaf strings without text, render as zero-width strings.
 */

export const ZeroWidthString = (props: { length?: number; isLineBreak?: boolean; isMarkPlaceholder?: boolean }) => {
	const merge = mergeProps(
		{
			length: 0,
			isLineBreak: false,
			isMarkPlaceholder: false,
		},
		props
	);

	const attributes: () => {
		"data-slate-zero-width": string;
		"data-slate-length": number;
		"data-slate-mark-placeholder"?: boolean;
	} = () => ({
		"data-slate-zero-width": merge.isLineBreak ? "n" : "z",
		"data-slate-length": length,
	});

	createRenderEffect(() => {
		if (merge.isMarkPlaceholder) {
			attributes()["data-slate-mark-placeholder"] = true;
		}
	});

	return (
		<span {...attributes}>
			{!IS_ANDROID || !merge.isLineBreak ? "\uFEFF" : null}
			{merge.isLineBreak ? <br /> : null}
		</span>
	);
};

export default String;

