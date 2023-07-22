/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react";
import { HTMLInputTypeAttribute } from "react";

type Props = Readonly<{
	"data-test-id"?: string;
	label: string;
	onChange: (val: string) => void;
	placeholder?: string;
	value: string;
	type?: HTMLInputTypeAttribute;
}>;

export default function TextInput({
	label,
	value,
	onChange,
	placeholder = "",
	"data-test-id": dataTestId,
	type = "text",
}: Props): JSX.Element {
	return (
		<div className='flex flex-row items-center mb-10'>
			<label className='flex-1 text-gray-600'>{label}</label>
			<input
				type={type}
				className='flex-2 border border-gray-300 py-2 px-4 text-base rounded-md min-w-0'
				placeholder={placeholder}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
				}}
				data-test-id={dataTestId}
			/>
		</div>
	);
}
