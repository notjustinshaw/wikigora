import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";

const tailwindPlaceholderClasses = [
	"before:float-left",
	"before:text-neutral-400",
	"before:dark:text-neutral-600",
	"before:pointer-events-none",
	"before:h-0",
	"before:content-[attr(data-placeholder)]",
];

const getPlaceholder = (node: HeadingNode): string => {
	switch (node.getTag()) {
		case "h1":
			return "Heading 1";
		case "h2":
			return "Heading 2";
		case "h3":
			return "Heading 3";
		case "h4":
			return "Heading 4";
		case "h5":
			return "Heading 5";
		default:
			return "Heading 6";
	}
};

export const HeadingPlaceholderPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const headingRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const removeUpdateListener = editor.registerUpdateListener(
			({ editorState }) => {
				const nativeSelection = window.getSelection();
				editorState.read(() => {
					// Cleanup
					if (headingRef?.current) {
						headingRef.current.removeAttribute("data-placeholder");
						headingRef.current.classList.remove(...tailwindPlaceholderClasses);
						headingRef.current = null;
					}

					const selection = $getSelection();
					if (!nativeSelection || !selection || !$isRangeSelection(selection))
						return;

					const parentNode = selection.anchor.getNode();
					if (!$isHeadingNode(parentNode) || !parentNode.isEmpty()) return;

					// It's a heading node, it's empty, and it's selected
					// Now switch over to the native selection to get the heading DOM element
					const headingDOMElement = nativeSelection.anchorNode;
					if (!headingDOMElement) return;
					if (headingDOMElement instanceof HTMLHeadingElement) {
						headingRef.current = headingDOMElement;
						headingRef.current.setAttribute(
							"data-placeholder",
							getPlaceholder(parentNode)
						);
						headingRef.current.classList.add(...tailwindPlaceholderClasses);
					}
				});
			}
		);

		return () => {
			removeUpdateListener();
		};
	}, [editor]);

	return null;
};
