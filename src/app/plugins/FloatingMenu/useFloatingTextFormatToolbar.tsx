import { $isCodeHighlightNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import {
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	LexicalEditor,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "./getSelectedNode";
import { TextFormatFloatingToolbar } from "./TextFormatFloatingToolbar";

export function useFloatingTextFormatToolbar(
	editor: LexicalEditor,
	anchorElem: HTMLElement
): JSX.Element | null {
	const [isText, setIsText] = useState(false);
	const [isLink, setIsLink] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isSubscript, setIsSubscript] = useState(false);
	const [isSuperscript, setIsSuperscript] = useState(false);
	const [isCode, setIsCode] = useState(false);

	const updatePopup = useCallback(() => {
		editor.getEditorState().read(() => {
			// Should not to pop up the floating toolbar when using IME input
			if (editor.isComposing()) {
				return;
			}
			const selection = $getSelection();
			const nativeSelection = window.getSelection();
			const rootElement = editor.getRootElement();

			if (
				nativeSelection !== null &&
				(!$isRangeSelection(selection) ||
					rootElement === null ||
					!rootElement.contains(nativeSelection.anchorNode))
			) {
				setIsText(false);
				return;
			}

			if (!$isRangeSelection(selection)) {
				return;
			}

			const node = getSelectedNode(selection);

			// Update text format
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsSubscript(selection.hasFormat("subscript"));
			setIsSuperscript(selection.hasFormat("superscript"));
			setIsCode(selection.hasFormat("code"));

			// Update links
			const parent = node.getParent();
			if ($isLinkNode(parent) || $isLinkNode(node)) {
				setIsLink(true);
			} else {
				setIsLink(false);
			}

			if (
				!$isCodeHighlightNode(selection.anchor.getNode()) &&
				selection.getTextContent() !== ""
			) {
				setIsText($isTextNode(node));
			} else {
				setIsText(false);
			}

			const rawTextContent = selection.getTextContent().replace(/\n/g, "");
			if (!selection.isCollapsed() && rawTextContent === "") {
				setIsText(false);
				return;
			}
		});
	}, [editor]);

	useEffect(() => {
		document.addEventListener("selectionchange", updatePopup);
		return () => {
			document.removeEventListener("selectionchange", updatePopup);
		};
	}, [updatePopup]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updatePopup();
			}),
			editor.registerRootListener(() => {
				if (editor.getRootElement() === null) {
					setIsText(false);
				}
			})
		);
	}, [editor, updatePopup]);

	if (!isText || isLink) {
		return null;
	}

	return createPortal(
		<TextFormatFloatingToolbar
			editor={editor}
			anchorElem={anchorElem}
			isLink={isLink}
			isBold={isBold}
			isItalic={isItalic}
			isStrikethrough={isStrikethrough}
			isSubscript={isSubscript}
			isSuperscript={isSuperscript}
			isUnderline={isUnderline}
			isCode={isCode}
		/>,
		anchorElem
	);
}
