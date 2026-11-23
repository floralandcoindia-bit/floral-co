import { Play } from "lucide-react";
import Reveal from "../common/Reveal";
import LazyImage from "../common/LazyImage";

/** Masonry layout via CSS columns; each post keeps its own proportions. */
export default function TrendingGrid({ posts, onOpen }) {
  return (
    <ul className="columns-2 gap-3 md:columns-3 md:gap-5 lg:columns-4">
      {posts.map((post, i) => (
        <li key={post.id} className="mb-3 break-inside-avoid md:mb-5">
          <Reveal y={24} delay={(i % 4) * 0.06}>
            <button
              type="button"
              onClick={() => onOpen(post)}
              aria-label={`Open post: ${post.caption}`}
              className="group relative block w-full overflow-hidden rounded-sm bg-evergreen text-left"
            >
              <div className="transition-transform duration-700 ease-out-expo group-hover:scale-105">
                <LazyImage src={post.poster || post.src} alt={post.caption} ratio={`${post.width}/${post.height}`} />
              </div>

              {post.type === "video" && (
                <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-forest/75 text-ivory" aria-hidden="true">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              )}

              <span className="absolute bottom-3 left-3 rounded-full bg-forest/75 px-3 py-1 text-xs text-ivory backdrop-blur-sm">
                {post.category}
              </span>

              <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-forest/80 p-4 pt-10 text-sm leading-snug text-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:hover)]:block">
                {post.caption}
              </span>
            </button>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
