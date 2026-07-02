import { getCollection } from "astro:content"

// returns array of 5 most recent posts in reverse chronological order
export const getRecentPosts = async (count?: number) => {
    const posts = await getCollection('ramblings')

    const sortedPosts = posts.sort((a, b) => new Date(b.data.published) - new Date(a.data.published));

    if (count) {
        return sortedPosts.slice(0,count)
    }

    return sortedPosts
}
