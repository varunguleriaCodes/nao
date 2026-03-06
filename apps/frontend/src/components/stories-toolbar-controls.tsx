import { LayoutGrid, List, Search, X, Archive, ArchiveRestore } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { DisplayMode, GroupBy, StoryArchiveState } from '@/lib/stories-page';
import { GROUP_BY_LABELS } from '@/lib/stories-page';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StoriesToolbarControls({
	searchQuery,
	onSearchQueryChange,
	groupBy,
	onGroupByChange,
	displayMode,
	onDisplayModeChange,
	archiveState,
	onArchiveStateChange,
	isEmpty,
}: {
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	groupBy: GroupBy;
	onGroupByChange: (value: GroupBy) => void;
	displayMode: DisplayMode;
	onDisplayModeChange: (value: DisplayMode) => void;
	archiveState: StoryArchiveState;
	onArchiveStateChange: (value: StoryArchiveState) => void;
	isEmpty?: boolean;
}) {
	return (
		<div className='flex items-center gap-1'>
			{!isEmpty && <SearchInput value={searchQuery} onChange={onSearchQueryChange} />}
			{!isEmpty && <GroupBySelect value={groupBy} onChange={onGroupByChange} />}
			{!isEmpty && <DisplayModeToggle value={displayMode} onChange={onDisplayModeChange} />}
			<StoryArchiveType value={archiveState} onChange={onArchiveStateChange} />
		</div>
	);
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
		}
	}, [open]);

	function handleClose() {
		setOpen(false);
		onChange('');
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	if (!open) {
		return (
			<Button variant='ghost' size='icon-xs' onClick={() => setOpen(true)} aria-label='Search stories'>
				<Search className='size-4' strokeWidth={1.5} />
			</Button>
		);
	}

	return (
		<div className='flex items-center gap-1 rounded-md border px-2 py-0.5'>
			<Search className='size-3.5 text-muted-foreground shrink-0' />
			<input
				ref={inputRef}
				type='text'
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={handleKeyDown}
				placeholder='Search stories...'
				className='bg-transparent text-sm outline-none placeholder:text-muted-foreground w-40'
			/>
			<button type='button' onClick={handleClose} className='text-muted-foreground hover:text-foreground'>
				<X className='size-3.5' />
			</button>
		</div>
	);
}

function GroupBySelect({ value, onChange }: { value: GroupBy; onChange: (value: GroupBy) => void }) {
	return (
		<Select value={value} onValueChange={(nextValue) => onChange(nextValue as GroupBy)}>
			<SelectTrigger variant='ghost' size='sm'>
				<span className='text-muted-foreground'>Group by</span>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{(Object.keys(GROUP_BY_LABELS) as GroupBy[]).map((key) => (
					<SelectItem key={key} value={key}>
						{GROUP_BY_LABELS[key]}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function DisplayModeToggle({ value, onChange }: { value: DisplayMode; onChange: (value: DisplayMode) => void }) {
	return (
		<div className='flex items-center gap-0.5 rounded-md border p-0.5'>
			<Button
				variant={value === 'grid' ? 'ghost' : 'ghost-muted'}
				size='icon-xs'
				onClick={() => onChange('grid')}
				className={cn(value === 'grid' && 'bg-accent')}
				aria-label='Grid view'
			>
				<LayoutGrid />
			</Button>
			<Button
				variant={value === 'lines' ? 'ghost' : 'ghost-muted'}
				size='icon-xs'
				onClick={() => onChange('lines')}
				className={cn(value === 'lines' && 'bg-accent')}
				aria-label='List view'
			>
				<List />
			</Button>
		</div>
	);
}

function StoryArchiveType({
	value,
	onChange,
}: {
	value: StoryArchiveState;
	onChange: (value: StoryArchiveState) => void;
}) {
	return (
		<div className='flex items-center gap-0.5 rounded-md border p-0.5'>
			<Button
				variant={value === 'unarchived' ? 'ghost' : 'ghost-muted'}
				size='icon-xs'
				onClick={() => onChange('unarchived')}
				className={cn(value === 'unarchived' && 'bg-accent')}
				aria-label='Unarchived view'
			>
				<ArchiveRestore />
			</Button>
			<Button
				variant={value === 'archived' ? 'ghost' : 'ghost-muted'}
				size='icon-xs'
				onClick={() => onChange('archived')}
				className={cn(value === 'archived' && 'bg-accent')}
				aria-label='Archived view'
			>
				<Archive />
			</Button>
		</div>
	);
}