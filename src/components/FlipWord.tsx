"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "matched.",
  "noticed.",
  "shortlisted.",
  "hired.",
  "paid.",
];

const LONGEST = "shortlisted.";

export default function FlipWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block align-baseline">
      {/* ghost word reserves width of the longest word */}
      <span aria-hidden="true" className="invisible whitespace-nowrap">
        {LONGEST}
      </span>
      <span className="absolute inset-0 overflow-hidden">
        <span key={index} className="inline-block animate-flip-up whitespace-nowrap text-acid">
          {WORDS[index]}
        </span>
      </span>
    </span>
  );
}
