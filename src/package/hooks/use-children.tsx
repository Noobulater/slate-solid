import { Ancestor, Descendant, Editor, Element, Range } from "slate";
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from "../components/editable";

import ElementComponent from "../components/element";
import TextComponent from "../components/text";
import { SolidEditor } from "../plugin/solid-editor";
import { NODE_TO_INDEX, NODE_TO_PARENT } from "../utils/weak-maps";
import { useDecorate } from "./use-decorate";
import { SelectedContext } from "./use-selected";
import { useSlateStatic } from "./use-slate-static";
import { JSX } from "solid-js";

/**
 * Children.
 */

const useChildren = (props: {
	decorations: Range[];
	node: Ancestor;
	renderElement?: (props: RenderElementProps) => JSX.Element;
	renderPlaceholder: (props: RenderPlaceholderProps) => JSX.Element;
	renderLeaf?: (props: RenderLeafProps) => JSX.Element;
	selection: Range | null;
}) => {
	const decorate = useDecorate();
	const editor = useSlateStatic();

	console.log("Came this far", editor, props.node);
	const path = SolidEditor.findPath(editor, props.node);
	console.log(path);
	const children: JSX.Element[] = [];
	const isLeafBlock =
		Element.isElement(props.node) && !editor.isInline(props.node) && Editor.hasInlines(editor, props.node);

	for (let i = 0; i < props.node.children.length; i++) {
		const p = path.concat(i);
		const n = props.node.children[i] as Descendant;
		const key = SolidEditor.findKey(editor, n);
		const range = Editor.range(editor, p);
		const sel = props.selection && Range.intersection(range, props.selection);
		const ds = decorate([n, p]);

		for (const dec of props.decorations) {
			const d = Range.intersection(dec, range);

			if (d) {
				ds.push(d);
			}
		}

		if (Element.isElement(n)) {
			console.log("Didn;t reach here");
			children.push(
				// Beware key={`provider-${key.id}`}
				<SelectedContext.Provider value={!!sel}>
					<ElementComponent
						decorations={ds}
						element={n}
						// Beware key
						// key={key.id}
						renderElement={props.renderElement}
						renderPlaceholder={props.renderPlaceholder}
						renderLeaf={props.renderLeaf}
						selection={sel}
					/>
				</SelectedContext.Provider>
			);
			console.log("I DID REACH reach here");
		} else {
			children.push(
				<TextComponent
					decorations={ds}
					// Beware Key
					// key={key.id}
					isLast={isLeafBlock && i === props.node.children.length - 1}
					parent={props.node}
					renderPlaceholder={props.renderPlaceholder}
					renderLeaf={props.renderLeaf}
					text={n}
				/>
			);
		}

		NODE_TO_INDEX.set(n, i);
		NODE_TO_PARENT.set(n, props.node);
		console.log("Set Parent");
	}

	return children;
};

export default useChildren;
