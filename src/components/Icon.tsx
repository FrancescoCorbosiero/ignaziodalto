const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  heart: <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4Z" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  share: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  chat: <path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19L4 20Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  check: <path d="m5 12 5 5 9-10" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, title }: { name: IconName; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}

/** Stand-in when the feed has no picture: a sneaker drawn in two strokes. */
export function ShoeMark() {
  return (
    <svg class="shoe-mark" viewBox="0 0 200 160" fill="none" stroke="#b9b4a8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M30 104c0-14 6-30 14-36 9 8 24 12 40 10l20 14c18 10 40 12 58 14 10 1 16 8 16 16v4H30v-22Z" />
      <path d="M30 120h148M84 78l8-10M98 86l8-10M112 94l8-10" />
    </svg>
  );
}
