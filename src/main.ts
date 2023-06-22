import { Devvit, Context, ContextActionResponse, ContextActionEvent, UserContext, ConfigFormBuilder, RedditAPIClient, BanUserOptions } from '@devvit/public-api';
import { Metadata } from '@devvit/protos';
// Visit developers.reddit.com/docs to view documentation for the Devvit api

const reddit = new RedditAPIClient();

Devvit.addActions([
    {
        name: "Ban (Likely Bot)",
        description: "Ban user suspected to be bot",
        userContext: UserContext.MODERATOR,
        context: [Context.POST, Context.COMMENT],
        handler: async (event: ContextActionEvent, metadata?: Metadata): Promise<ContextActionResponse> => {
            let author: string | undefined;
            let id: string | undefined;
            if(event.context === Context.COMMENT){
                id = event.comment.name
                author = event.comment.author;
            } else if(event.context === Context.POST){
                id = event.post.name
                author = event.post.author
            }

            if(typeof author === undefined || typeof id === undefined) {
                return {
                    success: false,
                    message: "Content or author not found."
                };
            }

            const subreddit = await reddit.getCurrentSubreddit(metadata);

            await Promise.all([
                reddit.banUser({
                    username: author!,
                    subredditName: subreddit.name,
                    note: "likely bot",
                    reason: "likely bot",
                    context: id!,
                }, metadata),
                reddit.addModNote({
                    subreddit: subreddit.name,
                    user: author!,
                    label: "BOT_BAN",
                    redditId: id!,
                    note: "Likely bot",
                }, metadata),
                reddit.remove(id!, true, metadata)
            ]);

            return {
                success: true,
                message: "User has been banned",
            };
        },
    },
]);

export default Devvit;
