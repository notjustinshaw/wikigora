/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createCodeNode } from "@lexical/code";
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_EMBED_COMMAND } from "@lexical/react/LexicalAutoEmbedPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
	TextNode,
} from "lexical";
import { useCallback, useMemo, useState } from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import useModal from "../../hooks/useModal";
import catTypingGif from "../../images/cat-typing.gif";
import { EmbedConfigs } from "../AutoEmbedPlugin";
import { INSERT_COLLAPSIBLE_COMMAND } from "../CollapsiblePlugin";
import { InsertEquationDialog } from "../EquationsPlugin";
import { INSERT_EXCALIDRAW_COMMAND } from "../ExcalidrawPlugin";
import { INSERT_IMAGE_COMMAND, InsertImageDialog } from "../ImagesPlugin";
import { InsertPollDialog } from "../PollPlugin";
import { InsertNewTableDialog, InsertTableDialog } from "../TablePlugin";

import cx from "classnames";
import {
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	ListTodo,
	ListTree,
	MessageSquarePlus,
	Table,
	Text,
	TextQuote,
	Image as ImageIcon,
	Code,
	Table2,
	SplitSquareVertical,
	Pencil,
	ListChecks,
	Clapperboard,
	Sigma,
} from "lucide-react";

class ComponentPickerOption extends MenuOption {
	// What shows up in the editor
	title: string;
	// A longer description of this option
	description: string;
	// Icon for display
	icon?: JSX.Element;
	// For extra searching.
	keywords: Array<string>;
	// TBD
	keyboardShortcut?: string;
	// What happens when you select this option?
	onSelect: (queryString: string) => void;

	constructor(
		title: string,
		description: string,
		options: {
			icon?: JSX.Element;
			keywords?: Array<string>;
			keyboardShortcut?: string;
			onSelect: (queryString: string) => void;
		}
	) {
		super(title);
		this.title = title;
		this.description = description;
		this.keywords = options.keywords || [];
		this.icon = options.icon;
		this.keyboardShortcut = options.keyboardShortcut;
		this.onSelect = options.onSelect.bind(this);
	}
}

function ComponentPickerMenuItem({
	index,
	isSelected,
	onClick,
	onMouseEnter,
	option,
}: {
	index: number;
	isSelected: boolean;
	onClick: () => void;
	onMouseEnter: () => void;
	option: ComponentPickerOption;
}) {
	let className = "item";
	if (isSelected) {
		className += " selected";
	}
	return (
		<li
			key={option.key}
			tabIndex={-1}
			className={cx(
				"flex w-full items-center space-x-2 rounded-md p-1 text-left text-sm text-stone-900 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-900",
				isSelected &&
					"bg-stone-100 text-stone-900 dark:bg-stone-900 dark:text-stone-100"
			)}
			ref={option.setRefElement}
			role='option'
			aria-selected={isSelected}
			id={"typeahead-item-" + index}
			onMouseEnter={onMouseEnter}
			onClick={onClick}>
			<div className='flex shrink-0 h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 antialiased'>
				{option.icon}
			</div>
			<div>
				<p className='font-medium'>{option.title}</p>
				<p className='text-xs text-stone-500 dark:text-stone-300'>
					{option.description}
				</p>
			</div>
		</li>
	);
}

