import {
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	COMMAND_PRIORITY_LOW,
	FORMAT_TEXT_COMMAND,
	GridSelection,
	LexicalEditor,
	NodeSelection,
	RangeSelection,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { getDOMRangeRect } from "./getDOMRangeRect";
import { setFloatingElemPosition } from "./setFloatingElemPosition";
import cx from "classnames";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
	$isParentElementRTL,
	$wrapNodes,
	$isAtNodeEnd,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
	$isListNode,
	ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
} from "@lexical/rich-text";
import {
	$createCodeNode,
	$isCodeNode,
	getDefaultCodeLanguage,
	getCodeLanguages,
} from "@lexical/code";
import {
	Bold,
	ChevronDown,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link,
	List,
	ListOrdered,
	Strikethrough,
	Subscript,
	Superscript,
	Text,
	TextQuote,
	Underline,
} from "lucide-react";

const LowPriority = 1;

export const supportedBlockTypes = new Set([
	"paragraph",
	"quote",
	"code",
	"h2",
	"h3",
	"ul",
	"ol",
]);

export const blockTypeToBlockName = {
	code: "Code Block",
	h1: "Title",
	h2: "Large Heading",
	h3: "Small Heading",
	h4: "Heading",
	h5: "Heading",
	ol: "Numbered List",
	paragraph: "Text",
	quote: "Quote",
	ul: "Bulleted List",
};

function Divider() {
	return <div className='divider' />;
}

function getSelectedNode(selection: any) {
	const anchor = selection.anchor;
	const focus = selection.focus;
	const anchorNode = selection.anchor.getNode();
	const focusNode = selection.focus.getNode();
	if (anchorNode === focusNode) {
		return anchorNode;
	}
	const isBackward = selection.isBackward();
	if (isBackward) {
		return $isAtNodeEnd(focus) ? anchorNode : focusNode;
	} else {
		return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
	}
}

type Selection = RangeSelection | NodeSelection | GridSelection | null;

function positionEditorElement(editor: any, rect: any) {
	if (rect === null) {
		editor.style.opacity = "0";
		editor.style.top = "-1000px";
		editor.style.left = "-1000px";
	} else {
		editor.style.opacity = "1";
		editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
		editor.style.left = `${
			rect.left + window.scrollX - editor.offsetWidth / 2 + rect.width / 2
		}px`;
	}
}

function BlockOptionsDropdownList({
	editor,
	blockType,
	toolbarRef,
	setShowBlockOptionsDropDown,
}: any) {
	const dropDownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const toolbar = toolbarRef.current;
		const dropDown = dropDownRef.current;

		if (toolbar !== null && dropDown !== null) {
			const { top, left } = toolbar.getBoundingClientRect();
			dropDown.style.top = `${top + 40}px`;
			dropDown.style.left = `${left}px`;
		}
	}, [dropDownRef, toolbarRef]);

	useEffect(() => {
		const dropDown = dropDownRef.current;
		const toolbar = toolbarRef.current;

		if (dropDown !== null && toolbar !== null) {
			const handle = (event: any) => {
				const target = event.target;

				if (!dropDown.contains(target) && !toolbar.contains(target)) {
					setShowBlockOptionsDropDown(false);
				}
			};
			document.addEventListener("click", handle);

			return () => {
				document.removeEventListener("click", handle);
			};
		}
	}, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

	const formatParagraph = () => {
		if (blockType !== "paragraph") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createParagraphNode());
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatLargeHeading = () => {
		if (blockType !== "h2") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createHeadingNode("h2"));
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatMediumHeading = () => {
		if (blockType !== "h3") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createHeadingNode("h3"));
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatSmallHeading = () => {
		if (blockType !== "h4") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createHeadingNode("h4"));
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatBulletList = () => {
		if (blockType !== "ul") {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND);
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatNumberedList = () => {
		if (blockType !== "ol") {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND);
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatQuote = () => {
		if (blockType !== "quote") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createQuoteNode());
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	const formatCode = () => {
		if (blockType !== "code") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createCodeNode());
				}
			});
		}
		setShowBlockOptionsDropDown(false);
	};

	return (
		<div className='dropdown pt-2' ref={dropDownRef}>
			<div className='px-3 py-1 text-xs text-neutral-600'>Turn Into</div>
			<button className='item flex gap-2' onClick={formatParagraph}>
				<Text size={18} />
				<span className='text'>Text</span>
				{blockType === "paragraph" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatLargeHeading}>
				<Heading1 size={18} />
				<span className='text'>Big Heading</span>
				{blockType === "h2" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatMediumHeading}>
				<Heading2 size={18} />
				<span className='text'>Medium Heading</span>
				{blockType === "h3" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatSmallHeading}>
				<Heading3 size={18} />
				<span className='text'>Small Heading</span>
				{blockType === "h4" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatBulletList}>
				<List size={18} />
				<span className='text'>Bullet List</span>
				{blockType === "ul" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatNumberedList}>
				<ListOrdered size={18} />
				<span className='text'>Numbered List</span>
				{blockType === "ol" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatQuote}>
				<TextQuote size={18} />
				<span className='text'>Quote</span>
				{blockType === "quote" && <span className='active' />}
			</button>
			<button className='item flex gap-2' onClick={formatCode}>
				<Code size={18} />
				<span className='text'>Code Block</span>
				{blockType === "code" && <span className='active' />}
			</button>
		</div>
	);
}

