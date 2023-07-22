/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Ref, RefObject } from "react";
import * as React from "react";
import { ChangeEvent, forwardRef } from "react";

type BaseEquationEditorProps = {
	equation: string;
	inline: boolean;
	setEquation: (equation: string) => void;
};

function EquationEditor(
	{ equation, setEquation, inline }: BaseEquationEditorProps,
	forwardedRef: Ref<HTMLInputElement | HTMLTextAreaElement>
): JSX.Element {
	const onChange = (event: ChangeEvent) => {
		setEquation((event.target as HTMLInputElement).value);
	};

	return inline && forwardedRef instanceof HTMLInputElement ? (
		<span className='bg-gray-200'>
			<span className='text-gray-500'>{"$"}</span>
			<input
				className='bg-transparent resize-none focus:outline-none EquationEditor_inlineEditor'
				value={equation}
				onChange={onChange}
				autoFocus={true}
				ref={forwardedRef as RefObject<HTMLInputElement>}
			/>
			<span className='text-gray-500'>{"$"}</span>
		</span>
	) : (
		<div className='bg-gray-200'>
			<span className='text-gray-500'>{"$$\n"}</span>
			<textarea
				className='bg-transparent resize-none focus:outline-none EquationEditor_blockEditor'
				value={equation}
				onChange={onChange}
				ref={forwardedRef as RefObject<HTMLTextAreaElement>}
			/>
			<span className='text-gray-500'>{"\n$$"}</span>
		</div>
	);
}

export default forwardRef(EquationEditor);
