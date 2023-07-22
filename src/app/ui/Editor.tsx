"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
	InitialEditorStateType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import ToolbarPlugin from "../plugins/ToolbarPlugin";
import TreeViewPlugin from "../plugins/TreeViewPlugin";

import AutoLinkPlugin from "../plugins/AutoLinkPlugin";
import CodeHighlightPlugin from "../plugins/CodeHighlightPlugin";
import ListMaxIndentLevelPlugin from "../plugins/ListMaxIndentLevelPlugin";

import { Provider } from "@lexical/yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import cx from "classnames";
import { EditorState } from "lexical";
import FloatingTextFormatToolbarPlugin from "../plugins/FloatingMenu";
import ComponentPickerPlugin from "../plugins/ComponentPickerPlugin";
import { loadContent } from "../defaultContent";
import ContentEditable from "./ContentEditable";
import { SharedHistoryContext } from "../context/SharedHistoryContext";
import { TableContext } from "../plugins/TablePlugin";
import { SharedAutocompleteContext } from "../context/SharedAutocompleteContext";
import { useSettings } from "../context/SettingsContext";
import EmojisPlugin from "../plugins/EmojisPlugin";
import EquationsPlugin from "../plugins/EquationsPlugin";
import { ParagraphPlaceholderPlugin } from "../plugins/ParagraphPlaceholderPlugin";
import { HeadingPlaceholderPlugin } from "../plugins/HeadingPlaceholderPlugin";
import { EmojiNode } from "../nodes/EmojiNode";
import { EquationNode } from "../nodes/EquationNode";
import { FigmaNode } from "../nodes/FigmaNode";
import { ImageNode } from "../nodes/ImageNode";
import { KeywordNode } from "../nodes/KeywordNode";
import { MentionNode } from "../nodes/MentionNode";
import { PollNode } from "../nodes/PollNode";
import { TweetNode } from "../nodes/TweetNode";
import { YouTubeNode } from "../nodes/YouTubeNode";
import { SectionHeadingNode } from "../nodes/SectionHeadingNode";
import DraggableBlockPlugin from "../plugins/DraggableBlockPlugin";
import { useState } from "react";
import FloatingLinkEditorPlugin from "../plugins/FloatingLinkEditorPlugin";

export default function Editor() {
	const {
		settings: { isCollab },
	} = useSettings();
	const [floatingAnchorElem, setFloatingAnchorElem] = useState<
		HTMLDivElement | undefined
	>(undefined);
	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== undefined) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	const editorConfig = {
		namespace: "rewrite",
		editorState: isCollab ? null : loadContent,
		theme: {
			text: {
				bold: "bold",
				italic: "italic",
				strikethrough: "line-through",
				subscript: "text-[0.8em] align-[sub]",
				superscript: "text-[0.8em] align-[super]",
				underline: "underline",
				underlineStrikethrough: "underline line-through",
			},
		},
		onError(error: any) {
			throw error;
		},
		nodes: [
			AutoLinkNode,
			CodeHighlightNode,
			CodeNode,
			EmojiNode,
			EquationNode,
			// FigmaNode,
			// ImageNode,
			KeywordNode,
			LinkNode,
			ListItemNode,
			ListNode,
			MentionNode,
			PollNode,
			QuoteNode,
			SectionHeadingNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			// TweetNode,
			// YouTubeNode,
			{
				replace: HeadingNode,
				with: (node: HeadingNode) => new SectionHeadingNode(node.getTag()),
			},
		],
	};

	return (
		<LexicalComposer initialConfig={editorConfig}>
			<SharedHistoryContext>
				<TableContext>
					<SharedAutocompleteContext>
						<div className='flex-1 flex flex-col lg:mt-8 relative w-full max-w-5xl overflow-x-hidden h-full mx-auto'>
							{/* <ToolbarPlugin /> */}
							<div className='flex-1 flex flex-col' ref={onRef}>
								<RichTextPlugin
									contentEditable={<ContentEditable />}
									ErrorBoundary={LexicalErrorBoundary}
									placeholder={null}
								/>
								<TreeViewPlugin />

								<AutoFocusPlugin />
								<AutoLinkPlugin />
								<CodeHighlightPlugin />
								<ComponentPickerPlugin />
								<DraggableBlockPlugin anchorElem={floatingAnchorElem} />
								<FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
								<FloatingTextFormatToolbarPlugin />
								<HeadingPlaceholderPlugin />
								<HistoryPlugin />
								<ListPlugin />
								<LinkPlugin />
								<ListMaxIndentLevelPlugin maxDepth={7} />
								<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
								<ParagraphPlaceholderPlugin
									placeholder={`Press "/" for commands`}
									hideOnEmptyEditor
								/>
							</div>
						</div>
					</SharedAutocompleteContext>
				</TableContext>
			</SharedHistoryContext>
		</LexicalComposer>
	);
}