export function TextFormatFloatingToolbar({
	editor,
	anchorElem,
	isLink,
	isBold,
	isItalic,
	isUnderline,
	isCode,
	isStrikethrough,
	isSubscript,
	isSuperscript,
}: {
	editor: LexicalEditor;
	anchorElem: HTMLElement;
	isBold: boolean;
	isCode: boolean;
	isItalic: boolean;
	isLink: boolean;
	isStrikethrough: boolean;
	isSubscript: boolean;
	isSuperscript: boolean;
	isUnderline: boolean;
}): JSX.Element {
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
	const [blockType, setBlockType] = useState("paragraph");
	const [selectedElementKey, setSelectedElementKey] = useState("");
	const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] =
		useState(false);
	const [codeLanguage, setCodeLanguage] = useState("");

	const insertLink = useCallback(() => {
		if (!isLink) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://google.com");
		} else {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		}
	}, [editor, isLink]);

	const insertComment = () => {
		// TODO: add comments
		// editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
	};

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			const element =
				anchorNode.getKey() === "root"
					? anchorNode
					: anchorNode.getTopLevelElementOrThrow();
			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);
			if (elementDOM !== null) {
				setSelectedElementKey(elementKey);
				if ($isListNode(element)) {
					const parentList = $getNearestNodeOfType(anchorNode, ListNode);
					const type = parentList ? parentList.getTag() : element.getTag();
					setBlockType(type);
				} else {
					const type = $isHeadingNode(element)
						? element.getTag()
						: element.getType();
					setBlockType(type);
					if ($isCodeNode(element)) {
						setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
					}
				}
			}
		}
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateToolbar();
					console.log("toolbar updated");
					return true;
				},
				LowPriority
			),
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					setCanUndo(payload);
					return false;
				},
				LowPriority
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					setCanRedo(payload);
					return false;
				},
				LowPriority
			)
		);
	}, [editor, updateToolbar]);

	function mouseMoveListener(e: MouseEvent) {
		if (
			popupCharStylesEditorRef?.current &&
			(e.buttons === 1 || e.buttons === 3)
		) {
			if (popupCharStylesEditorRef.current.style.pointerEvents !== "none") {
				const x = e.clientX;
				const y = e.clientY;
				const elementUnderMouse = document.elementFromPoint(x, y);

				if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
					// Mouse is not over the target element => not a normal click, but probably a drag
					popupCharStylesEditorRef.current.style.pointerEvents = "none";
				}
			}
		}
	}

	function mouseUpListener(e: MouseEvent) {
		if (popupCharStylesEditorRef?.current) {
			if (popupCharStylesEditorRef.current.style.pointerEvents !== "auto") {
				popupCharStylesEditorRef.current.style.pointerEvents = "auto";
			}
		}
	}

	useEffect(() => {
		if (popupCharStylesEditorRef?.current) {
			document.addEventListener("mousemove", mouseMoveListener);
			document.addEventListener("mouseup", mouseUpListener);

			return () => {
				document.removeEventListener("mousemove", mouseMoveListener);
				document.removeEventListener("mouseup", mouseUpListener);
			};
		}
	}, [popupCharStylesEditorRef]);

	const updateTextFormatFloatingToolbar = useCallback(() => {
		const selection = $getSelection();

		const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
		const nativeSelection = window.getSelection();

		if (popupCharStylesEditorElem === null) {
			return;
		}

		const rootElement = editor.getRootElement();
		if (
			selection !== null &&
			nativeSelection !== null &&
			!nativeSelection.isCollapsed &&
			rootElement !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

			setFloatingElemPosition(
				rangeRect,
				popupCharStylesEditorElem,
				anchorElem
			);
		}
	}, [editor, anchorElem]);

	useEffect(() => {
		const scrollerElem = anchorElem.parentElement;

		const update = () => {
			editor.getEditorState().read(() => {
				updateTextFormatFloatingToolbar();
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
	}, [editor, updateTextFormatFloatingToolbar, anchorElem]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			updateTextFormatFloatingToolbar();
		});
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateTextFormatFloatingToolbar();
				});
			}),

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateTextFormatFloatingToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, updateTextFormatFloatingToolbar]);

	return (
		<div
			ref={popupCharStylesEditorRef}
			className={cx(
				"flex align-middle h-10 lg:h-8",
				"absolute top-0 left-0 z-50 opacity-0",
				"bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-none shadow-lg",
				"subpixel-antialiased transition-opacity will-change-transform",
				"divide-x divide-neutral-200 dark:divide-neutral-700"
			)}>
			{editor.isEditable() && (
				<>
					{supportedBlockTypes.has(blockType) && (
						<div className='flex flex-row'>
							<button
								className={cx(
									"flex flex-row px-3 lg:px-2 cursor-pointer items-center subpixel-antialiased",
									"text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-900"
								)}
								onClick={() =>
									setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
								}
								aria-label='Formatting Options'>
								<span className={"icon block-type " + blockType} />
								<span className='text'>
									{
										blockTypeToBlockName[
											blockType as keyof typeof blockTypeToBlockName
										]
									}
								</span>
								<ChevronDown className='pt-0.5 ml-1 opacity-50' size={18} />
							</button>
							{showBlockOptionsDropDown &&
								createPortal(
									<BlockOptionsDropdownList
										editor={editor}
										blockType={blockType}
										toolbarRef={popupCharStylesEditorRef}
										setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
									/>,
									document.body
								)}
						</div>
					)}
					<div className='flex flex-row'>
						<button
							type='button'
							onClick={insertLink}
							className={cx(
								"flex flex-row gap-1 px-4 lg:px-2 cursor-pointer items-center subpixel-antialiased",
								"text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-900"
							)}
							aria-label={"Add a hyperlink"}>
							<Link size={16} strokeWidth={2} />
							<span>Link</span>
						</button>
					</div>
					<div className='flex flex-row divide-x divide-neutral-200 dark:divide-neutral-700 lg:divide-none'>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
							}
							className={cx("bold", isBold && "bg-neutral-200")}
							label='Format text as bold'
							icon={Bold}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
							}
							className={cx("italic", isItalic && "bg-neutral-200")}
							label='Format text as italics'
							icon={Italic}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
							}
							className={cx(isUnderline && "bg-neutral-200")}
							label='Format text to underlined'
							icon={Underline}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
							}
							className={cx(
								"hidden sm:flex",
								isStrikethrough && "bg-neutral-200"
							)}
							label='Format text with a strikethrough'
							icon={Strikethrough}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
							}
							className={cx(
								"hidden sm:flex",
								"w-6 pt-1 px-0.5",
								isSubscript && "bg-neutral-200"
							)}
							label='Insert Subscript'
							icon={Subscript}
							size={20}
							strokeWidth={2}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
							}
							className={cx(
								"hidden sm:flex",
								"w-6 pb-1 px-0.5",
								isSuperscript && "bg-neutral-200"
							)}
							label='Insert Superscript'
							icon={Superscript}
							size={20}
							strokeWidth={2}
						/>
						<ActionButton
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
							}
							className={cx("hidden sm:flex", isCode && "bg-neutral-200")}
							label='Insert code block'
							icon={Code}
						/>
					</div>
				</>
			)}
		</div>
	);
}

function ActionButton(props: {
	onClick: () => void;
	className: string;
	label: string;
	icon: any;
	size?: number;
	strokeWidth?: number;
}) {
	return (
		<button
			type='button'
			onClick={props.onClick}
			className={cx(
				"flex px-3 lg:px-2 w-10 lg:w-8 cursor-pointer items-center subpixel-antialiased",
				"text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-900",
				props.className
			)}
			aria-label={props.label}>
			<props.icon
				size={props.size || 16}
				strokeWidth={props.strokeWidth || 2.5}
			/>
		</button>
	);
}
