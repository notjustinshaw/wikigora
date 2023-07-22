/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Option, Options, PollNode } from "./PollNode";

import { useCollaborationContext } from "@lexical/react/LexicalCollaborationContext";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	GridSelection,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	NodeKey,
	NodeSelection,
	RangeSelection,
} from "lexical";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "../ui/Button";
import cx from "classnames";
import { $isPollNode, createPollOption } from "./PollNode";

function getTotalVotes(options: Options): number {
	return options.reduce((totalVotes, next) => {
		return totalVotes + next.votes.length;
	}, 0);
}

function PollOptionComponent({
	option,
	index,
	options,
	totalVotes,
	withPollNode,
}: {
	index: number;
	option: Option;
	options: Options;
	totalVotes: number;
	withPollNode: (
		cb: (pollNode: PollNode) => void,
		onSelect?: () => void
	) => void;
}): JSX.Element {
	const { clientID } = useCollaborationContext();
	const checkboxRef = useRef(null);
	const votesArray = option.votes;
	const checkedIndex = votesArray.indexOf(clientID);
	const checked = checkedIndex !== -1;
	const votes = votesArray.length;
	const text = option.text;

	return (
		<div className='flex flex-row items-center mb-4'>
			<div
				className={cx(
					"w-5 h-5 border border-gray-400 rounded-md mr-2",
					checked && "bg-blue-500 border-blue-500"
				)}>
				<input
					ref={checkboxRef}
					className='w-full h-full opacity-0 absolute cursor-pointer'
					type='checkbox'
					onChange={(e) => {
						withPollNode((node) => {
							node.toggleVote(option, clientID);
						});
					}}
					checked={checked}
				/>
			</div>
			<div className='relative flex-1'>
				<div
					className='bg-blue-200 h-1 absolute top-0 left-0'
					style={{ width: `${votes === 0 ? 0 : (votes / totalVotes) * 100}%` }}
				/>
				<span className='text-blue-500 text-xs absolute top-0 right-2'>
					{votes > 0 && (votes === 1 ? "1 vote" : `${votes} votes`)}
				</span>
				<input
					className='w-full py-1.5 px-2 border border-blue-500 rounded-md text-sm focus:outline-none'
					type='text'
					value={text}
					onChange={(e) => {
						const target = e.target;
						const value = target.value;
						const selectionStart = target.selectionStart;
						const selectionEnd = target.selectionEnd;
						withPollNode(
							(node) => {
								node.setOptionText(option, value);
							},
							() => {
								target.selectionStart = selectionStart;
								target.selectionEnd = selectionEnd;
							}
						);
					}}
					placeholder={`Option ${index + 1}`}
				/>
				<button
					disabled={options.length < 3}
					className={cx(
						"w-7 h-7 ml-2 rounded-md border-0 bg-transparent bg-center bg-no-repeat bg-cover opacity-30",
						options.length < 3 && "cursor-not-allowed"
					)}
					aria-label='Remove'
					onClick={() => {
						withPollNode((node) => {
							node.deleteOption(option);
						});
					}}
				/>
			</div>
		</div>
	);
}

export default function PollComponent({
	question,
	options,
	nodeKey,
}: {
	nodeKey: NodeKey;
	options: Options;
	question: string;
}): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const totalVotes = useMemo(() => getTotalVotes(options), [options]);
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);
	const [selection, setSelection] = useState<
		RangeSelection | NodeSelection | GridSelection | null
	>(null);
	const ref = useRef(null);

	const onDelete = useCallback(
		(payload: KeyboardEvent) => {
			if (isSelected && $isNodeSelection($getSelection())) {
				const event: KeyboardEvent = payload;
				event.preventDefault();
				const node = $getNodeByKey(nodeKey);
				if ($isPollNode(node)) {
					node.remove();
				}
				setSelected(false);
			}
			return false;
		},
		[isSelected, nodeKey, setSelected]
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				setSelection(editorState.read(() => $getSelection()));
			}),
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				(payload) => {
					const event = payload;

					if (event.target === ref.current) {
						if (!event.shiftKey) {
							clearSelection();
						}
						setSelected(!isSelected);
						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_DELETE_COMMAND,
				onDelete,
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				onDelete,
				COMMAND_PRIORITY_LOW
			)
		);
	}, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

	const withPollNode = (
		cb: (node: PollNode) => void,
		onUpdate?: () => void
	): void => {
		editor.update(
			() => {
				const node = $getNodeByKey(nodeKey);
				if ($isPollNode(node)) {
					cb(node);
				}
			},
			{ onUpdate }
		);
	};

	const addOption = () => {
		withPollNode((node) => {
			node.addOption(createPollOption());
		});
	};

	const isFocused = $isNodeSelection(selection) && isSelected;

	return (
		<div
			className={`border border-gray-300 bg-gray-50 rounded-lg max-w-96 min-w-64 cursor-pointer select-none ${
				isFocused ? "outline-2 outline-blue-500" : ""
			}`}
			ref={ref}>
			<div className='m-4'>
				<h2 className='text-lg font-bold text-gray-700 text-center'>
					{question}
				</h2>
				{options.map((option, index) => {
					const key = option.uid;
					return (
						<PollOptionComponent
							key={key}
							withPollNode={withPollNode}
							option={option}
							index={index}
							options={options}
							totalVotes={totalVotes}
						/>
					);
				})}
				<div className='flex justify-center'>
					<Button onClick={addOption} small>
						Add Option
					</Button>
				</div>
			</div>
		</div>
	);
}
