/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
	$isAutoLinkNode,
	$isLinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	GridSelection,
	KEY_ESCAPE_COMMAND,
	LexicalEditor,
	NodeSelection,
	RangeSelection,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";

import { getSelectedNode } from "../../util/getSelectedNode";
import { setFloatingElemPositionForLinkEditor } from "../../util/setFloatingElemPositionForLinkEditor";
import { sanitizeUrl } from "../../util/url";
import { Check, Edit, Trash, X } from "lucide-react";

function FloatingLinkEditor({
	editor,
	isLink,
	setIsLink,
	anchorElem,
}: {
	editor: LexicalEditor;
	isLink: boolean;
	setIsLink: Dispatch<boolean>;
	anchorElem: HTMLElement;
}): JSX.Element {
	const editorRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [linkUrl, setLinkUrl] = useState("");
	const [editedLinkUrl, setEditedLinkUrl] = useState("");
	const [isEditMode, setEditMode] = useState(false);
	const [lastSelection, setLastSelection] = useState<
		RangeSelection | GridSelection | NodeSelection | null
	>(null);

	const updateLinkEditor = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = getSelectedNode(selection);
			const parent = node.getParent();
			if ($isLinkNode(parent)) {
				setLinkUrl(parent.getURL());
			} else if ($isLinkNode(node)) {
				setLinkUrl(node.getURL());
			} else {
				setLinkUrl("");
			}
		}
		const editorElem = editorRef.current;
		const nativeSelection = window.getSelection();
		const activeElement = document.activeElement;

		if (editorElem === null) {
			return;
		}

		const rootElement = editor.getRootElement();

		if (
			selection !== null &&
			nativeSelection !== null &&
			rootElement !== null &&
			rootElement.contains(nativeSelection.anchorNode) &&
			editor.isEditable()
		) {
			const domRect: DOMRect | undefined =
				nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
			if (domRect) {
				domRect.y += 40;
				setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem);
			}
			setLastSelection(selection);
		} else if (!activeElement || activeElement.className !== "link-input") {
			if (rootElement !== null) {
				setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem);
			}
			setLastSelection(null);
			setEditMode(false);
			setLinkUrl("");
		}

		return true;
	}, [anchorElem, editor]);

	useEffect(() => {
		const scrollerElem = anchorElem.parentElement;

		const update = () => {
			editor.getEditorState().read(() => {
				updateLinkEditor();
			});
		};

		window.addEventListener("resize", update);

		if (scrollerElem) {
			scrollerElem.addEventListener("scroll", update);
		}

		return () => {
			window.removeEventListener("resize", update);

			if (scrollerElem) {
				scrollerElem.removeEventListener("scroll", update);
			}
		};
	}, [anchorElem.parentElement, editor, updateLinkEditor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateLinkEditor();
				});
			}),

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateLinkEditor();
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_ESCAPE_COMMAND,
				() => {
					if (isLink) {
						setIsLink(false);
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_HIGH
			)
		);
	}, [editor, updateLinkEditor, setIsLink, isLink]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			updateLinkEditor();
		});
	}, [editor, updateLinkEditor]);

	useEffect(() => {
		if (isEditMode && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditMode]);

	// listen for enter or esc
	const monitorInputInteraction = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleLinkSubmission();
		} else if (event.key === "Escape") {
			event.preventDefault();
			setEditMode(false);
		}
	};

	// update the link in the DOM
	const handleLinkSubmission = () => {
		if (lastSelection !== null) {
			if (linkUrl !== "") {
				editor.dispatchCommand(
					TOGGLE_LINK_COMMAND,
					sanitizeUrl(editedLinkUrl)
				);
			}
			setEditMode(false);
		}
	};

	return (
		<div
			ref={editorRef}
			className='flex absolute top-0 left-0 z-10 max-w-sm w-full opacity-0 bg-white shadow-md rounded-md transition-opacity will-change-transform'>
			{!isLink ? null : isEditMode ? (
				<div className='flex flex-row gap-2 w-full py-1 px-2 text-base items-center'>
					<input
						ref={inputRef}
						className='flex-1 px-1 py-0.5'
						value={editedLinkUrl}
						onChange={(event) => {
							setEditedLinkUrl(event.target.value);
						}}
						onKeyDown={(event) => {
							monitorInputInteraction(event);
						}}
					/>
					<div
						role='button'
						tabIndex={0}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => {
							setEditMode(false);
						}}>
						<X size={18} strokeWidth={2} />
					</div>

					<div
						role='button'
						tabIndex={0}
						onMouseDown={(event) => event.preventDefault()}
						onClick={handleLinkSubmission}>
						<Check size={18} strokeWidth={2} />
					</div>
				</div>
			) : (
				<div className='flex flex-row gap-2 w-full py-1 px-2 text-base items-center'>
					<a
						className='flex-1'
						href={sanitizeUrl(linkUrl)}
						target='_blank'
						rel='noopener noreferrer'>
						{linkUrl}
					</a>
					<div
						className='link-edit'
						role='button'
						tabIndex={0}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => {
							setEditedLinkUrl(linkUrl);
							setEditMode(true);
						}}>
						<Edit size={18} strokeWidth={2} />
					</div>
					<div
						className='link-trash'
						role='button'
						tabIndex={0}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => {
							editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
						}}>
						<Trash size={18} strokeWidth={2} />
					</div>
				</div>
			)}
		</div>
	);
}

function useFloatingLinkEditorToolbar(
	editor: LexicalEditor,
	anchorElem: HTMLElement
): JSX.Element | null {
	const [activeEditor, setActiveEditor] = useState(editor);
	const [isLink, setIsLink] = useState(false);

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = getSelectedNode(selection);
			const linkParent = $findMatchingParent(node, $isLinkNode);
			const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

			// We don't want this menu to open for auto links.
			if (linkParent != null && autoLinkParent == null) {
				setIsLink(true);
			} else {
				setIsLink(false);
			}
		}
	}, []);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload, newEditor) => {
					updateToolbar();
					setActiveEditor(newEditor);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			)
		);
	}, [editor, updateToolbar]);

	return createPortal(
		<FloatingLinkEditor
			editor={activeEditor}
			isLink={isLink}
			anchorElem={anchorElem}
			setIsLink={setIsLink}
		/>,
		anchorElem
	);
}

export default function FloatingLinkEditorPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	return useFloatingLinkEditorToolbar(editor, anchorElem);
}