export default function ComponentPickerPlugin(): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const [modal, showModal] = useModal();
	const [queryString, setQueryString] = useState<string | null>(null);

	const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
		minLength: 0,
	});

	const getDynamicOptions = useCallback(() => {
		const options: Array<ComponentPickerOption> = [];

		if (queryString == null) {
			return options;
		}

		const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/);
		const partialTableRegex = new RegExp(/^([1-9]|10)x?$/);

		const fullTableMatch = fullTableRegex.exec(queryString);
		const partialTableMatch = partialTableRegex.exec(queryString);

		if (fullTableMatch) {
			const [rows, columns] = fullTableMatch[0]
				.split("x")
				.map((n: string) => parseInt(n, 10));

			options.push(
				new ComponentPickerOption(
					`${rows}x${columns} Table`,
					"Add simple tabular content to your page",
					{
						icon: <i className='icon table' />,
						keywords: ["table"],
						onSelect: () =>
							// @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
							editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
					}
				)
			);
		} else if (partialTableMatch) {
			const rows = parseInt(partialTableMatch[0], 10);

			options.push(
				...Array.from({ length: 5 }, (_, i) => i + 1).map(
					(columns) =>
						new ComponentPickerOption(
							`${rows}x${columns} Table`,
							"Add simple tabular content to your page",
							{
								icon: <i className='icon table' />,
								keywords: ["table"],
								onSelect: () =>
									// @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
									editor.dispatchCommand(INSERT_TABLE_COMMAND, {
										// @ts-ignore
										columns,
										// @ts-ignore
										rows,
									}),
							}
						)
				)
			);
		}

		return options;
	}, [editor, queryString]);

	const options = useMemo(() => {
		const HEADINGS = ["Big", "Medium", "Small"];
		const HEADING_ICONS = [
			<Heading1 key='icon_heading_1' size={18} />,
			<Heading2 key='icon_heading_2' size={18} />,
			<Heading3 key='icon_heading_3' size={18} />,
		];
		const baseOptions = [
			new ComponentPickerOption("Text", "Just start typing with plain text.", {
				icon: <Text size={18} />,
				keywords: ["normal", "paragraph", "p", "text"],
				onSelect: () =>
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							$setBlocksType(selection, () => $createParagraphNode());
						}
					}),
			}),
			...Array.from({ length: 3 }, (_, i) => i + 1).map(
				(n) =>
					new ComponentPickerOption(
						`Heading ${n}`,
						`${HEADINGS[n-1]} section heading.`,
						{
							icon: HEADING_ICONS[n-1],
							keywords: ["heading", "header", `h${n}`],
							onSelect: () =>
								editor.update(() => {
									const selection = $getSelection();
									if ($isRangeSelection(selection)) {
										$setBlocksType(selection, () =>
											// @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
											$createHeadingNode(`h${n}`)
										);
									}
								}),
						}
					)
			),
			// new ComponentPickerOption(
			// 	"Table",
			// 	"Add simple tabular content to your page.",
			// 	{
			// 		icon: <Table size={18} />,
			// 		keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
			// 		onSelect: () =>
			// 			showModal("Insert Table", (onClose: any) => (
			// 				<InsertTableDialog activeEditor={editor} onClose={onClose} />
			// 			)),
			// 	}
			// ),
			// new ComponentPickerOption(
			// 	"Table (Experimental)",
			// 	"Add advanced tabular content to your page.",
			// 	{
			// 		icon: <Table2 size={18} />,
			// 		keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
			// 		onSelect: () =>
			// 			showModal("Insert Table", (onClose: any) => (
			// 				<InsertNewTableDialog activeEditor={editor} onClose={onClose} />
			// 			)),
			// 	}
			// ),
			new ComponentPickerOption(
				"Numbered List",
				"Create a list with numbering.",
				{
					icon: <ListOrdered size={18} />,
					keywords: ["numbered list", "ordered list", "ol"],
					onSelect: () =>
						editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
				}
			),
			new ComponentPickerOption(
				"Bulleted List",
				"Create a simple bullet list.",
				{
					icon: <List size={18} />,
					keywords: ["bulleted list", "unordered list", "ul"],
					onSelect: () =>
						editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
				}
			),
			// new ComponentPickerOption(
			// 	"To-do List",
			// 	"Track tasks with a to-do list.",
			// 	{
			// 		icon: <ListTodo size={18} />,
			// 		keywords: ["check list", "todo list"],
			// 		onSelect: () =>
			// 			editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
			// 	}
			// ),
			new ComponentPickerOption("Quote", "Capture a quote.", {
				icon: <TextQuote size={18} />,
				keywords: ["block quote"],
				onSelect: () =>
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							$setBlocksType(selection, () => $createQuoteNode());
						}
					}),
			}),
			new ComponentPickerOption("Code", "Capture a code snippet.", {
				icon: <Code size={18} />,
				keywords: ["javascript", "python", "js", "codeblock"],
				onSelect: () =>
					editor.update(() => {
						const selection = $getSelection();

						if ($isRangeSelection(selection)) {
							if (selection.isCollapsed()) {
								$setBlocksType(selection, () => $createCodeNode());
							} else {
								// Will this ever happen?
								const textContent = selection.getTextContent();
								const codeNode = $createCodeNode();
								selection.insertNodes([codeNode]);
								selection.insertRawText(textContent);
							}
						}
					}),
			}),
			// new ComponentPickerOption("Divider", "Visually divide blocks", {
			// 	icon: <SplitSquareVertical size={18} />,
			// 	keywords: ["horizontal rule", "divider", "hr"],
			// 	onSelect: () =>
			// 		editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
			// }),
			// new ComponentPickerOption(
			// 	"Excalidraw",
			// 	"Embed an excalidraw whiteboard.",
			// 	{
			// 		icon: <Pencil size={18} />,
			// 		keywords: ["excalidraw", "diagram", "drawing"],
			// 		onSelect: () =>
			// 			editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined),
			// 	}
			// ),
			// new ComponentPickerOption("Poll", "Embed a simple poll.", {
			// 	icon: <ListChecks size={18} />,
			// 	keywords: ["poll", "vote"],
			// 	onSelect: () =>
			// 		showModal("Insert Poll", (onClose: any) => (
			// 			<InsertPollDialog activeEditor={editor} onClose={onClose} />
			// 		)),
			// }),
			// ...EmbedConfigs.map(
			// 	(embedConfig: {
			// 		contentName: any;
			// 		keywords: any;
			// 		type: string;
			// 		icon?: any;
			// 	}) =>
			// 		new ComponentPickerOption(
			// 			`Embed ${embedConfig.contentName}`,
			// 			`Embed a ${embedConfig.contentName}`,
			// 			{
			// 				icon: embedConfig.icon,
			// 				keywords: [...embedConfig.keywords, "embed"],
			// 				onSelect: () =>
			// 					editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
			// 			}
			// 		)
			// ),
			// new ComponentPickerOption("Equation", "Embed a typeset math equation.", {
			// 	icon: <Sigma size={18} />,
			// 	keywords: ["equation", "latex", "math"],
			// 	onSelect: () =>
			// 		showModal("Insert Equation", (onClose: any) => (
			// 			<InsertEquationDialog activeEditor={editor} onClose={onClose} />
			// 		)),
			// }),
			// new ComponentPickerOption(
			// 	"GIF",
			// 	"Embed an animated image from the internet.",
			// 	{
			// 		icon: <Clapperboard size={18} />,
			// 		keywords: ["gif", "animate", "image", "file"],
			// 		onSelect: () =>
			// 			editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
			// 				altText: "Cat typing on a laptop",
			// 				src: catTypingGif as any,
			// 			}),
			// 	}
			// ),
			// new ComponentPickerOption(
			// 	"Image",
			// 	"Upload or embed an image with a link",
			// 	{
			// 		icon: <ImageIcon size={18} />,
			// 		keywords: ["image", "photo", "picture", "file"],
			// 		onSelect: () =>
			// 			showModal("Insert Image", (onClose: any) => (
			// 				<InsertImageDialog activeEditor={editor} onClose={onClose} />
			// 			)),
			// 	}
			// ),
			// new ComponentPickerOption(
			// 	"Toggle",
			// 	"Toggles can hide and show content.",
			// 	{
			// 		icon: <ListTree size={18} />,
			// 		keywords: ["collapse", "collapsible", "toggle"],
			// 		onSelect: () =>
			// 			editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
			// 	}
			// ),
		];

		const dynamicOptions = getDynamicOptions();

		return queryString
			? [
					...dynamicOptions,
					...baseOptions.filter((option) => {
						return new RegExp(queryString, "gi").exec(option.title) ||
							option.keywords != null
							? option.keywords.some((keyword: string) =>
									new RegExp(queryString, "gi").exec(keyword)
							  )
							: false;
					}),
			  ]
			: baseOptions;
	}, [editor, getDynamicOptions, queryString, showModal]);

	const onSelectOption = useCallback(
		(
			selectedOption: ComponentPickerOption,
			nodeToRemove: TextNode | null,
			closeMenu: () => void,
			matchingString: string
		) => {
			editor.update(() => {
				if (nodeToRemove) {
					nodeToRemove.remove();
				}
				selectedOption.onSelect(matchingString);
				closeMenu();
			});
		},
		[editor]
	);

	return (
		<>
			{modal}
			<LexicalTypeaheadMenuPlugin<ComponentPickerOption>
				onQueryChange={setQueryString}
				onSelectOption={onSelectOption}
				triggerFn={checkForTriggerMatch}
				options={options}
				menuRenderFn={(
					anchorElementRef,
					{ selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
				) =>
					anchorElementRef.current && options.length
						? ReactDOM.createPortal(
								<div
									className={cx(
										"z-50 h-auto max-h-[330px] w-72 overflow-y-auto scroll-smooth rounded-md border border-neutral-200 bg-white p-1 shadow-md transition-all mt-8",
										"scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-thumb-rounded-md scrollbar-track-rounded-md dark:border-neutral-700 dark:bg-neutral-950 dark:scrollbar-thumb-neutral-800"
									)}>
									<ul className='flex flex-col gap-2'>
										{options.map((option, i: number) => (
											<ComponentPickerMenuItem
												index={i}
												isSelected={selectedIndex === i}
												onClick={() => {
													setHighlightedIndex(i);
													selectOptionAndCleanUp(option);
												}}
												onMouseEnter={() => {
													setHighlightedIndex(i);
												}}
												key={option.key}
												option={option}
											/>
										))}
									</ul>
								</div>,
								anchorElementRef.current
						  )
						: null
				}
			/>
		</>
	);
}
