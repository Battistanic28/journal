import { getCollection } from "astro:content"

export const getRecentPosts = async () => {
    const posts = await getCollection('ramblings')

    // TODO: return 5 most recent posts in order of publication
    return posts
}
