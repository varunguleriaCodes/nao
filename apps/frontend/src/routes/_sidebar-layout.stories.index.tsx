import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DisplayMode, GroupBy, StoryArchiveState } from '@/lib/stories-page';
import { StoriesEmptyState, StoriesGroups, StoriesNoResults } from '@/components/stories-groups';
import { StoriesToolbarControls } from '@/components/stories-toolbar-controls';
import { MobileHeader } from '@/components/mobile-header';
import { useSession } from '@/lib/auth-client';
import {
	STORIES_DISPLAY_KEY,
	STORIES_GROUP_KEY,
	buildStoryItems,
	filterStories,
	getStoredSetting,
	groupStories,
	STORIES_ARCHIVE_KEY,
} from '@/lib/stories-page';
import { trpc } from '@/main';

export const Route = createFileRoute('/_sidebar-layout/stories/')({
	component: StoriesPage,
});

function StoriesPage() {
	const { data: session } = useSession();
	const [displayMode, setDisplayMode] = useState<DisplayMode>(() =>
		getStoredSetting(STORIES_DISPLAY_KEY, ['grid', 'lines'], 'grid'),
	);
	const [groupBy, setGroupBy] = useState<GroupBy>(() =>
		getStoredSetting(STORIES_GROUP_KEY, ['ownership', 'date', 'user'], 'ownership'),
	);
	const [archiveState, setArchiveState] = useState<StoryArchiveState>(() =>
		getStoredSetting(STORIES_ARCHIVE_KEY, ['archived', 'unarchived'], 'unarchived'),
	);
	const [searchQuery, setSearchQuery] = useState('');
	const userStories = useQuery(trpc.story.listAll.queryOptions());
	const archivedStories = useQuery({
		...trpc.story.listArchived.queryOptions(),
		enabled: archiveState === 'archived',
	});
	const sharedStories = useQuery(trpc.storyShare.list.queryOptions());

	const queryClient = useQueryClient();
	const archiveMutation = useMutation(
		trpc.story.archive.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.story.listAll.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.story.listArchived.queryKey() });
			},
		}),
	);

	const handleArchive = async (
		e: React.MouseEvent,
		item: { kind: string; link: any },
		currentArchiveState: StoryArchiveState,
	) => {
		e.preventDefault();
		e.stopPropagation();
		if (item.kind !== 'own') {
			return;
		}
		if (item.link.to === '/stories/preview/$chatId/$storyId') {
			const { chatId, storyId } = item.link.params;
			await archiveMutation.mutateAsync({ chatId, storyId, archived: currentArchiveState === 'unarchived' });
		}
	};

	const currentUserName = session?.user?.name ?? 'Me';
	const currentUserId = session?.user?.id;

	const allItems = useMemo(() => {
		const stories = archiveState === 'archived' ? (archivedStories.data ?? []) : (userStories.data ?? []);
		return buildStoryItems({
			userStories: stories,
			sharedStories: archiveState === 'archived' ? [] : (sharedStories.data ?? []),
			currentUserId,
			currentUserName,
		});
	}, [archiveState, userStories.data, archivedStories.data, sharedStories.data, currentUserId, currentUserName]);

	const filteredItems = useMemo(() => {
		return filterStories(allItems, searchQuery);
	}, [allItems, searchQuery]);

	const groups = useMemo(() => groupStories(filteredItems, groupBy), [filteredItems, groupBy]);

	const isLoading =
		archiveState === 'archived' ? archivedStories.isLoading : userStories.isLoading || sharedStories.isLoading;
	const isEmpty = allItems.length === 0 && !isLoading;

	function handleDisplayChange(mode: DisplayMode) {
		setDisplayMode(mode);
		localStorage.setItem(STORIES_DISPLAY_KEY, mode);
	}

	function handleGroupChange(value: GroupBy) {
		setGroupBy(value);
		localStorage.setItem(STORIES_GROUP_KEY, value);
	}

	function handleArchiveStateChange(value: StoryArchiveState) {
		setArchiveState(value);
		localStorage.setItem(STORIES_ARCHIVE_KEY, value);
	}

	return (
		<div className='flex flex-col flex-1 h-full overflow-auto bg-panel'>
			<MobileHeader />
			<div className='w-full px-4 py-6 md:px-8 md:py-10'>
				<div className='flex items-center justify-between mb-6 md:mb-8 gap-3 flex-wrap'>
					<h1 className='text-xl font-semibold tracking-tight'>Stories</h1>
					<StoriesToolbarControls
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						groupBy={groupBy}
						onGroupByChange={handleGroupChange}
						displayMode={displayMode}
						onDisplayModeChange={handleDisplayChange}
						archiveState={archiveState}
						onArchiveStateChange={handleArchiveStateChange}
						isEmpty={isEmpty}
					/>
				</div>

				{isEmpty && <StoriesEmptyState archiveState={archiveState} />}

				{!isLoading && !isEmpty && groups.length === 0 && searchQuery.trim() && (
					<StoriesNoResults query={searchQuery} />
				)}
				<StoriesGroups
					groups={groups}
					displayMode={displayMode}
					onArchive={handleArchive}
					isArchiving={archiveMutation.isPending}
					archiveState={archiveState}
				/>
			</div>
		</div>
	);
}