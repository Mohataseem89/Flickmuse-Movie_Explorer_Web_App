import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { getImageUrl } from "../api/tmdb";

export default function PersonCard({ person }) {
  const photo = getImageUrl(
    person.profile_path,
    "w185"
  );

  const known = (person.known_for || [])
    .slice(0, 3)
    .map((x) => x.title || x.name)
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      to={`/person/${person.id}`}
      className="group rounded-2xl border border-white/10 bg-[#11151c] p-3 transition hover:border-white/20"
    >
      <span className="block aspect-[2/3] overflow-hidden rounded-xl bg-[#171c25]">
        {photo ? (
          <img
            src={photo}
            alt=""
            width="185"
            height="278"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-gray-400">
            <UserRound className="h-8 w-8" />
          </span>
        )}
      </span>

      <span className="mt-3 block font-bold text-white group-hover:text-red-400">
        {person.name}
      </span>

      <span className="mt-1 block text-xs text-gray-400">
        {person.known_for_department || "Person"}
      </span>

      {known && (
        <span className="mt-2 line-clamp-2 block text-xs leading-5 text-gray-400">
          Known for: {known}
        </span>
      )}
    </Link>
  );
}