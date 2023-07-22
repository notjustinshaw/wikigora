/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Excalidraw } from "@excalidraw/excalidraw";
import {
	AppState,
	BinaryFiles,
	ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import * as React from "react";
import {
	ReactPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

export type ExcalidrawElementFragment = {
	isDeleted?: boolean;
};

type Props = {
	closeOnClickOutside?: boolean;
	/**
	 * The initial set of elements to draw into the scene
	 */
	initialElements: ReadonlyArray<ExcalidrawElementFragment>;
	/**
	 * The initial set of elements to draw into the scene
	 */
	initialAppState: AppState;
	/**
	 * The initial set of elements to draw into the scene
	 */
	initialFiles: BinaryFiles;
	/**
	 * Controls the visibility of the modal
	 */
	isShown?: boolean;
	/**
	 * Callback when closing and discarding the new changes
	 */
	onClose: () => void;
	/**
	 * Completely remove Excalidraw component
	 */
	onDelete: () => void;
	/**
	 * Callback when the save button is clicked
	 */
	onSave: (
		elements: ReadonlyArray<ExcalidrawElementFragment>,
		appState: Partial<AppState>,
		files: BinaryFiles
	) => void;
};

/**
 * @explorer-desc
 * A component which renders a modal with Excalidraw (a painting app)
 * which can be used to export an editable image
 */
export default function ExcalidrawModal({
	closeOnClickOutside = false,
	onSave,
	initialElements,
	initialAppState,
	initialFiles,
	isShown = false,
	onDelete,
	onClose,
}: Props): ReactPortal | null {
	const excaliDrawModelRef = useRef<HTMLDivElement | null>(null);
	const excaliDrawSceneRef = useRef<ExcalidrawImperativeAPI>(null);
	const [discardModalOpen, setDiscardModalOpen] = useState(false);
	const [elements, setElements] =
		useState<ReadonlyArray<ExcalidrawElementFragment>>(initialElements);
	const [files, setFiles] = useState<BinaryFiles>(initialFiles);

	useEffect(() => {
		if (excaliDrawModelRef.current !== null) {
			excaliDrawModelRef.current.focus();
		}
	}, []);

	useEffect(() => {
		let modalOverlayElement: HTMLElement | null = null;

		const clickOutsideHandler = (event: MouseEvent) => {
			const target = event.target;
			if (
				excaliDrawModelRef.current !== null &&
				!excaliDrawModelRef.current.contains(target as Node) &&
				closeOnClickOutside
			) {
				onDelete();
			}
		};

		if (excaliDrawModelRef.current !== null) {
			modalOverlayElement = excaliDrawModelRef.current?.parentElement;
			if (modalOverlayElement !== null) {
				modalOverlayElement?.addEventListener("click", clickOutsideHandler);
			}
		}

		return () => {
			if (modalOverlayElement !== null) {
				modalOverlayElement?.removeEventListener("click", clickOutsideHandler);
			}
		};
	}, [closeOnClickOutside, onDelete]);

	useLayoutEffect(() => {
		const currentModalRef = excaliDrawModelRef.current;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onDelete();
			}
		};

		if (currentModalRef !== null) {
			currentModalRef.addEventListener("keydown", onKeyDown);
		}

		return () => {
			if (currentModalRef !== null) {
				currentModalRef.removeEventListener("keydown", onKeyDown);
			}
		};
	}, [elements, files, onDelete]);

	const save = () => {
		if (elements.filter((el) => !el.isDeleted).length > 0) {
			const appState = excaliDrawSceneRef?.current?.getAppState();
			// We only need a subset of the state
			const partialState: Partial<AppState> = {
				exportBackground: appState?.exportBackground,
				exportScale: appState?.exportScale,
				exportWithDarkMode: appState?.theme === "dark",
				isBindingEnabled: appState?.isBindingEnabled,
				isLoading: appState?.isLoading,
				name: appState?.name,
				theme: appState?.theme,
				viewBackgroundColor: appState?.viewBackgroundColor,
				viewModeEnabled: appState?.viewModeEnabled,
				zenModeEnabled: appState?.zenModeEnabled,
				zoom: appState?.zoom,
			};
			onSave(elements, partialState, files);
		} else {
			// delete node if the scene is clear
			onDelete();
		}
	};

	const discard = () => {
		if (elements.filter((el) => !el.isDeleted).length === 0) {
			// delete node if the scene is clear
			onDelete();
		} else {
			//Otherwise, show confirmation dialog before closing
			setDiscardModalOpen(true);
		}
	};

	function ShowDiscardDialog(): JSX.Element {
		return (
			<Modal
				title='Discard'
				onClose={() => {
					setDiscardModalOpen(false);
				}}
				closeOnClickOutside={false}>
				Are you sure you want to discard the changes?
				<div className='ExcalidrawModal__discardModal'>
					<Button
						onClick={() => {
							setDiscardModalOpen(false);
							onClose();
						}}>
						Discard
					</Button>{" "}
					<Button
						onClick={() => {
							setDiscardModalOpen(false);
						}}>
						Cancel
					</Button>
				</div>
			</Modal>
		);
	}

	if (isShown === false) {
		return null;
	}

	const onChange = (
		els: ReadonlyArray<ExcalidrawElementFragment>,
		_: AppState,
		fls: BinaryFiles
	) => {
		setElements(els);
		setFiles(fls);
	};

	// This is a hacky work-around for Excalidraw + Vite.
	// In DEV, Vite pulls this in fine, in prod it doesn't. It seems
	// like a module resolution issue with ESM vs CJS?
	const _Excalidraw =
		Excalidraw.$$typeof != null ? Excalidraw : (Excalidraw as any).default;

	return createPortal(
		<div
			className='fixed inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-60 z-50'
			role='dialog'>
			<div
				className='relative top-50px left-0 flex justify-center items-center rounded-lg bg-gray-200'
				ref={excaliDrawModelRef}
				tabIndex={-1}>
				<div className='relative p-10 w-3/4 h-3/4 bg-white rounded-lg shadow-lg'>
					{discardModalOpen && <ShowDiscardDialog />}
					<_Excalidraw
						onChange={onChange}
						ref={excaliDrawSceneRef}
						initialData={{
							appState: initialAppState || { isLoading: false },
							elements: initialElements,
							files: initialFiles,
						}}
					/>
					<div className='absolute right-5 top-5 z-10'>
						<button
							className='bg-gray-200 border-0 px-3 py-2 relative ml-2 rounded-full text-gray-700 inline-block cursor-pointer'
							onClick={discard}>
							Discard
						</button>
						<button
							className='bg-gray-200 border-0 px-3 py-2 relative ml-2 rounded-full text-gray-700 inline-block cursor-pointer'
							onClick={save}>
							Save
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
}
